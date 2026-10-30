import { GetServerSideProps } from 'next';
import Zanzibar from '../content/zanzibar.mdx';
import { CANONICAL_URL_BASE } from '../util/siteconfig';

export default function Default(props: {
  canonicalUrl: string;
  baseUrl: string;
}) {
  return (
    <>
      <Zanzibar canonicalUrl={props.canonicalUrl} baseUrl={props.baseUrl} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<{
  canonicalUrl: string;
  baseUrl: string;
}> = async ({ req }) => {
  return {
    props: {
      baseUrl: CANONICAL_URL_BASE,
      canonicalUrl: CANONICAL_URL_BASE,
    },
  };
};
