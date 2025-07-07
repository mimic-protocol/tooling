import { AbiParameter, LibTypes } from '../../types'

export type ImportedTypes =
  | LibTypes
  | 'environment'
  | 'evm'
  | 'EvmEncodeParam'
  | 'EvmEncodeParamBase'
  | 'EvmDecodeParam'
  | 'parseCSVNotNullable'
  | 'CallBuilder'
export type MapBaseTypeCallback = (param: AbiParameter) => string
export type TupleDefinition = {
  className: string
  components: AbiParameter[]
}
export type TupleDefinitionsMap = Map<string, TupleDefinition>
export const TUPLE_ABI_TYPE = 'tuple'
