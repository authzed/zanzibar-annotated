const style = {
  // clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)',
  // zIndex: 99999,
};

export function Footer() {
  return (
    <>
      <div
        className="w-full p-3 bg-black text-white font-sans text-center"
        style={style}
      >
        <div className="w-3/4 mx-auto">
          <p className="">
            Join the discussion on{' '}
            <a
              href="https://authzed.com/discord"
              className="text-white hover:text-gray-300 underline"
            >
              Discord
            </a>
          </p>
          <p className="">Annotations &copy; 2022 Authzed, Inc</p>
          <p className="">Zanzibar Paper &copy; USENIX and original authors.</p>
        </div>
      </div>
    </>
  );
}
