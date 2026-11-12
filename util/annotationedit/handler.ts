import { compile } from '@mdx-js/mdx';
import fs from 'fs';
import { load } from 'js-yaml';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { EditRefusal, highlightOrder, wrapPassage } from './mdx';
import {
  HIGHLIGHT_COLORS,
  newAnnotationSetYaml,
  registerAnnotationSet,
} from './sets';
import { appendAddendum, groupOf, hasEntry, insertAnnotation } from './yaml';

export type EditResponse = { ok: true } | { ok: false; error: string };

export type HandlerOptions = {
  // The root of the repository. Defaults to the working directory.
  rootDir?: string;
  // The current time. Defaults to now.
  now?: Date;
};

const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];
const LOOPBACK_ADDRESSES = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

function headerValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/**
 * checkRequest returns the status and error with which to refuse a request
 * that didn't come from the page served by this machine's dev server, if any.
 * Without it, other machines on the network could ask the dev server to edit
 * the paper, as it listens to them too, and so could any web page open in a
 * browser on this machine.
 */
function checkRequest(
  req: NextApiRequest
): { status: number; error: string } | undefined {
  if (req.method !== 'POST') {
    return { status: 405, error: 'Method not allowed' };
  }

  // The Host header is whatever the sender says it is, so check where the
  // request really came from as well.
  if (!LOOPBACK_ADDRESSES.includes(req.socket?.remoteAddress ?? '')) {
    return { status: 403, error: 'Only available from this machine' };
  }

  const host = headerValue(req.headers.host);
  const hostname = host.replace(/:\d+$/, '').toLowerCase();
  if (!LOOPBACK_HOSTNAMES.includes(hostname)) {
    return { status: 403, error: 'Only available on localhost' };
  }

  const origin = headerValue(req.headers.origin);
  if (origin) {
    let originHost: string | undefined;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = undefined;
    }
    if (originHost !== host.toLowerCase()) {
      return { status: 403, error: 'Cross-origin requests are not allowed' };
    }
  }

  const contentType = headerValue(req.headers['content-type']);
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return { status: 415, error: 'Expected application/json' };
  }

  return undefined;
}

// Set and entry ids are lowercase words joined by dashes. Sets are files named
// after their id, so this also keeps requests to the files under content/.
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const isId = (value: unknown): value is string =>
  typeof value === 'string' && ID.test(value);
const isText = (value: unknown): value is string => typeof value === 'string';
const isPosition = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

// A day in local time, as YYYY-MM-DD.
function localDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

// Reads an annotation set's source, given the id of the set.
function readAnnotationSet(
  rootDir: string,
  setId: unknown
): { yamlPath: string; yaml: string } {
  const yamlPath = isId(setId)
    ? path.join(rootDir, 'content', `annotations-${setId}.yaml`)
    : undefined;
  if (!yamlPath || !fs.existsSync(yamlPath)) {
    throw new EditRefusal(`Unknown annotation set ${JSON.stringify(setId)}`);
  }
  return { yamlPath, yaml: fs.readFileSync(yamlPath, 'utf8') };
}

// Checks that an edited annotation set can still be read, and has what was
// just added to it.
function checkAnnotationSet(yaml: string, find: (set: any) => unknown): void {
  let found: unknown;
  try {
    found = find(load(yaml));
  } catch {
    found = undefined;
  }
  if (!found) {
    throw new Error('The edit would have left the annotation set unreadable');
  }
}

async function addAnnotation(rootDir: string, body: any): Promise<void> {
  const { setId, entryId, content, pageNumber, column } = body;
  const { selectedText, before, after } = body;
  if (!isId(entryId)) {
    throw new EditRefusal(
      'The entry id must be lowercase words joined by dashes'
    );
  }
  if (
    !isText(content) ||
    !isText(selectedText) ||
    !isText(before) ||
    !isText(after) ||
    !isPosition(pageNumber) ||
    !isPosition(column)
  ) {
    throw new EditRefusal('Malformed request');
  }

  const { yamlPath, yaml } = readAnnotationSet(rootDir, setId);
  if (hasEntry(yaml, entryId)) {
    throw new EditRefusal(`Entry id "${entryId}" already exists in this set`);
  }

  const mdxPath = path.join(rootDir, 'content', 'zanzibar.mdx');
  const mdx = fs.readFileSync(mdxPath, 'utf8');
  const newMdx = wrapPassage(
    mdx,
    { pageNumber, column, selectedText, before, after },
    setId,
    entryId
  );

  // The paper has to still compile with the highlight in it.
  try {
    await compile(newMdx, { remarkPlugins: [remarkGfm, remarkMath] });
  } catch (error) {
    throw new EditRefusal(
      `The paper would no longer compile with this highlight: ${
        error instanceof Error ? error.message : error
      }`
    );
  }

  // Annotations are shown in the order they're listed, so list this one
  // where its highlight falls among the others of its group in the column.
  const order = highlightOrder(newMdx, pageNumber, column, setId);
  const groupId = `page-${pageNumber}-col-${column}`;
  const newYaml = insertAnnotation(yaml, {
    groupId,
    entryId,
    content,
    beforeEntryId: order
      .slice(order.indexOf(entryId) + 1)
      .find((following) => groupOf(yaml, following) === groupId),
  });
  checkAnnotationSet(newYaml, (set) => set.groups[groupId][entryId].content);

  // Both edits are known to be good by now. If the second can't be written,
  // undo the first.
  fs.writeFileSync(mdxPath, newMdx);
  try {
    fs.writeFileSync(yamlPath, newYaml);
  } catch (error) {
    fs.writeFileSync(mdxPath, mdx);
    throw error;
  }
}

