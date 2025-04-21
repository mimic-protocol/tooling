import { utils } from 'ethers'

import { AbiFunctionItem } from './types'

export function getKeccak256Selector(fn: AbiFunctionItem) {
  const functionSignature = `${fn.name}(${(fn.inputs || []).map((input) => input.type).join(',')})`
  return utils.id(functionSignature).slice(0, 10)
}
