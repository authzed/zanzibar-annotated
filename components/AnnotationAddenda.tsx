import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Addendum, addendumLabel } from '../util/addendum';

/**
 * AnnotationAddenda shows the addenda made to an annotation, oldest first,
 * below the annotation itself.
 */
export function AnnotationAddenda(props: { addenda?: Addendum[] }) {
  if (!props.addenda?.length) {
    return null;
  }

  return (
    <>
      {props.addenda.map((addendum, index) => (
        <div
          key={index}
          data-testid="annotation-addendum"
          className="addendum border-t border-slate-300 mt-3 pt-2"
        >
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {addendumLabel(addendum)}
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
            {addendum.content}
          </ReactMarkdown>
        </div>
      ))}
    </>
  );
}
