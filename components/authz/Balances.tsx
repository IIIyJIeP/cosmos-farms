import React, { Dispatch, useEffect, useRef } from "react";
import { Stack, Text } from '@interchain-ui/react'
import { BalancesData } from "@/hooks";

type BalancesProps = {
    balances?: BalancesData
}

const Balances = ({
    balances
}: BalancesProps) => {
    
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
                    { balances?.totalDelegated || 'n/a'}
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
                    {balances?.rewards.total || 'n/a'}
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
                    {balances?.balance || 'n/a'}
                </Text>
            </Stack>
        </Stack>
    </>)
}

export default Balances