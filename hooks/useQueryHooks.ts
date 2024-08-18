import { rpcURLs } from '@/configs';
import { useChain } from '@cosmos-kit/react';
import {
  useRpcEndpoint,
  useRpcClient,
  createRpcQueryHooks,
} from 'interchain-query';

export const useQueryHooks = (chainName: string) => {
  const { getRpcEndpoint,  } = useChain(chainName);

  const rpcEndpointQuery = useRpcEndpoint({
    getter: getRpcEndpoint,
    options: {
      staleTime: Infinity,
      queryKeyHashFn: (queryKey) => {
        return JSON.stringify([...queryKey, chainName]);
      },
    },
  });
  
  const rpcEndpoint = rpcURLs[chainName] || rpcEndpointQuery.data || ''

  const rpcClientQuery = useRpcClient({
    rpcEndpoint: rpcEndpoint,
    options: {
      enabled: Boolean(rpcEndpoint),
      staleTime: Infinity,
    },
  });

  const { cosmos } = createRpcQueryHooks({
    rpc: rpcClientQuery.data,
  });

  const isReady = Boolean(rpcClientQuery.data);
  const isFetching = rpcEndpointQuery.isFetching || rpcClientQuery.isFetching;

  return {
    cosmos,
    isReady,
    isFetching,
    rpcEndpoint,
  };
};
