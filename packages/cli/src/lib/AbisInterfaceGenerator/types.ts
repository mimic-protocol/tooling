import { AbiParameter, LibTypes } from '../../types'

export type ImportedTypes =
  | LibTypes
  | 'environment'
  | 'evm'
  | 'EvmEncodeParam'
  | 'EvmDecodeParam'
  | 'JSON'
  | 'EvmCallBuilder'
export type MapBaseTypeCallback = (param: AbiParameter) => string
export type TupleDefinition = {
  className: string
  components: AbiParameter[]
}
export type TupleDefinitionsMap = Map<string, TupleDefinition>
export type EventDefinition = {
  className: string
  components: (AbiParameter & { indexed?: boolean })[]
}
export type EventDefinitionsMap = Map<string, EventDefinition>
export const TUPLE_ABI_TYPE = 'tuple'

export type AbiItem = AbiFunctionItem | AbiEventItem
export type AbiEventItem = {
  type: 'event'
  name: string
  inputs?: (AbiParameter & { indexed?: boolean })[]
  anonymous?: boolean
}
export type AbiFunctionItem = {
  type: 'function'
  name: string
  escapedName?: string
  stateMutability?: string
  inputs?: AbiParameter[]
  outputs?: AbiParameter[]
  [key: string]: unknown
}
