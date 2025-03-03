import '@interchain-ui/react/styles';
import '@interchain-ui/react/globalStyles';
import 'react-calendar/dist/Calendar.css';

import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { SignerOptions, wallets } from 'cosmos-kit';
import { ChainProvider } from '@cosmos-kit/react';
import { chains, assets } from 'chain-registry';
import { GasPrice } from '@cosmjs/stargate';

import {
  Box,
  Toaster,
  useTheme,
  useColorModeValue,
  ThemeProvider,
} from '@interchain-ui/react';
import { AuthzProvider } from '@/context';

const walletsList = wallets.for('keplr', 'leap', 'cosmostation')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  },
});

function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const { themeClass } = useTheme();

  const signerOptions: SignerOptions = {
    signingStargate: (_chain) => {
      let gasPrice;
      try {
        const chain =
          typeof _chain === 'string'
            ? chains.find(({ chain_name }) => chain_name === _chain)!
            : _chain;
        const feeToken = chain.fees?.fee_tokens[0];
        const fee = `${feeToken?.average_gas_price || 0.025}${feeToken?.denom}`;
        gasPrice = GasPrice.fromString(fee);
      } catch (error) {
        gasPrice = GasPrice.fromString('0.025uosmo');
      }
      return { gasPrice };
    },
  };

  return (
    <ThemeProvider>
      <ChainProvider
        //@ts-ignore
        chains={chains}
        assetLists={assets}
        wallets={walletsList}
        walletConnectOptions={{
          signClient: {
            projectId: 'a8510432ebb71e6948cfd6cde54b70f7',
            relayUrl: 'wss://relay.walletconnect.org',
            metadata: {
              name: 'Cosmos Farms dApp',
              description: 'Cosmos Farms dApp built for Cosmos Farmers',
              url: 'https://cosmosfarms.iiiyjiep.ru/',
              icons: [],
            },
          },
        }}
        signerOptions={signerOptions}
      >
        <QueryClientProvider client={queryClient}>
          <AuthzProvider>
            <Box
              className={themeClass}
              minHeight="100dvh"
              backgroundColor={useColorModeValue('$white', '$background')}
            >
              {/* TODO fix type error */}
              {/* @ts-ignore */}
              <Component {...pageProps} />
              <Toaster position="top-right" closeButton={true} />
            </Box>
          </AuthzProvider>
          {/* <ReactQueryDevtools /> */}
        </QueryClientProvider>
      </ChainProvider>
    </ThemeProvider>
  );
}

export default CreateCosmosApp;
