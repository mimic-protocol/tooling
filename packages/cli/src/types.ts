import { z } from 'zod'

import { ManifestValidator } from './validators'

export type Manifest = z.infer<typeof ManifestValidator>
export type ManifestInputs = z.infer<typeof ManifestValidator.shape.inputs>

export type AbiParameter = {
  name?: string
  escapedName?: string
  type: string
  internalType?: string
  components?: AbiParameter[]
}

export type AbiFunctionItem = {
  type: string
  name: string
  escapedName?: string
  stateMutability?: string
  inputs?: AbiParameter[]
  outputs?: AbiParameter[]
  [key: string]: unknown
}

export enum LibTypes {
  BigInt = 'BigInt',
  Address = 'Address',
  Bytes = 'Bytes',
  ChainId = 'ChainId',
  TokenAmount = 'TokenAmount',
  Void = 'Void',
}

export enum AssemblyPrimitiveTypes {
  u8 = 'u8',
  u16 = 'u16',
  u32 = 'u32',
  u64 = 'u64',
  i8 = 'i8',
  i16 = 'i16',
  i32 = 'i32',
  i64 = 'i64',
  bool = 'bool',
  string = 'string',
  Date = 'Date',
}

export type AssemblyTypes = `${LibTypes}` | `${AssemblyPrimitiveTypes}` | 'unknown'
