import Head from 'next/head';
import { Container } from '@interchain-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="64rem" attributes={{ py: '$14' }}>
      <Head>
        <title>Cosmos Farms</title>
        <meta name="description" content="Developed by the community" />
        <link rel="icon" href="/image/favicon.ico" />
      </Head>
       {/* @ts-ignore */}
      <Header />
      {children}
       {/* @ts-ignore */}
      <Footer />
    </Container>
  );
}
