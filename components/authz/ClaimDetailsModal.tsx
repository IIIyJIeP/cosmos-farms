import { useState } from 'react';
import { ChainName } from 'cosmos-kit';
import { BasicModal, Box, Button, FieldLabel, NumberField } from '@interchain-ui/react';
import dayjs from 'dayjs';
import { AllBalancesData, GrantsType, SignMode, useAuthzTx, useToast } from '@/hooks';
import { MsgWithdrawDelegatorReward } from '@/src/codegen/cosmos/distribution/v1beta1/tx';

type ClaimModalProps = {
    isOpen: boolean;
    onClose: () => void;
    chainName: ChainName;
    grants: GrantsType;
    grantersBalances: AllBalancesData;
    updateBalances: () => void
};

export const ClaimDetailsModal = ({ isOpen, onClose, chainName, grants, grantersBalances, updateBalances}: ClaimModalProps) => {
    const defaultClaimLimit = 0
    const [claimLimit, setClaimLimit] = useState<number>(defaultClaimLimit);
    const [isClaiming, setIsClaiming] = useState(false);
    const { queueExecMsgsTx } = useAuthzTx(chainName);
    const { toast } = useToast();
    
    const onModalClose = () => {
        setClaimLimit(defaultClaimLimit);
        setIsClaiming(false);
        onClose();
    };

    const claimPermissions = grants.map((grant) => grant.permissions.filter(
        perm => perm.name === 'WithdrawDelegatorReward'))
        .reduce((sum, cur) => sum.concat(cur), [])
        .map((perm) =>
            grantersBalances.balancesData[perm.granter].rewards.byValidators.map(
                (validator) => {
                    return {
                        validatorAddress: validator.validatorAddress,
                        amount: validator.amount,
                        grantee: perm.grantee,
                        granter: perm.granter,
                        expiration: perm.expiration,
                    }
                }
            )
        )
        .reduce((sum, cur) => sum.concat(cur), [])
        .filter((permission) => Number(permission.amount) > claimLimit)
      

    const onClaimClick = () => {
        if (claimPermissions.length === 0) {
            toast({
                type: 'error',
                title: 'Nothing to claim',
            });
            return
        }
        
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

        queueExecMsgsTx({
            msgs,
            execExpiration: expiration,
            signMode: SignMode.DIRECT,
            onSuccess: () => {
                updateBalances()
                onModalClose()
            },
            onComplete: () => {
                setIsClaiming(false);
            },
        })
    };

    return (
        <BasicModal
            title="Claim Detais"
            isOpen={isOpen}
            onClose={onModalClose}
            closeOnClickaway={false}
        >
            <Box
                width={{ mobile: '100%'}}
                display="flex"
                flexDirection="column"
                gap="$9"
                pt="$4"
            >
                <Box>
                    <FieldLabel htmlFor="" label="Minimum rewards amount to claim" attributes={{ mb: '$4' }} />
                    <Box display="flex" flexDirection="column" gap="$6">
                        <NumberField
                            value={claimLimit}
                            placeholder="Min rewards to claim"
                            formatOptions={{
                                maximumFractionDigits: 6,
                              }}
                            onChange={(val) => {
                                if (!val) {
                                    setClaimLimit(Number(0));
                                    return;
                                }
                                setClaimLimit(Number(val));
                            }}
                        />
                    </Box>
                </Box>

                <Box width="$full" mt="$9">
                    <Button
                        fluidWidth
                        intent="tertiary"
                        isLoading={isClaiming}
                        disabled={isClaiming}
                        onClick={onClaimClick}
                    >
                        ClaimAll
                    </Button>
                </Box>
            </Box>
        </BasicModal>
    );
};
