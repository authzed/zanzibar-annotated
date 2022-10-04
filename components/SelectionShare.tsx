import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';
import { usePopper } from 'react-popper';

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
};

function SelectionShare() {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const [virtualRef, setVirtualRef] = useState<VirtualElement | undefined>(
    undefined
  );
  const [visible, setVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { styles, attributes } = usePopper(virtualRef, popperElement, {
    placement: 'top',
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });

  function selectionHandler() {
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0 && !selection?.isCollapsed) {
      const range = selection.getRangeAt(0);
      setVirtualRef(range);
      setVisible(true);
      setShareUrl(document.URL);
      return;
    }

    setVisible(false);
  }
  const debouncedSelectionHandler = useMemo(
    () => debounce(selectionHandler, 200),
    []
  );

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl);
  }

  useEffect(() => {
    document.addEventListener('selectionchange', debouncedSelectionHandler);
    return () => {
      document.removeEventListener(
        'selectionchange',
        debouncedSelectionHandler
      );
      debouncedSelectionHandler.cancel();
    };
  }, [debouncedSelectionHandler]);

  return (
    <>
      {visible && (
        <div
          className="tooltip shadow-md"
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <input
            className="p-2 border border-grey-500 rounded transition"
            value={shareUrl}
            readOnly
          />
          <button
            className="text-sm border border-grey-500 rounded p-2 transition"
            onClick={copyToClipboard}
          >
            Copy
          </button>

          <div className="arrow" ref={setArrowElement} style={styles.arrow} />
        </div>
      )}
    </>
  );
}

export default SelectionShare;
