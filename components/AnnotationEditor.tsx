import debounce from 'lodash.debounce';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import slugify from 'slugify';
import { getAvailableAnnotationSets } from './annotation';
import { useEditMode } from './editmode';

// The dev-only route that writes annotations and addenda to the files under
// content/. See util/annotationedit/handler.ts.
const EDIT_ENDPOINT = '/api/dev/annotations';

// Where the last used annotation set and addendum author are remembered.
const SET_STORAGE_KEY = 'za-edit-set';
const AUTHOR_STORAGE_KEY = 'za-edit-author';

// How much of the text around a selection is sent along with it, to tell
// apart passages that read the same.
const CONTEXT_LENGTH = 40;

const ENTRY_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const PAGE_SELECTOR = '[data-page-number]';
const COLUMN_SELECTOR = '.page-column';

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
};

// A selection of the paper that an annotation is being written for.
type Passage = {
  anchor: VirtualElement;
  // Why the selection can't be annotated, if it can't.
  problem?: string;
  pageNumber: number;
  column: number;
  selectedText: string;
  before: string;
  after: string;
};

function readStored(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Remembering the value is only a convenience.
  }
}

const closestElement = (node: Node, selector: string) =>
  (node instanceof Element ? node : node.parentElement)?.closest(selector) ??
  null;

/**
 * passageOf describes the selected range of the paper, or returns undefined if
 * the selection isn't on a page of the paper.
 */
function passageOf(range: Range): Passage | undefined {
  const page = closestElement(range.startContainer, PAGE_SELECTOR);
  if (!page) {
    return undefined;
  }

  // The range is kept so that the editor follows the passage as the paper
  // scrolls.
  const kept = range.cloneRange();
  const passage: Passage = {
    anchor: { getBoundingClientRect: () => kept.getBoundingClientRect() },
    pageNumber: Number(page.getAttribute('data-page-number')),
    column: 0,
    selectedText: range.toString(),
    before: '',
    after: '',
  };

  const column = closestElement(range.startContainer, COLUMN_SELECTOR);
  if (!column || column !== closestElement(range.endContainer, COLUMN_SELECTOR)) {
    return {
      ...passage,
      problem: 'Select text within a single column of the paper.',
    };
  }

  const before = document.createRange();
  before.selectNodeContents(column);
  before.setEnd(range.startContainer, range.startOffset);
  const after = document.createRange();
  after.selectNodeContents(column);
  after.setStart(range.endContainer, range.endOffset);

  return {
    ...passage,
    column:
      Array.from(page.querySelectorAll(COLUMN_SELECTOR)).indexOf(column) + 1,
    before: before.toString().slice(-CONTEXT_LENGTH),
    after: after.toString().slice(0, CONTEXT_LENGTH),
  };
}

/**
 * suggestEntryId suggests an id for an annotation of the given text, from its
 * first few words.
 */
function suggestEntryId(text: string): string {
  return slugify(text.trim().split(/\s+/).slice(0, 5).join(' '), {
    lower: true,
    strict: true,
  });
}

/**
 * useSave returns a function that sends an edit to the dev server, along with
 * the state of the last edit sent.
 */
function useSave(onSaved: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(EDIT_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({
        ok: false,
        error: `The dev server answered ${response.status}; see its log.`,
      }));
      if (!result.ok) {
        setError(result.error ?? 'The edit could not be saved.');
        return;
      }
      // The dev server reloads the changed content by itself.
      onSaved();
    } catch {
      setError('Could not reach the dev server.');
    } finally {
      setSaving(false);
    }
  };

  return { save, saving, error, clearError: () => setError('') };
}

const FIELD_CLASS =
  'block w-full border border-slate-300 rounded px-2 py-1 mt-1 mb-2 bg-white';
const PANEL_CLASS =
  'w-96 max-w-full p-3 bg-white text-black font-sans text-sm shadow-xl outline outline-1 outline-slate-400 border-t-4 border-emerald-500 z-50';

