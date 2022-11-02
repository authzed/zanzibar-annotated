import { LinkIcon } from '@heroicons/react/24/solid';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { usePopper } from 'react-popper';

import HNIcon from '../content/HNIcon.svg';
import RedditIcon from '../content/RedditIcon.svg';
import TwitterIcon from '../content/TwitterIcon.svg';
import popperStyles from '../styles/Popper.module.css';
import { gtag } from './GTag';

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
};

type ShareButtonProps = {
  callback?: () => void;
  title: string;
  type: 'link' | 'twitter' | 'reddit' | 'hn';
  shareUrl: string;
  className?: string;
  iconClassName?: string;
};

export function ShareButton(props: ShareButtonProps) {
  const { callback, title, type, shareUrl, className, iconClassName } = props;

  const icons = {
    link: LinkIcon,
    twitter: TwitterIcon,
    reddit: RedditIcon,
    hn: HNIcon,
  };

  const shareFuncs = {
    link: () => {
      navigator.clipboard.writeText(shareUrl);

      gtag('event', 'selection_share_clipboard', {
        share_url: shareUrl,
      });
    },
    twitter: () => {
      window.open(
        `https://twitter.com/intent/tweet/?url=${encodeURIComponent(
          shareUrl
        )}&text=Shared from the Annotated Zanzibar Paper by Authzed`,
        '_blank'
      );

      gtag('event', 'selection_share_twitter', {
        share_url: shareUrl,
      });
    },
    reddit: () => {
      window.open(
        `https://reddit.com/submit/?url=${encodeURIComponent(
          shareUrl
        )}&resubmit=true&title=Selection from the Annotated Zanzibar Paper by Authzed`,
        '_blank'
      );

      gtag('event', 'selection_share_reddit', {
        share_url: shareUrl,
      });
    },
    hn: () => {
      window.open(
        `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
          shareUrl
        )}&t=Selection from the Annotated Zanzibar Paper by Authzed`,
        '_blank'
      );

      gtag('event', 'selection_share_hn', {
        share_url: shareUrl,
      });
    },
  };

  const Icon = icons[type];
  return (
    <button
      className={className}
      onClick={() => {
        shareFuncs[type]();
        callback && callback();
      }}
      title={title}
    >
      <Icon className={iconClassName} />
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

          gtag('event', 'selection_share_viewed', {
            share_url: document.URL,
            selection_length: range.toString().length,
          });

          return;
        }
      }, 200),
    []
  );

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
                  type="link"
                  shareUrl={shareUrl}
                  className={`${popperStyles.button} border-l-0`}
                  iconClassName={popperStyles.icon}
                  callback={() => setStatusMsg('URL copied to your clipboard!')}
                  title="Copy share URL to clipboard"
                />
                <ShareButton
                  type="twitter"
                  title="Tweet your selection"
                  shareUrl={shareUrl}
                  className={popperStyles.button}
                  iconClassName={popperStyles.icon}
                />
                <ShareButton
                  type="hn"
                  title="Post to Hacker News"
                  shareUrl={shareUrl}
                  className={popperStyles.button}
                  iconClassName={popperStyles.icon}
                />
                <ShareButton
                  type="reddit"
                  title="Submit on Reddit"
                  shareUrl={shareUrl}
                  className={popperStyles.button}
                  iconClassName={popperStyles.icon}
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
