import { utils } from 'ethers'

import { AbiFunctionItem } from './types'

export function getFunctionSelector(fn: AbiFunctionItem): string {
  const iface = new utils.Interface([fn])
  return iface.getSighash(fn.name)
}