function addAddendum(rootDir: string, now: Date, body: any): void {
  const { setId, entryId, content, author } = body;
  if (
    !isId(entryId) ||
    !isText(content) ||
    (author !== undefined && !isText(author))
  ) {
    throw new EditRefusal('Malformed request');
  }

  const { yamlPath, yaml } = readAnnotationSet(rootDir, setId);
  const date = localDate(now);
  const newYaml = appendAddendum(yaml, { entryId, date, author, content });

  // The annotation has one more addendum than it had, and it's the last.
  const addendaOf = (set: any): any[] =>
    Object.values<any>(set.groups).find((group) => group?.[entryId])?.[entryId]
      .addenda ?? [];
  const had = addendaOf(load(yaml)).length;
  checkAnnotationSet(newYaml, (set) => {
    const addenda = addendaOf(set);
    return addenda.length === had + 1 && addenda[had].date === date;
  });

  fs.writeFileSync(yamlPath, newYaml);
}

const isOptionalText = (value: unknown): value is string | undefined =>
  value === undefined || isText(value);

function isWebUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function addSet(rootDir: string, body: any): void {
  const { id, label, title, subtitle, cta, description, highlightColor } = body;
  const { authorName, authorUrl, authorAvatar } = body;
  if (!isId(id)) {
    throw new EditRefusal('The set id must be lowercase words joined by dashes');
  }
  if (!isText(label) || !label.trim()) {
    throw new EditRefusal('The set needs a label');
  }
  if (!HIGHLIGHT_COLORS.includes(highlightColor)) {
    throw new EditRefusal(
      `The highlight color must be one of ${HIGHLIGHT_COLORS.join(', ')}`
    );
  }
  if (
    ![title, subtitle, cta, description, authorName, authorUrl, authorAvatar]
      .every(isOptionalText)
  ) {
    throw new EditRefusal('Malformed request');
  }
  // Authors are credited with a link to their page.
  if (authorName?.trim() && !isWebUrl(authorUrl?.trim() ?? '')) {
    throw new EditRefusal(
      'The author needs a URL that starts with http:// or https://'
    );
  }
  if (authorAvatar?.trim() && !/^\/[\w./-]+$/.test(authorAvatar.trim())) {
    throw new EditRefusal(
      'The author’s picture must be a path under public/, such as /authors/name.jpg'
    );
  }

  const yamlPath = path.join(rootDir, 'content', `annotations-${id}.yaml`);
  if (fs.existsSync(yamlPath)) {
    throw new EditRefusal(`Annotation set "${id}" already exists`);
  }

  // What's left out falls back to the label, as the page shows each of them.
  const text = (value: string | undefined, fallback: string) =>
    value?.trim() || fallback;
  const yaml = newAnnotationSetYaml({
    id,
    label,
    title: text(title, label),
    subtitle: text(subtitle, ''),
    cta: text(cta, text(subtitle, label)),
    description: text(description, text(subtitle, label)),
    highlightColor,
    author: authorName?.trim()
      ? { name: authorName, url: authorUrl, avatar: authorAvatar }
      : undefined,
  });
  checkAnnotationSet(yaml, (set) => set.id === id && set.label);

  const registryPath = path.join(rootDir, 'content', 'annotation-sets.ts');
  const newRegistry = registerAnnotationSet(
    fs.readFileSync(registryPath, 'utf8'),
    id
  );

  // Don't leave behind a set that the page doesn't know of.
  fs.writeFileSync(yamlPath, yaml, { flag: 'wx' });
  try {
    fs.writeFileSync(registryPath, newRegistry);
  } catch (error) {
    fs.rmSync(yamlPath, { force: true });
    throw error;
  }
}

/**
 * handleAnnotationEdit handles the requests made by the paper's edit mode,
 * which add annotations, addenda and annotation sets to the files under
 * content/. It only
 * answers under `next dev`, and its route only exists there: see
 * next.config.mjs.
 */
export async function handleAnnotationEdit(
  req: NextApiRequest,
  res: NextApiResponse<EditResponse>,
  options: HandlerOptions = {}
): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).json({ ok: false, error: 'Not found' });
    return;
  }

  const refusal = checkRequest(req);
  if (refusal) {
    res.status(refusal.status).json({ ok: false, error: refusal.error });
    return;
  }

  const rootDir = options.rootDir ?? process.cwd();
  const body = req.body ?? {};
  try {
    switch (body.action) {
      case 'add-annotation':
        await addAnnotation(rootDir, body);
        break;

      case 'add-addendum':
        addAddendum(rootDir, options.now ?? new Date(), body);
        break;

      case 'add-set':
        addSet(rootDir, body);
        break;

      default:
        throw new EditRefusal('Unknown action');
    }
  } catch (error) {
    if (error instanceof EditRefusal) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  res.status(200).json({ ok: true });
}
