import { useState } from 'react';
import {
  Box,
  Button,
  StakingAssetHeader,
  StakingClaimHeader,
} from '@interchain-ui/react';
import { ChainName } from 'cosmos-kit';

import { getCoin } from '@/configs';
import { AllBalancesData, GrantsType, SignMode, useAuthzTx } from '@/hooks';
import {
  sum,
  calcDollarValue,
  isGreaterThanZero,
} from '@/utils';
import { MsgWithdrawDelegatorReward } from '@/src/codegen/cosmos/distribution/v1beta1/tx';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { SendDetailsModal } from './SendDetailsModal';
import { ClaimDetailsModal } from './ClaimDetailsModal';


const BalancesOverview = ({
  grants,
  grantersBalances,
  updateData,
  chainName,
}: {
  grants: GrantsType;
  grantersBalances: AllBalancesData;
  updateData: () => void;
  chainName: ChainName;
}) => {
  const totalAvailableBalance = Object.values(
    grantersBalances.balancesData
  ).reduce((sum, current) => 
    sum.plus(current.balance), new BigNumber(0)
  ).toString()

  const totalStaked = Object.values(
    grantersBalances.balancesData
  ).reduce((sum, current) => 
    sum.plus(current.totalDelegated), new BigNumber(0)
  ).toString()
  
  const totalRewards = Object.values(
    grantersBalances.balancesData
  ).reduce((sum, current) => 
    sum.plus(current.rewards.total), new BigNumber(0)
  ).toString()
  
  const prices = grantersBalances.prices
  
  const [isClaimDetailsOpen, setIsClaimDetailsOpen] = useState(false);
  const [isSendDetailsOpen, setIsSendDetailsOpen] = useState(false);
  
  const totalAmount = sum(totalAvailableBalance, totalStaked, totalRewards ?? 0);
  const coin = getCoin(chainName);

  const onClaimRewardClick = () => {
    setIsClaimDetailsOpen(true);
  };
  
  return (
    <>
      <Box
        mb={{ mobile: '$8', tablet: '$12' }}
        display="grid"
        gridTemplateColumns={{ mobile: '1fr', tablet: '4fr 1fr' }}
      >
        <StakingAssetHeader
          imgSrc={
            coin.logo_URIs?.png ||
            coin.logo_URIs?.svg ||
            ''
          }
          symbol={coin.symbol}
          totalAmount={Number(totalAmount) || 0}
          totalPrice={calcDollarValue(coin.base, totalAmount, prices)}
          available={Number(totalAvailableBalance) || 0}
          availablePrice={calcDollarValue(coin.base, totalAvailableBalance, prices)}
        />
        <Button 
          attributes={{mt: '$5'}} 
          intent="tertiary" 
          onClick={() => setIsSendDetailsOpen(true)} 
          disabled={!isGreaterThanZero(totalAvailableBalance)}
          isLoading={isSendDetailsOpen}
        >
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
          isLoading={isClaimDetailsOpen}
          isDisabled={!isGreaterThanZero(totalRewards) || isClaimDetailsOpen}
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
      <ClaimDetailsModal
        isOpen={isClaimDetailsOpen}
        onClose={() => setIsClaimDetailsOpen(false)}
        chainName={chainName}
        grants={grants}
        grantersBalances={grantersBalances}
        updateBalances={updateData}
      />
    </>
  );
};

export default BalancesOverview;
