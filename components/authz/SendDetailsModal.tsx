import { useState } from 'react';
import { ChainName } from 'cosmos-kit';
import { BasicModal, Box, Button, FieldLabel, NumberField } from '@interchain-ui/react';
import { useChain } from '@cosmos-kit/react';
import dayjs from 'dayjs';

import {
    getExponent,
} from '@/configs';
import { AllBalancesData, createExecMsg, GrantsType, useAuthzTx, useToast } from '@/hooks';
import { getTokenByChainName, shiftDigits } from '@/utils';
import { AddressInput } from '@/components';
import { MsgSend, MsgSendProtoMsg } from '@/src/codegen/cosmos/bank/v1beta1/tx';
import { SendAuthorization } from '@/src/codegen/cosmos/bank/v1beta1/authz';
import BigNumber from 'bignumber.js';

export type AccessList = {
    type: 'allowList' | 'denyList';
    addresses: string[];
};

type SendModalProps = {
    isOpen: boolean;
    onClose: () => void;
    chainName: ChainName;
    grants: GrantsType;
    grantersBalances: AllBalancesData;
    updateBalances: () => void
};

export const SendDetailsModal = ({ isOpen, onClose, chainName, grants, grantersBalances, updateBalances}: SendModalProps) => {
    const { address } = useChain(chainName);
    const [receiverAddress, setReceiverAddress] = useState(address || '');
    const [addressErrorMsg, setAddressErrorMsg] = useState('');
    const defaultSendLimit = 0.1
    const [sendLimit, setSendLimit] = useState<number>(defaultSendLimit);
    const [isSending, setIsSending] = useState(false);
    const { authzTx } = useAuthzTx(chainName);
    const { toast } = useToast();
    const token = getTokenByChainName(chainName);
    const exponent = getExponent(chainName);
    const denom = token.base;

    const onModalClose = () => {
        setReceiverAddress(address || '');
        setSendLimit(defaultSendLimit);
        setIsSending(false);
        onClose();
    };

    const sendPermissions = grants.map(grant => 
        grant.permissions.filter(perm => perm.name === 'Send')
    ).reduce((sumPerms, currenrPerm) => sumPerms.concat(currenrPerm), [])

    const onSendClick = () => {
        if (!receiverAddress || !address || sendPermissions.length === 0)
        return

        const grantee = sendPermissions[0].grantee
        const expiration = sendPermissions.reduce((prev, cur) =>
            prev && dayjs(cur.expiration).isAfter(prev) ? prev : cur.expiration,
        sendPermissions[0].expiration
        )
        
        const msgs: MsgSendProtoMsg[] = []        
        
        for (let permission of sendPermissions) {
            const { granter, authorization } = permission;
            const balances = grantersBalances.balancesData[granter]
            if (!balances) continue
            
            const amount = BigNumber(balances.balance).minus(sendLimit)
            if (!amount.isPositive()) continue
            
            const sendAmount = shiftDigits(
                amount.toString(), 
                exponent
            )

            if (SendAuthorization.is(authorization)) {
                const limitAmount = authorization.spendLimit[0].amount;
                if (limitAmount && new BigNumber(sendAmount).gt(limitAmount)) {
                    toast({
                        type: 'error',
                        title: 'Amount exceeds the spending limit',
                    });
                    continue;
                }
            }

            setIsSending(true)

            const msg = MsgSend.toProtoMsg({
                amount: [
                    {
                        amount: sendAmount,
                        denom,
                    },
                ],
                fromAddress: granter,
                toAddress: receiverAddress,
            })
            msgs.push(msg)
        }

        if (msgs.length === 0) {
            toast({
                type: 'error',
                title: 'Amount exceeds the spending limit',
            });
            setIsSending(false)
            return
        }

        authzTx({
            msgs: [createExecMsg({ msgs, grantee })],
            execExpiration: expiration,
            onSuccess: () => {
                updateBalances()
                onModalClose()
            },
            onComplete: () => {
                setIsSending(false)
            },
        })
    };

    return (
        <BasicModal
            title="Send Detais"
            isOpen={isOpen}
            onClose={onModalClose}
            closeOnClickaway={false}
        >
            <Box
                width={{ mobile: '100%', tablet: '$containerSm' }}
                display="flex"
                flexDirection="column"
                gap="$9"
                pt="$4"
            >
                <AddressInput
                    label="Receiver Address"
                    placeholder="Enter receiver address"
                    chainName={chainName}
                    address={receiverAddress}
                    onAddressChange={setReceiverAddress}
                    onInvalidAddress={setAddressErrorMsg}
                />

                <Box>
                    <FieldLabel htmlFor="" label="Sender's balance limit after sending" attributes={{ mb: '$4' }} />
                    <Box display="flex" flexDirection="column" gap="$6">
                        <NumberField
                            value={sendLimit}
                            placeholder="Sender's balance limit after sending"
                            formatOptions={{
                                maximumFractionDigits: 6,
                              }}
                            onChange={(val) => {
                                if (!val) {
                                    setSendLimit(Number(0));
                                    return;
                                }
                                setSendLimit(Number(val));
                            }}
                        />
                    </Box>
                </Box>

                <Box width="$full" mt="$9">
                    <Button
                        fluidWidth
                        intent="tertiary"
                        isLoading={isSending}
                        disabled={
                            isSending ||
                            !!addressErrorMsg ||
                            !receiverAddress
                        }
                        onClick={onSendClick}
                    >
                        Send
                    </Button>
                </Box>
            </Box>
        </BasicModal>
    );
};
