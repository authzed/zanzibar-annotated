import { EditRefusal } from './mdx';

/**
 * The colors a new annotation set can be highlighted in. Tailwind only keeps
 * the classes of the colors listed in tailwind.config.js, so the two lists
 * have to agree.
 */
export const HIGHLIGHT_COLORS = [
  'amber',
  'sky',
  'emerald',
  'rose',
  'violet',
  'lime',
  'orange',
  'teal',
  'fuchsia',
];

/**
 * NewAnnotationSet is an annotation set to create.
 */
export type NewAnnotationSet = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  cta: string;
  description: string;
  highlightColor: string;
  author?: { name: string; url?: string; avatar?: string };
};

// A single-quoted YAML scalar holding the given text on one line.
const quoted = (text: string) =>
  `'${text.replace(/\s+/g, ' ').trim().replace(/'/g, "''")}'`;

/**
 * newAnnotationSetYaml returns the source of a new annotation set, which has
 * no annotations yet.
 */
export function newAnnotationSetYaml(set: NewAnnotationSet): string {
  const author = set.author?.name.trim() ? set.author : undefined;
  return [
    `id: ${quoted(set.id)}`,
    `label: ${quoted(set.label)}`,
    `title: ${quoted(set.title)}`,
    `subtitle: ${quoted(set.subtitle)}`,
    `cta: ${quoted(set.cta)}`,
    `description: ${quoted(set.description)}`,
    `highlightColor: ${quoted(set.highlightColor)}`,
    ...(author
      ? [
          'author:',
          `  name: ${quoted(author.name)}`,
          ...(author.url?.trim() ? [`  url: ${quoted(author.url)}`] : []),
          ...(author.avatar?.trim()
            ? [`  avatar: ${quoted(author.avatar)}`]
            : []),
        ]
      : []),
    'groups:',
    '',
  ].join('\n');
}

// Words that can't name an import.
const RESERVED = /^(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|let|new|null|return|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|await|any)$/;

// The name a set is imported under in the registry.
function importName(setId: string, taken: (name: string) => boolean): string {
  const words = setId.split('-');
  const pascal = words
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
  const camel = pascal[0].toLowerCase() + pascal.slice(1);
  return /^\d/.test(camel) || RESERVED.test(camel) || taken(camel)
    ? `set${pascal}`
    : camel;
}

/**
 * registerAnnotationSet returns the source of the registry of annotation sets,
 * content/annotation-sets.ts, with the set with the given id added to the end
 * of it. The set's file is named after its id.
 */
export function registerAnnotationSet(registry: string, setId: string): string {
  const path = `./annotations-${setId}.yaml`;
  if (registry.includes(`'${path}'`)) {
    throw new EditRefusal(`Annotation set "${setId}" is already listed`);
  }

  const lines = registry.split('\n');
  const lastImport = lines.findLastIndex((line) => /^import .* from '/.test(line));
  const listStart = lines.findIndex((line) =>
    /^export const ANNOTATION_SETS\b.*\[\s*$/.test(line)
  );
  const listEnd = lines.findIndex(
    (line, index) => index > listStart && /^\];?\s*$/.test(line)
  );
  if (lastImport < 0 || listStart < lastImport || listEnd < 0) {
    throw new EditRefusal(
      'content/annotation-sets.ts is not laid out as expected; add the set to it by hand'
    );
  }

  const name = importName(setId, (candidate) =>
    new RegExp(`\\b${candidate}\\b`).test(registry)
  );
  lines.splice(listEnd, 0, `  ${name},`);
  lines.splice(lastImport + 1, 0, `import ${name} from '${path}';`);
  return lines.join('\n');
}
