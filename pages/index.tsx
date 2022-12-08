import { GetServerSideProps } from 'next';
import getConfig from 'next/config';
import Zanzibar from '../content/zanzibar.mdx';

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
  const { publicRuntimeConfig } = getConfig();
  return {
    props: {
      baseUrl: publicRuntimeConfig.CanonicalUrlBase,
      canonicalUrl: publicRuntimeConfig.CanonicalUrlBase,
    },
  };
};