function Buttons(props: {
  saving: boolean;
  canSave: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" className="px-3 py-1" onClick={props.onCancel}>
        Cancel
      </button>
      <button
        type="submit"
        className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
        disabled={props.saving || !props.canSave}
      >
        {props.saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

/**
 * Editor for writing an annotation of the selected passage of the paper.
 */
function PassageEditor(props: {
  passage: Passage;
  onClose: () => void;
  // Called as the annotation is written, with whether there's any of it.
  onDraft: (written: boolean) => void;
}) {
  const { passage, onClose, onDraft } = props;
  const sets = getAvailableAnnotationSets();
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(passage.anchor, popperElement, {
    placement: 'bottom',
    modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
  });

  const [setId, setSetId] = useState(() => {
    const stored = readStored(SET_STORAGE_KEY);
    return sets.some((set) => set.value === stored) ? stored : sets[0]?.value;
  });
  const [entryId, setEntryId] = useState(() =>
    suggestEntryId(passage.selectedText)
  );
  const [content, setContent] = useState('');
  const { save, saving, error } = useSave(() => {
    document.getSelection()?.removeAllRanges();
    onClose();
  });

  const validEntryId = ENTRY_ID.test(entryId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save({
      action: 'add-annotation',
      setId,
      entryId,
      content,
      pageNumber: passage.pageNumber,
      column: passage.column,
      selectedText: passage.selectedText,
      before: passage.before,
      after: passage.after,
    });
  };

  return (
    <div
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
      data-testid="annotation-editor"
      className={PANEL_CLASS}
    >
      {passage.problem ? (
        <>
          <p data-testid="annotation-editor-error" className="text-red-700">
            {passage.problem}
          </p>
          <div className="flex justify-end">
            <button type="button" className="px-3 py-1" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={submit}>
          <p className="mb-2 italic text-slate-600 line-clamp-2">
            “{passage.selectedText.trim()}”
          </p>
          <label>
            Annotation set
            <select
              className={FIELD_CLASS}
              value={setId}
              onChange={(e) => {
                setSetId(e.target.value);
                writeStored(SET_STORAGE_KEY, e.target.value);
              }}
            >
              {sets.map((set) => (
                <option key={set.value} value={set.value}>
                  {set.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Entry id
            <input
              className={`${FIELD_CLASS} font-mono ${
                validEntryId ? '' : 'border-red-500'
              }`}
              value={entryId}
              spellCheck={false}
              onChange={(e) => setEntryId(e.target.value)}
            />
          </label>
          <label>
            Annotation (markdown)
            <textarea
              className={FIELD_CLASS}
              rows={6}
              autoFocus
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onDraft(e.target.value.trim() !== '');
              }}
            />
          </label>
          {error && (
            <p
              data-testid="annotation-editor-error"
              className="mb-2 text-red-700"
            >
              {error}
            </p>
          )}
          <Buttons
            saving={saving}
            canSave={validEntryId && content.trim() !== ''}
            onCancel={onClose}
          />
        </form>
      )}
    </div>
  );
}

/**
 * Editor for writing an addendum to an existing annotation.
 */
function AddendumEditor(props: {
  setId: string;
  entryId: string;
  onClose: () => void;
}) {
  const { setId, entryId, onClose } = props;
  const [author, setAuthor] = useState(() => readStored(AUTHOR_STORAGE_KEY));
  const [content, setContent] = useState('');
  const { save, saving, error } = useSave(onClose);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    writeStored(AUTHOR_STORAGE_KEY, author.trim());
    save({
      action: 'add-addendum',
      setId,
      entryId,
      content,
      ...(author.trim() ? { author: author.trim() } : {}),
    });
  };

  return (
    <div
      data-testid="addendum-editor"
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${PANEL_CLASS}`}
    >
      <form onSubmit={submit}>
        <p className="mb-2 font-semibold">
          Addendum to{' '}
          <span className="font-mono">
            {setId}/{entryId}
          </span>
        </p>
        <label>
          Author
          <input
            className={FIELD_CLASS}
            placeholder="Author (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <label>
          Addendum (markdown)
          <textarea
            className={FIELD_CLASS}
            rows={6}
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
        {error && (
          <p data-testid="addendum-editor-error" className="mb-2 text-red-700">
            {error}
          </p>
        )}
        <Buttons
          saving={saving}
          canSave={content.trim() !== ''}
          onCancel={onClose}
        />
      </form>
    </div>
  );
}

// The colors a set can be highlighted in. Keep in step with HIGHLIGHT_COLORS
// in util/annotationedit/sets.ts, which the dev server checks them against.
const HIGHLIGHT_COLORS = [
  'emerald',
  'rose',
  'violet',
  'lime',
  'orange',
  'teal',
  'fuchsia',
  'amber',
  'sky',
];

/**
 * Editor for creating a new annotation set.
 */
function SetEditor(props: { onClose: () => void }) {
  const { onClose } = props;
  const taken = getAvailableAnnotationSets();
  const [fields, setFields] = useState({
    id: '',
    label: '',
    title: '',
    subtitle: '',
    cta: '',
    description: '',
    highlightColor:
      HIGHLIGHT_COLORS.find(
        (color) => !taken.some((set) => set.color === color)
      ) ?? HIGHLIGHT_COLORS[0],
    authorName: '',
    authorUrl: '',
    authorAvatar: '',
  });
  // The id follows the label until it's edited.
  const [idEdited, setIdEdited] = useState(false);
  const id = idEdited
    ? fields.id
    : slugify(fields.label, { lower: true, strict: true });
  const { save, saving, error } = useSave(() => {
    // Annotations are most likely to be added to the new set next.
    writeStored(SET_STORAGE_KEY, id);
    onClose();
  });

  const idProblem = !ENTRY_ID.test(id)
    ? 'lowercase words joined by dashes'
    : taken.some((set) => set.value === id)
      ? 'already used by another set'
      : '';

  const field = (
    name: keyof typeof fields,
    label: string,
    options: { placeholder?: string; multiline?: boolean } = {}
  ) => {
    const Input = options.multiline ? 'textarea' : 'input';
    return (
      <label>
        {label}
        <Input
          className={FIELD_CLASS}
          name={name}
          rows={options.multiline ? 2 : undefined}
          placeholder={options.placeholder}
          value={fields[name]}
          onChange={(e) => setFields({ ...fields, [name]: e.target.value })}
        />
      </label>
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save({ action: 'add-set', ...fields, id });
  };

  return (
    <div
      data-testid="set-editor"
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto ${PANEL_CLASS}`}
    >
      <form onSubmit={submit}>
        <p className="mb-2 font-semibold">New annotation set</p>
        {field('label', 'Label', {
          placeholder: 'Shown in the selector, e.g. SpiceDB vs Zanzibar',
        })}
        <label>
          Id{idProblem && id ? ` (${idProblem})` : ''}
          <input
            className={`${FIELD_CLASS} font-mono ${
              idProblem && id ? 'border-red-500' : ''
            }`}
            name="id"
            spellCheck={false}
            value={id}
            onChange={(e) => {
              setIdEdited(true);
              setFields({ ...fields, id: e.target.value });
            }}
          />
        </label>
        <label>
          Highlight color
          <span className="flex items-center gap-2">
            <select
              className={FIELD_CLASS}
              name="highlightColor"
              value={fields.highlightColor}
              onChange={(e) =>
                setFields({ ...fields, highlightColor: e.target.value })
              }
            >
              {HIGHLIGHT_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
            <span
              className={`shrink-0 w-8 h-7 mt-1 mb-2 rounded border-t-4 bg-${fields.highlightColor}-100 border-${fields.highlightColor}-400`}
            />
          </span>
        </label>
        {field('title', 'Title', { placeholder: 'Defaults to the label' })}
        {field('subtitle', 'Subtitle', {
          placeholder: 'One line about the set',
        })}
        {field('authorName', 'Author', { placeholder: 'Optional' })}
        {field('authorUrl', 'Author’s page', {
          placeholder: 'https://… (needed with an author)',
        })}
        {field('authorAvatar', 'Author’s picture', {
          placeholder: 'Optional, e.g. /authors/name.jpg under public/',
        })}
        {field('cta', 'Call to action (markdown)', {
          placeholder: 'Defaults to the subtitle',
          multiline: true,
        })}
        {field('description', 'Description (markdown)', {
          placeholder: 'Shown in the paper’s info menu; defaults to the subtitle',
          multiline: true,
        })}
        {error && (
          <p data-testid="set-editor-error" className="mb-2 text-red-700">
            {error}
          </p>
        )}
        <Buttons
          saving={saving}
          canSave={!idProblem && fields.label.trim() !== ''}
          onCancel={onClose}
        />
      </form>
    </div>
  );
}

/**
 * AnnotationEditor is the paper's edit mode: selecting a passage opens an
 * editor for annotating it, annotations can be given addenda, and new
 * annotation sets can be created from the top bar. What's
 * written is saved to the files under content/ by the dev server, so the mode
 * is only available under `next dev`, by adding `?edit` to the URL.
 */
export function AnnotationEditor() {
  const {
    enabled,
    exit,
    addendumTarget,
    clearAddendumTarget,
    creatingSet,
    setCreatingSet,
  } = useEditMode();
  const [passage, setPassage] = useState<Passage | undefined>(undefined);
  const editorRef = useRef<HTMLDivElement | null>(null);
  // Whether a selection would interrupt something that's being written.
  const busyRef = useRef(false);
  const draftRef = useRef(false);
  useEffect(() => {
    busyRef.current = !!addendumTarget || creatingSet;
  }, [addendumTarget, creatingSet]);
  const closePassage = () => {
    draftRef.current = false;
    setPassage(undefined);
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const selectionHandler = debounce(() => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return;
      }

      // Typing in the editor changes the selection too. And what's being
      // written is kept until it's saved or cancelled, even if other text is
      // selected meanwhile, say to copy it.
      const editor = editorRef.current;
      if (
        busyRef.current ||
        draftRef.current ||
        (editor &&
          (editor.contains(selection.anchorNode) ||
            editor.contains(document.activeElement)))
      ) {
        return;
      }

      const selected = passageOf(selection.getRangeAt(0));
      if (selected) {
        setPassage(selected);
      }
    }, 200);

    document.addEventListener('selectionchange', selectionHandler);
    return () => {
      document.removeEventListener('selectionchange', selectionHandler);
      selectionHandler.cancel();
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div ref={editorRef}>
      <div
        data-testid="edit-mode-badge"
        className="fixed bottom-4 left-4 px-3 py-1 rounded bg-emerald-600 text-white font-sans text-sm shadow z-50"
      >
        Edit mode
        <button
          data-testid="exit-edit-mode"
          className="ml-3 underline"
          onClick={() => {
            closePassage();
            exit();
          }}
        >
          Exit
        </button>
      </div>
      {passage && !addendumTarget && !creatingSet && (
        <PassageEditor
          // A new selection starts a new annotation.
          key={`${passage.pageNumber}/${passage.column}/${passage.selectedText}`}
          passage={passage}
          onClose={closePassage}
          onDraft={(written) => (draftRef.current = written)}
        />
      )}
      {addendumTarget && (
        <AddendumEditor
          key={`${addendumTarget.setId}/${addendumTarget.entryId}`}
          setId={addendumTarget.setId}
          entryId={addendumTarget.entryId}
          onClose={clearAddendumTarget}
        />
      )}
      {creatingSet && <SetEditor onClose={() => setCreatingSet(false)} />}
    </div>
  );
}
