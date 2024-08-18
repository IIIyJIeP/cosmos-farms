import { useEffect, useMemo, useRef, useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { prettyGrants } from '@/utils';
import { useRpcQueryClient } from './useRpcQueryClient';

export type GrantsType = ReturnType<typeof prettyGrants>

export const useGrants = (chainName: string) => {
  const { address } = useChain(chainName);
  const prevAddressRef = useRef(address);

  const { rpcQueryClient, isLoading: isRpcQueryClientLoading } =
    useRpcQueryClient(chainName);

  const granterGrantsQuery = useQuery({
    queryKey: ['granterGrants', address],
    queryFn: () =>
      rpcQueryClient?.cosmos.authz.v1beta1.granterGrants({
        granter: address || '',
      }),
    enabled: !!rpcQueryClient && !!address,
    select: (data) => data?.grants,
    staleTime: Infinity,
  });

  const granteeGrantsQuery = useInfiniteQuery({
    queryKey: ['granteeGrants', address],
    queryFn: (params) =>
      rpcQueryClient?.cosmos.authz.v1beta1.granteeGrants({
        grantee: address || '',
        pagination: params.pageParam
      }),
    enabled: !!rpcQueryClient && !!address,
    //select: (data) =>[...data?.pages],
    staleTime: Infinity,
    getNextPageParam: (lastPage, pages) => lastPage?.pagination?.nextKey && lastPage?.pagination?.nextKey.length > 0 ? {key: lastPage.pagination.nextKey} : undefined,
  });
  
  

  const dataQueries = {
    granterGrants: granterGrantsQuery,
    granteeGrants: granteeGrantsQuery,
  };

  const queriesToRefetch = [
    dataQueries.granteeGrants,
    dataQueries.granterGrants,
  ];

  const refetch = () => {
    queriesToRefetch.forEach((query) => query.refetch());
  };

  useEffect(() => {
    if (prevAddressRef.current !== address) {
      refetch();
      prevAddressRef.current = address;
    }
  }, [address]);

  const isInitialFetching = Object.values(dataQueries).some(
    ({ isLoading }) => isLoading
  );

  const isRefetching = Object.values(dataQueries).some(
    ({ isRefetching }) => isRefetching
  );

  const isLoading =
    isRpcQueryClientLoading || isInitialFetching || isRefetching || granteeGrantsQuery.hasNextPage;

  useEffect(() => {
    if (granteeGrantsQuery.hasNextPage) {
      granteeGrantsQuery.fetchNextPage()
    }
  }, [granteeGrantsQuery.hasNextPage])
  
    const isError = !rpcQueryClient && !isRpcQueryClientLoading;

  type DataQueries = typeof dataQueries;

  type QueriesData = {
    [Key in keyof DataQueries]: NonNullable<DataQueries[Key]['data']>;
  };

  const data = useMemo(() => {
    if (isLoading) return;
    const queriesData = Object.fromEntries(
      Object.entries(dataQueries).map(([key, query]) => [key, query.data])
    ) as QueriesData;

    const { granteeGrants, granterGrants } = queriesData;

    const allPagesGranteeGrants = granteeGrants.pages.map(page => page?.grants || [] ).reduce(
      (sum, currenr) => sum.concat(currenr), []
    )

    return {
      granteeGrants: prettyGrants(allPagesGranteeGrants, 'granter'),
      granterGrants: prettyGrants(granterGrants, 'grantee'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return { data, isLoading, isError, refetch };
};
