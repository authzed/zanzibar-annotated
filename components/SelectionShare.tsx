import { LinkIcon } from '@heroicons/react/24/solid';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { usePopper } from 'react-popper';

import HNIcon from '../content/HNIcon.svg';
import RedditIcon from '../content/RedditIcon.svg';
import TwitterIcon from '../content/TwitterIcon.svg';
import popperStyles from '../styles/Popper.module.css';
import { gtagWrapper } from './GTag';

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
};

type ShareButtonProps = {
  onClick: () => void;
  title: string;
  className?: string;
  icon: React.FC<{ className: string }>;
};

function ShareButton(props: ShareButtonProps) {
  return (
    <button
      className={`${popperStyles.button} ${props.className}`}
      onClick={props.onClick}
      title={props.title}
    >
      <props.icon className={popperStyles.icon} />
    </button>
  );
}

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
          gtagWrapper(() => {
            gtag('event', 'selection_share_viewed', {
              share_url: document.URL,
            });
          });

          return;
        }
      }, 200),
    []
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setStatusMsg('URL copied to your clipboard!');
    gtagWrapper(() => {
      gtag('event', 'selection_share_clipboard', {
        share_url: shareUrl,
      });
    });
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet/?url=${encodeURIComponent(
        shareUrl
      )}&text=Shared from the Annotated Zanzibar Paper by Authzed`,
      '_blank'
    );
    gtagWrapper(() => {
      gtag('event', 'selection_share_twitter', {
        share_url: shareUrl,
      });
    });
  };

  const shareToReddit = () => {
    window.open(
      `https://reddit.com/submit/?url=${encodeURIComponent(
        shareUrl
      )}&resubmit=true&title=Selection from the Annotated Zanzibar Paper by Authzed`,
      '_blank'
    );
    gtagWrapper(() => {
      gtag('event', 'selection_share_reddit', {
        share_url: shareUrl,
      });
    });
  };

  const shareToHN = () => {
    window.open(
      `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
        shareUrl
      )}&t=Selection from the Annotated Zanzibar Paper by Authzed`,
      '_blank'
    );
    gtagWrapper(() => {
      gtag('event', 'selection_share_hn', {
        share_url: shareUrl,
      });
    });
  };

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
                <ShareButton
                  className="border-l-0"
                  onClick={copyToClipboard}
                  title="Copy share URL to clipboard"
                  icon={LinkIcon}
                />
                <ShareButton
                  onClick={shareToTwitter}
                  title="Tweet your selection"
                  icon={TwitterIcon}
                />
                <ShareButton
                  onClick={shareToHN}
                  title="Post to Hacker News"
                  icon={HNIcon}
                />
                <ShareButton
                  onClick={shareToReddit}
                  title="Submit on Reddit"
                  icon={RedditIcon}
                />
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
