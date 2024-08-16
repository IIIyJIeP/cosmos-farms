import { useState } from 'react';
import {
  Box,
  Button,
  StakingAssetHeader,
  StakingClaimHeader,
} from '@interchain-ui/react';
import { ChainName } from 'cosmos-kit';

import { getCoin } from '@/configs';
import { GranterBalances, GrantsType, SignMode, useAuthzTx } from '@/hooks';
import {
  sum,
  calcDollarValue,
  isGreaterThanZero,
  type ParsedRewards as Rewards,
} from '@/utils';
import { MsgWithdrawDelegatorReward } from '@/src/codegen/cosmos/distribution/v1beta1/tx';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { SendDetailsModal } from './SendDetailsModal';

const BalancesOverview = ({
  grants,
  grantersBalances,
  updateData,
  chainName,
}: {
  grants: GrantsType;
  grantersBalances: GranterBalances[];
  updateData: () => void;
  chainName: ChainName;
}) => {
  
  const totalAvailableBalance = grantersBalances.reduce(
    (sum, c) => sum.plus(c.data.balance), new BigNumber(0)
  ).toString()

  const totalStaked = grantersBalances.reduce(
    (sum, c) => sum.plus(c.data.totalDelegated), new BigNumber(0)
  ).toString()
  
  const totalRewards = grantersBalances.reduce(
    (sum, c) => sum.plus(c.data.rewards.total), new BigNumber(0)
  ).toString()
  
  const prices = grantersBalances[0].data.prices
  
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSendDetailsOpen, setIsSendDetailsOpen] = useState(false);
  const { authzTx, createExecMsg } = useAuthzTx(chainName);
  
  
  
  const claimPermissions = grants.map(
    (grant) => grant.permissions.filter(
      perm => perm.name === 'WithdrawDelegatorReward'
  )).reduce(
    (sumPermissions, currenrPermissions) => sumPermissions.concat(currenrPermissions), []
  ).map(perm => grantersBalances.filter(
      b => b.address === perm.granter
    ).map(granterBalances => {
        const rewards = granterBalances.data.rewards as Rewards
        return rewards.byValidators.map(
          validator => {
            return {
              validatorAddress: validator.validatorAddress,
              grantee: perm.grantee,
              granter: perm.granter,
              expiration: perm.expiration
            }
          }
      )}
    )
  ).reduce(
    (sumPerms, currenrPerms) => sumPerms.concat(currenrPerms), []
  ).reduce(
    (sPerms, curPerms) => sPerms.concat(curPerms), []
  )
  
  const totalAmount = sum(totalAvailableBalance, totalStaked, totalRewards ?? 0);
  const coin = getCoin(chainName);

  const onClaimRewardClick = () => {
    if (claimPermissions.length === 0) return;

    setIsClaiming(true);

    const msgs = claimPermissions.map(({ granter, validatorAddress }) =>
      MsgWithdrawDelegatorReward.toProtoMsg({
        delegatorAddress: granter,
        validatorAddress,
      })
    );

    const expiration = claimPermissions.reduce((prev, cur) => 
      prev && dayjs(cur.expiration).isAfter(prev) ? prev : cur.expiration, 
      claimPermissions[0].expiration
    )

    authzTx({
      msgs: [createExecMsg({ msgs, grantee: claimPermissions[0].grantee })],
      execExpiration: expiration,
      onSuccess: () => {
        updateData();
      },
      onComplete: () => {
        setIsClaiming(false);
      },
    }, SignMode.DIRECT);
  };
  
  return (
    <>
      <Box
        m
        mb={{ mobile: '$8', tablet: '$12' }}
        display="grid"
        gridTemplateColumns={{ mobile: '1fr', tablet: '4fr 1fr' }}
      >
        <StakingAssetHeader
          imgSrc={
            coin.logo_URIs?.png ||
            coin.logo_URIs?.svg ||
            coin.logo_URIs?.jpeg ||
            ''
          }
          symbol={coin.symbol}
          totalAmount={Number(totalAmount) || 0}
          totalPrice={calcDollarValue(coin.base, totalAmount, prices)}
          available={Number(totalAvailableBalance) || 0}
          availablePrice={calcDollarValue(coin.base, totalAvailableBalance, prices)}
        />
        <Button attributes={{mt: '$5'}} intent="tertiary" onClick={() => setIsSendDetailsOpen(true)}>
          Send All
        </Button>
      </Box>
      <Box  
        mb={{ mobile: '$12', tablet: '$14' }}
        display="grid"
        gridTemplateColumns={{ mobile: '1fr', tablet: '1fr 1fr' }}
      >
        <StakingClaimHeader 
          symbol={coin.symbol}
          rewardsAmount={Number(totalRewards) || 0}
          stakedAmount={Number(totalStaked) || 0}
          onClaim={onClaimRewardClick}
          isLoading={isClaiming}
          isDisabled={!isGreaterThanZero(totalRewards)}
        />
      </Box>
      <SendDetailsModal
        isOpen={isSendDetailsOpen}
        onClose={() => setIsSendDetailsOpen(false)}
        chainName={chainName}
        grants={grants}
        grantersBalances={grantersBalances}
        updateBalances={updateData}
      />
    </>
  );
};

export default BalancesOverview;
