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

export const useBalances = (chainName: string, addresses: string[]) => {
  const coin = getCoin(chainName);
  const exp = getExponent(chainName);

  const {
    cosmos: cosmosQuery,
    isReady: isQueryHooksReady,
    isFetching: isQueryHooksFetching,
  } = useQueryHooks(chainName);

  const balanceQuerys = Object.fromEntries(addresses.map(address => {
    return [
      address,
      cosmosQuery.bank.v1beta1.useBalance({
        request: {
          address,
          denom: coin.base,
        },
        options: {
          enabled: isQueryHooksReady && !!address,
          select: ({ balance }) => shiftDigits(balance?.amount || '0', -exp),
        },
      }),
    ]
  }))

  const rewardsQuerys = Object.fromEntries(addresses.map(address => {
    return [
      address,
      cosmosQuery.distribution.v1beta1.useDelegationTotalRewards({
        request: {
          delegatorAddress: address,
        },
        options: {
          enabled: isQueryHooksReady && !!address,
          select: (data) => parseRewards(data, coin.base, -exp),
        },
      }),
    ]
  }));

  const delegationsQuerys = Object.fromEntries(addresses.map(address => {
    return [
      address,
      cosmosQuery.staking.v1beta1.useDelegatorDelegations({
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
      }),
    ]
  }));

  const pricesQuery = usePrices();

  const allQueries = Object.fromEntries(addresses.map(address => {
    return [
      address,
      {
        balance: balanceQuerys[address],
        rewards: rewardsQuerys[address],
        delegations: delegationsQuerys[address],
        prices: pricesQuery
      }
    ]
  }))

  type AllQueries = typeof allQueries
  type Queries = AllQueries[keyof AllQueries]
  type QueriesData = {
    [Key in keyof Queries]: NonNullable<Queries[Key]['data']>;
  };
  

  const updatableQueriesAfterMutation = Object.values(allQueries).map(
    queries => [
    queries.balance,
    queries.rewards,
    queries.delegations,
  ]).reduce((result, current) => result.concat(current), [])

  const rawAllQueries = [...updatableQueriesAfterMutation, pricesQuery]

  const isInitialFetching =rawAllQueries.some(
    ({ isLoading }) => isLoading
  );

  const isRefetching = rawAllQueries.some(
    ({ isRefetching }) => isRefetching
  );

  const isLoading = isQueryHooksFetching || isInitialFetching || isRefetching;

  const data = useMemo(() => {
    if (isLoading) return;
    
    const balancesData = Object.fromEntries(
      Object.entries(allQueries).map(([address, querys]) => {

        const queriesData = Object.fromEntries(
          Object.entries(querys).map(([key, query]) => [key, query.data])
        ) as QueriesData;

        const { delegations } = queriesData;

        const totalDelegated = calcTotalDelegation(delegations)

        return [
          address,
          {
            ...queriesData,
            totalDelegated,
          },
        ]
      })
    )
    
    return {
      balancesData, 
      prices: pricesQuery.data!,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const refetch = () => {
    updatableQueriesAfterMutation.forEach((query) => query.refetch());
  };

  return { data, isLoading, refetch };
};

export type AllBalancesData = NonNullable<ReturnType<typeof useBalances>['data']>
export type BalancesData =AllBalancesData['balancesData'][keyof AllBalancesData['balancesData']]
