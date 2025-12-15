import { LinkIcon } from "@heroicons/react/24/solid";
import debounce from "lodash.debounce";
import { useEffect, useMemo, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { usePopper } from "react-popper";

import HNIcon from "../content/HNIcon.svg";
import RedditIcon from "../content/RedditIcon.svg";
import TwitterIcon from "../content/TwitterIcon.svg";
import popperStyles from "../styles/Popper.module.css";
import { isUnderContentContainer } from "./Container";
import { gtag } from "./GTag";

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
};

type ShareButtonProps = {
  callback?: () => void;
  title: string;
  type: "link" | "twitter" | "reddit" | "hn";
  shareUrl: string;
  shareTitle?: string;
  className?: string;
  iconClassName?: string;
};

export function ShareButton(props: ShareButtonProps) {
  const {
    callback,
    title,
    type,
    shareUrl,
    shareTitle,
    className,
    iconClassName,
  } = props;

  const icons = {
    link: LinkIcon,
    twitter: TwitterIcon,
    reddit: RedditIcon,
    hn: HNIcon,
  };

  const shareFuncs = {
    link: async () => {
      // Helper function for textarea fallback
      const copyWithFallback = (): boolean => {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        let success = false;
        try {
          success = document.execCommand("copy");
        } catch {
          success = false;
        }
        document.body.removeChild(textArea);
        return success;
      };

      try {
        // Try the modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          // Fallback for older browsers
          if (!copyWithFallback()) {
            return false;
          }
        }

        gtag("event", "selection_share_clipboard", {
          share_url: shareUrl,
        });

        return true;
      } catch (err) {
        // Clipboard API failed (permissions, non-secure context, etc.)
        // Try fallback before giving up
        console.warn("Clipboard API failed, trying fallback:", err);
        if (copyWithFallback()) {
          gtag("event", "selection_share_clipboard", {
            share_url: shareUrl,
          });
          return true;
        }
        console.error("Failed to copy to clipboard:", err);
        return false;
      }
    },
    twitter: () => {
      window.open(
        `https://twitter.com/intent/tweet/?url=${encodeURIComponent(
          shareUrl,
        )}&text=${
          shareTitle ?? "Shared from the Annotated Zanzibar Paper by AuthZed"
        }`,
        "_blank",
      );

      gtag("event", "selection_share_twitter", {
        share_url: shareUrl,
      });
    },
    reddit: () => {
      window.open(
        `https://reddit.com/submit/?url=${encodeURIComponent(
          shareUrl,
        )}&resubmit=true&title=${
          shareTitle ?? "Selection from the Annotated Zanzibar Paper by AuthZed"
        }`,
        "_blank",
      );

      gtag("event", "selection_share_reddit", {
        share_url: shareUrl,
      });
    },
    hn: () => {
      window.open(
        `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(
          shareUrl,
        )}&t=${
          shareTitle ?? "Selection from the Annotated Zanzibar Paper by AuthZed"
        }`,
        "_blank",
      );

      gtag("event", "selection_share_hn", {
        share_url: shareUrl,
      });
    },
  };

  const onClick = async () => {
    const result = await shareFuncs[type]();
    // Only call callback for link type if copy succeeded, always for others
    if (type !== "link" || result !== false) {
      callback && callback();
    }
  };

  const Icon = icons[type];
  return (
    <button className={className} onClick={onClick} title={title}>
      <Icon className={iconClassName} />
    </button>
  );
}

function SelectionShare() {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const [virtualRef, setVirtualRef] = useState<VirtualElement | undefined>(
    undefined,
  );
  const [visible, setVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const { styles, attributes } = usePopper(virtualRef, popperElement, {
    placement: "top",
    modifiers: [{ name: "arrow", options: { element: arrowElement } }],
  });

  const debouncedSelectionHandler = useMemo(
    () =>
      debounce(() => {
        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0 && !selection?.isCollapsed) {
          const range = selection.getRangeAt(0);
          if (!isUnderContentContainer(range.startContainer)) {
            return;
          }

          setVirtualRef(range);
          setVisible(true);
          setShareUrl(document.URL);
          setStatusMsg("");

          gtag("event", "selection_share_viewed", {
            share_url: document.URL,
            selection_length: range.toString().length,
          });

          return;
        }
      }, 200),
    [],
  );

  useEffect(() => {
    document.addEventListener("selectionchange", debouncedSelectionHandler);
    return () => {
      document.removeEventListener(
        "selectionchange",
        debouncedSelectionHandler,
      );
      debouncedSelectionHandler.cancel();
    };
  }, [debouncedSelectionHandler]);

  return (
    <>
      {visible && (
        <ClickAwayListener
          mouseEvent="mousedown"
          touchEvent="touchend"
          onClickAway={() => setVisible(false)}
        >
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
                  callback={() => setStatusMsg("URL copied to your clipboard!")}
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
