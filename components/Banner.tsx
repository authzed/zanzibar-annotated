export function Banner() {
  return (
    <>
      <div className="w-full mt-14 -mb-20 p-2 bg-black text-white font-sans text-center">
        The Zanzibar Paper, annotated by{' '}
        <a
          href="https://authzed.com"
          title="Authzed, creator of the open source, Zanzibar inspired, fine-grained permissions database SpiceDB."
          className="text-white hover:text-gray-300 underline"
        >
          Authzed
        </a>
        <p className="text-xs">
          Originally presented at 2019 USENIX Annual Technical Conference
          (USENIX ATC ’19)
        </p>
      </div>
    </>
  );
}
