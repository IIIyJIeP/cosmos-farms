import { useChain } from '@cosmos-kit/react';
import { isDeliverTxSuccess, StdFee } from '@cosmjs/stargate';

import { cosmos, getSigningCosmosClient } from '@/src/codegen';
import { MsgVote } from '@/src/codegen/cosmos/gov/v1beta1/tx';
import { MsgWithdrawDelegatorReward } from '@/src/codegen/cosmos/distribution/v1beta1/tx';
import { MsgGrant } from '@/src/codegen/cosmos/authz/v1beta1/tx';
import { EncodeObject } from '@/src/codegen/types';
import { SendAuthorization } from '@/src/codegen/cosmos/bank/v1beta1/authz';
import {
  AuthorizationType,
  StakeAuthorization,
} from '@/src/codegen/cosmos/staking/v1beta1/authz';
import { GenericAuthorization } from '@/src/codegen/cosmos/authz/v1beta1/authz';

import { getTokenByChainName, PrettyPermission } from '@/utils';
import { Permission } from '@/configs';
import { useToast, type CustomToast } from './useToast';
import { coin } from '@cosmjs/amino';
import { MsgSend } from '@/src/codegen/cosmos/bank/v1beta1/tx';
import {
  MsgDelegate,
  MsgBeginRedelegate,
  MsgUndelegate,
} from '@/src/codegen/cosmos/staking/v1beta1/tx';
import dayjs from 'dayjs';
import { useQueryHooks } from './useQueryHooks';

const { grant, revoke, exec } =
  cosmos.authz.v1beta1.MessageComposer.fromPartial;

// ==========================================

export type GrantMsg =
  | {
      grantType: typeof Permission.Send;
      customize?: SendAuthorization;
    }
  | {
      grantType: typeof Permission.Delegate;
      customize?: StakeAuthorization;
    }
  | {
      grantType: typeof Permission.ClaimRewards | typeof Permission.Vote;
      customize?: GenericAuthorization;
    };

type CreateGrantMsgOptions = GrantMsg & {
  grantee: MsgGrant['grantee'];
  granter: MsgGrant['granter'];
  expiration?: NonNullable<MsgGrant['grant']>['expiration'];
};

const createGrantMsg = (options: CreateGrantMsgOptions) => {
  const { grantType, customize, grantee, granter, expiration } = options;

  const authz: Record<typeof grantType, typeof customize> = {
    send:
      customize ||
      GenericAuthorization.fromPartial({
        msg: MsgSend.typeUrl,
      }),
    delegate:
      customize ||
      GenericAuthorization.fromPartial({
        msg: MsgDelegate.typeUrl,
      }),
    vote: GenericAuthorization.fromPartial({
      msg: MsgVote.typeUrl,
    }),
    'claim-rewards': GenericAuthorization.fromPartial({
      msg: MsgWithdrawDelegatorReward.typeUrl,
    }),
  };

  return grant({
    granter,
    grantee,
    grant: {
      authorization: authz[grantType],
      expiration,
    },
  });
};

// ==========================================

export const createRevokeMsg = (permission: PrettyPermission) => {
  const { grantee, granter, authorization: authz } = permission;

  let msgTypeUrl = '';

  switch (true) {
    case GenericAuthorization.is(authz):
      msgTypeUrl = (authz as GenericAuthorization).msg;
      break;

    case SendAuthorization.is(authz):
      msgTypeUrl = MsgSend.typeUrl;
      break;

    case StakeAuthorization.is(authz):
      const authzType = (authz as StakeAuthorization).authorizationType;
      if (authzType === AuthorizationType.AUTHORIZATION_TYPE_DELEGATE) {
        msgTypeUrl = MsgDelegate.typeUrl;
        break;
      }
      if (authzType === AuthorizationType.AUTHORIZATION_TYPE_UNDELEGATE) {
        msgTypeUrl = MsgUndelegate.typeUrl;
        break;
      }
      if (authzType === AuthorizationType.AUTHORIZATION_TYPE_REDELEGATE) {
        msgTypeUrl = MsgBeginRedelegate.typeUrl;
        break;
      }
    default:
      break;
  }

  return revoke({
    grantee,
    granter,
    msgTypeUrl,
  });
};

// ==========================================

type CreateExecMsgOptions = Parameters<typeof exec>[0];

export const createExecMsg = ({ grantee, msgs }: CreateExecMsgOptions) => {
  return exec({ grantee, msgs });
};

// ==========================================

const txRaw = cosmos.tx.v1beta1.TxRaw;

enum TxStatus {
  Failed = 'Transaction Failed',
  Successful = 'Transaction Successful',
  Broadcasting = 'Transaction Broadcasting',
}

type AuthzTxOptions = {
  msgs: EncodeObject[];
  fee?: StdFee | null;
  toast?: Partial<CustomToast>;
  onSuccess?: () => void;
  onComplete?: () => void;
  execExpiration?: Date | undefined;
};

