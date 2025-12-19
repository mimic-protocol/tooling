import capitalize from 'lodash/capitalize'

import { AbiParameter, AssemblyPrimitiveTypes, AssemblyTypes, LibTypes } from '../../types'

import ArrayHandler from './ArrayHandler'
import ImportManager from './ImportManager'
import TupleHandler from './TupleHandler'
import { TupleDefinitionsMap } from './types'

export default class AbiTypeConverter {
  private importManager: ImportManager
  private tupleDefinitions: TupleDefinitionsMap
  private readonly abiTypecastMap: Readonly<Record<string, AssemblyTypes>>

  constructor(importManager: ImportManager, tupleDefinitions: TupleDefinitionsMap) {
    this.importManager = importManager
    this.tupleDefinitions = tupleDefinitions
    this.abiTypecastMap = this.generateAbiTypecastMap()
  }

  public mapAbiType(param: AbiParameter): string {
    const abiType = param.type

    if (ArrayHandler.isArrayType(abiType)) return ArrayHandler.generateLibTypeArray(param, this.mapAbiType.bind(this))

    if (TupleHandler.isBaseTypeATuple(abiType)) {
      const existingClassName = TupleHandler.getClassNameForTupleDefinition(param, this.tupleDefinitions)
      if (existingClassName) return existingClassName

      console.warn(
        `Tuple class name not found by AbiTypeConverter for: ${param.type}, internal: ${param.internalType}. It might be an anonymous or unextracted tuple.`
      )
      return 'unknown'
    }

    const mapped = this.abiTypecastMap[abiType] || 'unknown'
    if (mapped === 'unknown') console.warn(`Unknown type: ${param.type}`)

    if (Object.values(LibTypes).includes(mapped as LibTypes)) {
      this.importManager.addType(mapped as LibTypes)
    }
    return mapped
  }

  public toLibType(paramType: string, paramName: string): string {
    if (ArrayHandler.isArrayType(paramType)) return paramName

    switch (paramType) {
      case AssemblyPrimitiveTypes.bool:
        this.importManager.addType(LibTypes.Bytes)
        return `${LibTypes.Bytes}.fromBool(${paramName})`
      case AssemblyPrimitiveTypes.i8:
      case AssemblyPrimitiveTypes.u8:
      case AssemblyPrimitiveTypes.i16:
      case AssemblyPrimitiveTypes.u16:
      case AssemblyPrimitiveTypes.i32:
      case AssemblyPrimitiveTypes.u32:
      case AssemblyPrimitiveTypes.i64:
      case AssemblyPrimitiveTypes.u64:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.from${capitalize(paramType)}(${paramName})`
      case AssemblyPrimitiveTypes.string:
        this.importManager.addType(LibTypes.Bytes)
        return `${LibTypes.Bytes}.fromUTF8(${paramName})`
      case LibTypes.BigInt:
      case LibTypes.Address:
      case LibTypes.Bytes:
      default:
        return paramName
    }
  }

  public generateTypeConversion(
    type: string,
    valueVarName: string,
    isMapFunction: boolean,
    includeReturn: boolean = true
  ): string {
    let conversion: string
    switch (type) {
      case LibTypes.BigInt:
      case LibTypes.Address:
        conversion = `${type}.fromString(${valueVarName})`
        break
      case LibTypes.Bytes:
        conversion = `${type}.fromHexString(${valueVarName})`
        break
      case AssemblyPrimitiveTypes.i8:
      case AssemblyPrimitiveTypes.u8:
      case AssemblyPrimitiveTypes.i16:
      case AssemblyPrimitiveTypes.u16:
      case AssemblyPrimitiveTypes.i32:
      case AssemblyPrimitiveTypes.u32:
      case AssemblyPrimitiveTypes.i64:
      case AssemblyPrimitiveTypes.u64:
        conversion = `${type}.parse(${valueVarName})`
        break
      case AssemblyPrimitiveTypes.bool:
        conversion = `${AssemblyPrimitiveTypes.u8}.parse(${valueVarName}) as ${AssemblyPrimitiveTypes.bool}`
        break
      default:
        conversion = TupleHandler.isTupleClassName(type, this.tupleDefinitions)
          ? `${type}.parse(${valueVarName})`
          : valueVarName
        break
    }
    return isMapFunction ? `${valueVarName} => ${conversion}` : includeReturn ? `return ${conversion}` : conversion
  }

  private generateIntegerTypeMappings(): Record<string, AssemblyTypes> {
    const mappings: Record<string, AssemblyTypes> = {
      int8: AssemblyPrimitiveTypes.i8,
      uint8: AssemblyPrimitiveTypes.u8,
      int16: AssemblyPrimitiveTypes.i16,
      uint16: AssemblyPrimitiveTypes.u16,
      int32: AssemblyPrimitiveTypes.i32,
      uint32: AssemblyPrimitiveTypes.u32,
      int64: AssemblyPrimitiveTypes.i64,
      uint64: AssemblyPrimitiveTypes.u64,
      int: LibTypes.BigInt,
      uint: LibTypes.BigInt,
    }

    const START_BITS = 24
    const END_BITS = 256
    const STEP = 8

    for (let bits = START_BITS; bits <= END_BITS; bits += STEP) {
      if (!mappings[`int${bits}`]) mappings[`int${bits}`] = LibTypes.BigInt
      if (!mappings[`uint${bits}`]) mappings[`uint${bits}`] = LibTypes.BigInt
    }
    return mappings
  }

  private generateBytesTypeMappings(): Record<string, AssemblyTypes> {
    const mappings: Record<string, AssemblyTypes> = {
      bytes: LibTypes.Bytes,
    }
    const MAX_SIZE = 32
    for (let size = 1; size <= MAX_SIZE; size++) {
      mappings[`bytes${size}`] = LibTypes.Bytes
    }
    return mappings
  }

  private generateAbiTypecastMap(): Readonly<Record<string, AssemblyTypes>> {
    return {
      ...this.generateIntegerTypeMappings(),
      ...this.generateBytesTypeMappings(),
      address: LibTypes.Address,
      bool: AssemblyPrimitiveTypes.bool,
      string: AssemblyPrimitiveTypes.string,
    } as const
  }
}
