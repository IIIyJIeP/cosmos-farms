import { BalancesData } from "@/hooks"
import { useReducer, } from "react"


export type GranterBalances = {
    address: string,
    data: BalancesData
}
enum GranterBalancesActionTypes {
  UPDATE_BALANCES = 'UPDATE_BALANCES',
  RESET_BALANCES = 'RESET_BALANCES',
}

export interface GranterBalancesAction {
  type: GranterBalancesActionTypes
  granterBalances?: GranterBalances
}

export const updateBalances = (granterBalances: GranterBalances) => {
  return {
    type: GranterBalancesActionTypes.UPDATE_BALANCES,
    granterBalances 
  } as GranterBalancesAction
}

export const resetBalances = () => {
  return {
    type: GranterBalancesActionTypes.RESET_BALANCES,
  } as GranterBalancesAction
}

export const useGrantersBalances = () => {
  return useReducer(
    (grantersBalancesState: GranterBalances[], action: GranterBalancesAction) => {
      switch (action.type) {
        case GranterBalancesActionTypes.UPDATE_BALANCES: {
          const { address, data } = action.granterBalances!
          return [
            ...grantersBalancesState.filter(granterBalances => granterBalances.address !== address),
            { address, data }
          ]
        }
        case GranterBalancesActionTypes.RESET_BALANCES: {
          return [] as GranterBalances[]
        }


        default:
          return grantersBalancesState
      }
    },
    []
  )
}






