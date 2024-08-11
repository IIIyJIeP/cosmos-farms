import React from "react";
import { Stack, Text } from '@interchain-ui/react'
import { useStakingData } from "@/hooks";

type BalancesProps = {
    chainName: string,
    address: string
}

const Balances = (props: BalancesProps) => {
    const { data, isLoading, refetch } = useStakingData(props.chainName, props.address);



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
                    fontSize="$sm"
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
                    fontSize="$sm"
                    fontWeight="$semibold"
                    lineHeight="$normal"
                >
                    {data?.rewards.total || 'n/a'}
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
                    fontSize="$sm"
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