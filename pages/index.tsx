import { GetServerSideProps } from 'next';
import getConfig from 'next/config';
import Zanzibar from '../content/zanzibar.mdx';

export default function Default(props: { canonicalUrl: string }) {
  return (
    <>
      <Zanzibar canonicalUrl={props.canonicalUrl} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<{
  canonicalUrl: string;
}> = async ({ req }) => {
  const { publicRuntimeConfig } = getConfig();
  return {
    props: {
      canonicalUrl: publicRuntimeConfig.CanonicalUrlBase,
    },
  };
};
