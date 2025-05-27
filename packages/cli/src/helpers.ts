import { Interface } from 'ethers'
import camelCase from 'lodash/camelCase'
import startCase from 'lodash/startCase'

import { AbiFunctionItem } from './types'

export function getFunctionSelector(fn: AbiFunctionItem): string {
  const iface = new Interface([fn])
  return iface.getFunction(fn.name)!.selector
}

export function pascalCase(str: string): string {
  return startCase(camelCase(str)).replace(/\s/g, '')
}
