import Zanzibar from '../../content/zanzibar.mdx';

export default function Default() {
  return (
    <>
      <Zanzibar />
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
