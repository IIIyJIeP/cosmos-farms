import { useMemo } from 'react';
import { usePrices } from './usePrices';
import { getCoin, getExponent } from '@/configs';
import {
  shiftDigits,
  calcTotalDelegation,
  parseDelegations,
  parseRewards,
} from '@/utils';
import { useQueryHooks } from './useQueryHooks';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const useBalances = (chainName: string, address: string) => {
  const coin = getCoin(chainName);
  const exp = getExponent(chainName);

  const {
    cosmos: cosmosQuery,
    isReady: isQueryHooksReady,
    isFetching: isQueryHooksFetching,
  } = useQueryHooks(chainName);

  const balanceQuery = cosmosQuery.bank.v1beta1.useBalance({
    request: {
      address,
      denom: coin.base,
    },
    options: {
      enabled: isQueryHooksReady && !!address,
      select: ({ balance }) => shiftDigits(balance?.amount || '0', -exp),
    },
  });

  const rewardsQuery =
    cosmosQuery.distribution.v1beta1.useDelegationTotalRewards({
      request: {
        delegatorAddress: address,
      },
      options: {
        enabled: isQueryHooksReady && !!address,
        select: (data) => parseRewards(data, coin.base, -exp),
      },
    });

  const delegationsQuery = cosmosQuery.staking.v1beta1.useDelegatorDelegations({
    request: {
      delegatorAddr: address,
      pagination: {
        key: new Uint8Array(),
        offset: 0n,
        limit: 100n,
        countTotal: true,
        reverse: false,
      },
    },
    options: {
      enabled: isQueryHooksReady && !!address,
      select: ({ delegationResponses }) =>
        parseDelegations(delegationResponses, -exp),
    },
  });

  const pricesQuery = usePrices();

  const allQueries = {
    balance: balanceQuery,
    rewards: rewardsQuery,
    delegations: delegationsQuery,
    prices: pricesQuery,
  };

  const updatableQueriesAfterMutation = [
    allQueries.balance,
    allQueries.rewards,
    allQueries.delegations,
  ];

  const isInitialFetching = Object.values(allQueries).some(
    ({ isLoading }) => isLoading
  );

  const isRefetching = Object.values(allQueries).some(
    ({ isRefetching }) => isRefetching
  );

  const isLoading = isQueryHooksFetching || isInitialFetching || isRefetching;

  type AllQueries = typeof allQueries;

  type QueriesData = {
    [Key in keyof AllQueries]: NonNullable<AllQueries[Key]['data']>;
  };

  const data = useMemo(() => {
    if (isLoading) return;

    const queriesData = Object.fromEntries(
      Object.entries(allQueries).map(([key, query]) => [key, query.data])
    ) as QueriesData;

    const { delegations } = queriesData;
    const totalDelegated = calcTotalDelegation(delegations);

    return {
      ...queriesData,
      totalDelegated,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const refetch = () => {
    updatableQueriesAfterMutation.forEach((query) => query.refetch());
  };

  return { data, isLoading, refetch };
};

export type BalancesData  = Exclude<ReturnType<typeof useBalances>['data'], undefined>