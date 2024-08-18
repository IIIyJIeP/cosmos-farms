import React, { Dispatch, useEffect } from "react";
import { Stack, Text } from '@interchain-ui/react'
import { GranterBalancesAction, updateBalances, useStakingData } from "@/hooks";

type BalancesProps = {
    chainName: string,
    address: string,
    dispatchGrantersBalances: Dispatch<GranterBalancesAction>
}

const Balances = ({
    address,
    chainName,
    dispatchGrantersBalances
}: BalancesProps) => {
    const { data, isLoading, refetch } = useStakingData(chainName, address);

    useEffect (() => {
        if (data && (!data.rewards || !data.balance || !data.totalDelegated)){
            refetch() 
        }
    },[data, refetch]) 

    useEffect(()=>{
        
        if (!isLoading && data && data.rewards && data.balance && data.totalDelegated) {
            dispatchGrantersBalances(updateBalances({
                address,
                data
            }))
        }
    }, [data, isLoading, dispatchGrantersBalances, address ])


    return (<>
        <Stack direction="horizontal" space="$8" attributes={{ alignItems: 'center', mb: '$10' }}>
            <Stack direction="vertical" space="$1">
                <Text
                    color="$textSecondary"
                    fontSize="$sm"
                    fontWeight="$semibold"
                    lineHeight="$normal"
                    attributes={{ mb: '$2' }}
                >
                    Staked:
                </Text>
                <Text
                    fontSize="$md"
                    fontWeight="$semibold"
                    lineHeight="$normal"
                >
                    {data?.totalDelegated || 'n/a'}
                </Text>
            </Stack>
            <Stack direction="vertical" space="$1">
                <Text
                    color="$textSecondary"
                    fontSize="$sm"
                    fontWeight="$semibold"
                    lineHeight="$normal"
                    attributes={{ mb: '$2' }}
                >
                    Claimable Rewards:
                </Text>
                <Text
                    fontSize="$md"
                    fontWeight="$semibold"
                    lineHeight="$normal"
                >
                    {data?.rewards?.total || 'n/a'}
                </Text>
            </Stack>
            <Stack direction="vertical" space="$1">
                <Text
                    color="$textSecondary"
                    fontSize="$sm"
                    fontWeight="$semibold"
                    lineHeight="$normal"
                    attributes={{ mb: '$2' }}
                >
                    Available:
                </Text>
                <Text
                    fontSize="$md"
                    fontWeight="$semibold"
                    lineHeight="$normal"
                >
                    {data?.balance || 'n/a'}
                </Text>
            </Stack>
        </Stack>
    </>)
}

export default Balances