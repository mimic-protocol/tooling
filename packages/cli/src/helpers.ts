import { utils } from 'ethers'
import camelCase from 'lodash/camelCase'
import startCase from 'lodash/startCase'

import { AbiFunctionItem } from './types'

export function getFunctionSelector(fn: AbiFunctionItem): string {
  const iface = new utils.Interface([fn])
  return iface.getSighash(fn.name)
}

export function pascalCase(str: string): string {
  return startCase(camelCase(str)).replace(/\s/g, '')
}
