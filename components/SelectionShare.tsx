import { LinkIcon } from '@heroicons/react/24/solid';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { usePopper } from 'react-popper';

import HNIcon from '../content/HNIcon.svg';
import RedditIcon from '../content/RedditIcon.svg';
import TwitterIcon from '../content/TwitterIcon.svg';
import popperStyles from '../styles/Popper.module.css';

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
  const [statusMsg, setStatusMsg] = useState('');
  const { styles, attributes } = usePopper(virtualRef, popperElement, {
    placement: 'top',
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });

  const debouncedSelectionHandler = useMemo(
    () =>
      debounce(() => {
        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0 && !selection?.isCollapsed) {
          const range = selection.getRangeAt(0);
          setVirtualRef(range);
          setVisible(true);
          setShareUrl(document.URL);
          setStatusMsg('');
          return;
        }
      }, 200),
    []
  );

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl);
    setStatusMsg('URL copied to your clipboard!');
  }

  function shareToTwitter() {
    window.open(
      `https://twitter.com/intent/tweet/?url=${encodeURIComponent(
        shareUrl
      )}&text=Shared from the Annotated Zanzibar Paper`,
      '_blank'
    );
  }

  function shareToReddit() {
    window.open(
      `https://reddit.com/submit/?url=${encodeURIComponent(
        shareUrl
      )}&resubmit=true&title=Selection from the Annotated Zanzibar Paper`,
      '_blank'
    );
  }

  function shareToHN() {
    window.open(
      `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
        shareUrl
      )}&t=Selection from the Annotated Zanzibar Paper`,
      '_blank'
    );
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
        <ClickAwayListener onClickAway={() => setVisible(false)}>
          <div
            className={popperStyles.tooltip}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            {!statusMsg && (
              <>
                <button
                  className={`${popperStyles.button} border-l-0`}
                  onClick={copyToClipboard}
                  title="Copy share URL to clipboard"
                >
                  <LinkIcon className={popperStyles.icon} />
                </button>
                <button
                  className={popperStyles.button}
                  onClick={shareToTwitter}
                  title="Tweet your selection"
                >
                  <TwitterIcon className={popperStyles.icon} />
                </button>
                <button
                  className={popperStyles.button}
                  onClick={shareToHN}
                  title="Post to HackerNews"
                >
                  <HNIcon className={popperStyles.icon} />
                </button>
                <button
                  className={popperStyles.button}
                  onClick={shareToReddit}
                  title="Submit on Reddit"
                >
                  <RedditIcon className={popperStyles.icon} />
                </button>

                <div
                  ref={setArrowElement}
                  className={popperStyles.arrow}
                  style={styles.arrow}
                />
              </>
            )}
            {statusMsg && (
              <div className={popperStyles.statusMsg}>{statusMsg}</div>
            )}
          </div>
        </ClickAwayListener>
      )}
    </>
  );
}

export default SelectionShare;
