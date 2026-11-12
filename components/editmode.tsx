import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * EditMode is the state of the paper's edit mode, in which annotations,
 * addenda and annotation sets can be added to the paper from the page. It's only available under
 * `next dev`, and is entered by adding `?edit` to the URL. It then stays on in
 * that tab until it's left.
 */
export type EditMode = {
  enabled: boolean;
  // Leaves edit mode.
  exit(): void;
  // The annotation an addendum is being written for, if any.
  addendumTarget: { setId: string; entryId: string } | null;
  requestAddendum(setId: string, entryId: string): void;
  clearAddendumTarget(): void;
  // Whether a new annotation set is being created.
  creatingSet: boolean;
  setCreatingSet(creating: boolean): void;
};

// Where it's remembered that edit mode is on. Selecting text changes the URL
// of the page and saving an edit can reload it, either of which loses `?edit`.
const SESSION_STORAGE_KEY = 'za-edit-mode';

function readSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function writeSession(on: boolean) {
  try {
    if (on) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'on');
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Without it, the mode lasts until the page next loads.
  }
}

const EditModeContext = createContext<EditMode>({
  enabled: false,
  exit: () => {},
  addendumTarget: null,
  requestAddendum: () => {},
  clearAddendumTarget: () => {},
  creatingSet: false,
  setCreatingSet: () => {},
});

/**
 * Provider that holds the state of the paper's edit mode. In the built site
 * it holds nothing, and the mode is always off.
 *
 * Edit mode must only exist under `next dev`. Everything of it is behind a
 * comparison of `process.env.NODE_ENV` with `'development'`, written out in
 * full wherever it's needed: that's settled when the site is built, so what's
 * behind it is left out of the built site. `pnpm check:build` fails if any of
 * edit mode is found in a build.
 */
export function EditModeProvider(props: PropsWithChildren) {
  if (process.env.NODE_ENV !== 'development') {
    return <>{props.children}</>;
  }
  return <DevEditModeProvider>{props.children}</DevEditModeProvider>;
}

function DevEditModeProvider(props: PropsWithChildren) {
  const [enabled, setEnabled] = useState(false);
  const [addendumTarget, setAddendumTarget] =
    useState<EditMode['addendumTarget']>(null);
  const [creatingSet, setCreatingSet] = useState(false);

  // The mode is turned on after the first render, as the server doesn't know
  // of it.
  useEffect(() => {
    const on =
      new URLSearchParams(window.location.search).has('edit') || readSession();
    writeSession(on);
    setEnabled(on);
  }, []);

  const exit = useCallback(() => {
    writeSession(false);
    // Otherwise the mode would be back when the page is next loaded.
    const url = new URL(window.location.href);
    if (url.searchParams.has('edit')) {
      url.searchParams.delete('edit');
      window.history.replaceState(window.history.state, '', url);
    }
    setEnabled(false);
    setAddendumTarget(null);
    setCreatingSet(false);
  }, []);

  const requestAddendum = useCallback(
    (setId: string, entryId: string) => setAddendumTarget({ setId, entryId }),
    []
  );
  const clearAddendumTarget = useCallback(() => setAddendumTarget(null), []);

  const value = useMemo(
    () => ({
      enabled,
      exit,
      addendumTarget,
      requestAddendum,
      clearAddendumTarget,
      creatingSet,
      setCreatingSet,
    }),
    [
      enabled,
      exit,
      addendumTarget,
      requestAddendum,
      clearAddendumTarget,
      creatingSet,
    ]
  );

  return (
    <EditModeContext.Provider value={value}>
      {props.children}
    </EditModeContext.Provider>
  );
}

/**
 * Hook for using the state of the paper's edit mode.
 */
export function useEditMode(): EditMode {
  return useContext(EditModeContext);
}
