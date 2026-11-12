import fs from 'fs';
import path from 'path';
import annotationsIntro from '../content/annotations-intro.yaml';
import annotationsSpiceDb from '../content/annotations-spicedb.yaml';
import { AnnotationSetSource, paperToMarkdown } from './papermarkdown';

/**
 * getAnnotationSetSources returns the annotation sets as written. Server only.
 */
export function getAnnotationSetSources(): AnnotationSetSource[] {
  return [annotationsIntro, annotationsSpiceDb];
}

let markdown: string | undefined;

/**
 * getPaperMarkdown returns the markdown edition of the paper. The paper's
 * source is read from disk, and the result is cached for the life of the
 * server. Server only.
 */
export function getPaperMarkdown(): string {
  markdown ??= paperToMarkdown(
    fs.readFileSync(path.join(process.cwd(), 'content/zanzibar.mdx'), 'utf8'),
    getAnnotationSetSources()
  );
  return markdown;
}