type QueueExecTxOptions = {
  msgs: any[];
  fee?: StdFee | null;
  toast?: Partial<CustomToast>;
  onSuccess?: () => void;
  onComplete?: () => void;
  execExpiration?: Date;
  signMode?: SignMode;
  isHardware?: boolean;
};

export enum SignMode {
  AMINO = 'AMINO',
  DIRECT = 'DIRECT'
}

export const useAuthzTx = (chainName: string) => {
  const { toast } = useToast();
  const { address, getOfflineSignerAmino, getOfflineSignerDirect } = useChain(chainName);
  const {rpcEndpoint} = useQueryHooks(chainName)

  const queueExecMsgsTx = async (options: QueueExecTxOptions) => {
    const {
      msgs,
      fee,
      onSuccess,
      onComplete,
      execExpiration,
      toast: customToast,
      signMode,
      isHardware
    } = options;

    if (execExpiration && dayjs().isAfter(execExpiration)) {
      toast({
        type: 'error',
        title: 'Permission Expired',
      });
      if (onComplete) onComplete();
      return
    }

    if (!address) {
      toast({
        type: 'error',
        title: 'Wallet not connected',
        description: 'Please connect the wallet',
      });
      if (onComplete) onComplete();
      return;
    }

    const queueMsgs = []
    const size = isHardware ? 7 : 45
    for (let i = 0; i < Math.ceil(msgs.length / size); i++) {
      queueMsgs[i] = msgs.slice((i * size), (i * size) + size)
    }

    let isAtLeastOneSuccessful = false

    while (queueMsgs.length > 0) {
      await authzTx(
        {
          msgs: [createExecMsg({ msgs: queueMsgs.shift()!, grantee: address })],
          execExpiration,
          fee,
          toast: customToast,
          onSuccess: () => {isAtLeastOneSuccessful = true},
        },
        signMode
      )
    }
    if (onSuccess && isAtLeastOneSuccessful) onSuccess();
    if (onComplete) onComplete();
  }

  const authzTx = async (options: AuthzTxOptions, signMode?: SignMode) => {
    const {
      msgs,
      fee,
      onSuccess,
      onComplete,
      execExpiration,
      toast: customToast,
    } = options;
    const offlineSigner = signMode === 'DIRECT' ? getOfflineSignerDirect() : getOfflineSignerAmino()


    if (execExpiration && dayjs().isAfter(execExpiration)) {
      toast({
        type: 'error',
        title: 'Permission Expired',
      });
      if (onComplete) onComplete();
      return;
    }

    if (!address) {
      toast({
        type: 'error',
        title: 'Wallet not connected',
        description: 'Please connect the wallet',
      });
      if (onComplete) onComplete();
      return;
    }

    let signed: Parameters<typeof txRaw.encode>['0'];
    let client: Awaited<ReturnType<typeof getSigningCosmosClient>>;

    try {
      client = await getSigningCosmosClient({
        rpcEndpoint: rpcEndpoint,
        signer: offlineSigner,
      });
      
      const estimatedGas = Math.round((await client.simulate(address, msgs, ''))*1.4).toString()
      const defaultFee: StdFee = {
        amount: [coin('0', getTokenByChainName(chainName).base)],
        gas: estimatedGas,
      }

      signed = await client.sign(address, msgs, fee || defaultFee, '')

      
    } catch (e: any) {
      console.error(e);
      toast({
        title: TxStatus.Failed,
        description: e?.message || 'An unexpected error has occurred',
        type: 'error',
      });
      if (onComplete) onComplete();
      return;
    }

    let broadcastToastId: string | number;

    broadcastToastId = toast({
      title: TxStatus.Broadcasting,
      description: 'Waiting for transaction to be included in the block',
      type: 'loading',
      duration: 999999,
    });

    if (client && signed) {
      await client
        .broadcastTx(Uint8Array.from(txRaw.encode(signed).finish()))
        .then((res) => {
          if (isDeliverTxSuccess(res)) {
            if (onSuccess) onSuccess();

            toast({
              title: customToast?.title || TxStatus.Successful,
              type: customToast?.type || 'success',
              description: customToast?.description,
            });
          } else {
            toast({
              title: TxStatus.Failed,
              description: res?.rawLog,
              type: 'error',
              duration: 10000,
            });
          }
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: TxStatus.Failed,
            description: err?.message,
            type: 'error',
            duration: 10000,
          });
        })
        .finally(() => {
          toast.close(broadcastToastId)
          if (onSuccess) onSuccess()
        });
    } else {
      toast.close(broadcastToastId);
    }
    if (onComplete) onComplete();
  };

  return { authzTx, queueExecMsgsTx, createGrantMsg, createRevokeMsg, createExecMsg };
};
