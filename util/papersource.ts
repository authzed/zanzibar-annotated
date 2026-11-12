import fs from 'fs';
import path from 'path';
import { ANNOTATION_SETS } from '../content/annotation-sets';
import { AnnotationSetSource, paperToMarkdown } from './papermarkdown';

/**
 * getAnnotationSetSources returns the annotation sets as written. Server only.
 */
export function getAnnotationSetSources(): AnnotationSetSource[] {
  return ANNOTATION_SETS;
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
