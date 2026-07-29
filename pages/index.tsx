import { GetServerSideProps } from 'next';
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
  return {
    props: {
      baseUrl: process.env.CanonicalUrlBase!,
      canonicalUrl: process.env.CanonicalUrlBase!,
    },
  };
};
