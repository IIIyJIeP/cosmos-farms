import { useState } from 'react';
import { ChainName } from 'cosmos-kit';
import { BasicModal, Box, Button, Text, FieldLabel} from '@interchain-ui/react';
import { useChain } from '@cosmos-kit/react';
import dayjs from 'dayjs';
import { AllBalancesData, GrantsType, useAuthzTx, useToast } from '@/hooks';
import { AddressInput } from '@/components';
import { MsgSend, MsgSendProtoMsg } from '@/src/codegen/cosmos/bank/v1beta1/tx';

export type AccessList = {
    type: 'allowList' | 'denyList';
    addresses: string[];
};

type DustModalProps = {
    isOpen: boolean;
    onClose: () => void;
    chainName: ChainName;
    grants: GrantsType;
    grantersBalances: AllBalancesData;
    updateBalances: () => void
};

export const DustDetailsModal = ({ isOpen, onClose, chainName, grants, grantersBalances, updateBalances}: DustModalProps) => {
    const { address } = useChain(chainName);
    const [receiverAddress, setReceiverAddress] = useState(address || '');
    const [isHardWallet, setIsHardWallet] = useState(false);
    const [addressErrorMsg, setAddressErrorMsg] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { queueExecMsgsTx } = useAuthzTx(chainName);
    const { toast } = useToast();
    
    const onModalClose = () => {
        setReceiverAddress(address || '');
        setIsSending(false);
        onClose();
    };

    const sendPermissions = grants.map(grant => 
        grant.permissions.filter(perm => perm.name === 'Send')
    ).reduce((sumPerms, currenrPerm) => sumPerms.concat(currenrPerm), [])

    const onSendDustClick = () => {
        if (!receiverAddress || !address)
        return

        const expiration = sendPermissions.reduce((prev, cur) =>
            prev && dayjs(cur.expiration).isAfter(prev) ? prev : cur.expiration,
        sendPermissions[0].expiration
        )
        
        const msgs: MsgSendProtoMsg[] = []        
        
        for (let permission of sendPermissions) {
            const { granter } = permission;
            const balances = grantersBalances.balancesData[granter]
            if (!balances) continue
            if (balances.dust.length === 0) continue
            
            setIsSending(true)

            const msg = MsgSend.toProtoMsg({
                amount: balances.dust,
                fromAddress: granter,
                toAddress: receiverAddress,
            })
            msgs.push(msg)
        }

        if (msgs.length === 0) {
            toast({
                type: 'error',
                title: 'Nothing to send',
            });
            setIsSending(false)
            return
        }

        queueExecMsgsTx ({
            msgs,
            execExpiration: expiration,
            onSuccess: () => {
                updateBalances()
                onModalClose()
            },
            onComplete: () => {
                setIsSending(false)
            },
            isHardware: isHardWallet,
        })
    };

    return (
        <BasicModal
            title="Collect Dust Detais"
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

                <Box width="$full" mt="$9">
                    
                    <Box
                        display='flex'
                        flexDirection='row'
                        alignItems='center'
                        gap='$2'
                    >
                        <input 
                            type="checkbox" 
                            id="hardwallet" 
                            name="hardwallet" 
                            checked={isHardWallet} 
                            onClick={()=>{setIsHardWallet(!isHardWallet)}}
                        />
                        <FieldLabel 
                            htmlFor="hardwallet"
                            id="hardwallet-label"
                            label="use Ledger or Keystone"
                        />
                    </Box>
                    <Button
                        fluidWidth
                        intent="tertiary"
                        isLoading={isSending}
                        disabled={
                            isSending ||
                            !!addressErrorMsg ||
                            !receiverAddress
                        }
                        onClick={onSendDustClick}
                    >
                        Send Dust
                    </Button>
                </Box>
            </Box>
        </BasicModal>
    );
};
