import { useState } from 'react';
import {
  Box,
  Button,
  StakingAssetHeader,
  StakingClaimHeader,
} from '@interchain-ui/react';
import { ChainName } from 'cosmos-kit';

import { getCoin } from '@/configs';
import { AllBalancesData, GrantsType } from '@/hooks';
import {
  sum,
  calcDollarValue,
  isGreaterThanZero,
} from '@/utils';
import BigNumber from 'bignumber.js';
import { SendDetailsModal } from './SendDetailsModal';
import { DustDetailsModal } from './DustDetailsModal';
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
  
  const isDustAvailable = Object.values(
    grantersBalances.balancesData
  ).reduce((bool, current) => 
    bool = current.dust.length > 0 ? true : bool, false
  )

  const [isClaimDetailsOpen, setIsClaimDetailsOpen] = useState(false);
  const [isSendDetailsOpen, setIsSendDetailsOpen] = useState(false);
  const [isDustDetailsOpen, setIsDustDetailsOpen] = useState(false);
  
  
  const totalAmount = sum(totalAvailableBalance, totalStaked, totalRewards ?? 0);
  const coin = getCoin(chainName);

  const onClaimRewardClick = () => {
    setIsClaimDetailsOpen(true);
  };
  
  return (
    <>
      <Box
        mb='$8'
        display="grid"
        gridTemplateColumns={{ mobile: '1fr', tablet: '4fr 1fr' }}
        alignItems={'center'}
      >
        <StakingAssetHeader
          borderWidth="1px"
          borderColor={'Red'}
          borderStyle= "solid"


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
        <Box
          display='flex'
          flexDirection={{mobile: 'row', tablet: 'column'}}
          gap='$4'
          alignItems={'stretch'}
          flexGrow='2'
          mt={{mobile: '$8', tablet: '$0'}}
        >
          <Button 
            fluidWidth={true}
            intent="tertiary" 
            onClick={() => setIsSendDetailsOpen(true)} 
            disabled={!isGreaterThanZero(totalAvailableBalance)}
            isLoading={isSendDetailsOpen}
          >
            Send All
          </Button>
          {chainName === 'cosmoshub' && <Button 
            fluidWidth={true}
            intent="tertiary" 
            onClick={() => setIsDustDetailsOpen(true)} 
            disabled={!isDustAvailable}
            isLoading={isDustDetailsOpen}
          >
            Collect Dust
          </Button>}
        </Box>
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
      <DustDetailsModal
        isOpen={isDustDetailsOpen}
        onClose={() => setIsDustDetailsOpen(false)}
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
