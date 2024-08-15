import { BalancesData } from "@/hooks"
import { useReducer, } from "react"


export type GranterBalances = {
    address: string,
    data: BalancesData
}
enum GranterBalancesActionTypes {
  UPDATE_BALANCES = 'UPDATE_BALANCES',
}

export interface GranterBalancesAction {
  type: GranterBalancesActionTypes
  granterBalances?: GranterBalances
}

export const updateBalancesActionCreator = (granterBalances: GranterBalances) => {
  return {
    type: GranterBalancesActionTypes.UPDATE_BALANCES,
    granterBalances 
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


        default:
          return grantersBalancesState
      }
    },
    []
  )
}






