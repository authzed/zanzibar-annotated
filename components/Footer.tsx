/**
 * Displayed after the last page of the paper.
 */
export function Footer(props: { baseUrl?: string }) {
  return (
    <>
      <div className="footer w-full p-3 bg-black text-white font-sans grid grid-cols-[auto,1fr,auto] gap-x-5 items-center text-sm">
        <div>
          Annotations &copy; 2022{' '}
          <a
            href="https://authzed.com"
            target="_blank"
            rel="noopener"
            className="text-white hover:text-indigo-200 underline"
          >
            AuthZed, Inc
          </a>
          . Zanzibar Paper &copy; USENIX and original authors.
        </div>
        <div className="text-right">
          <span className="hidden md:inline-block">
            Join the discussion on&nbsp;
          </span>
          <a
            href="https://authzed.com/discord"
            className="text-white hover:text-gray-300 underline"
          >
            Discord
          </a>
        </div>
        <a
          href="https://authzed.com"
          target="_blank"
          rel="noopener"
          className="text-white hover:text-indigo-200 underline"
        >
          <img src={`${props.baseUrl ?? ''}/authzed-logo.svg`} />
        </a>
      </div>
    </>
  );
}
