import { AbiParameter, AssemblyTypes, InputType, LibTypes } from '../../types'

import ArrayHandler from './ArrayHandler'
import { ImportManager } from './ImportManager'
import { TupleHandler } from './TupleHandler'

export class AbiTypeConverter {
  private importManager: ImportManager
  private tupleHandler: TupleHandler
  private readonly abiTypecastMap: Readonly<Record<string, InputType>>

  constructor(importManager: ImportManager, tupleHandler: TupleHandler) {
    this.importManager = importManager
    this.tupleHandler = tupleHandler
    this.abiTypecastMap = this.generateAbiTypecastMap()
  }

  public mapAbiType(param: AbiParameter): string {
    const abiType = param.type

    if (ArrayHandler.isArrayType(abiType)) {
      const mapBaseTypeCallback = this.mapAbiType.bind(this)
      return ArrayHandler.generateLibTypeArray(param, mapBaseTypeCallback)
    }

    if (this.tupleHandler.isTupleType(abiType)) {
      const existingClassName = this.tupleHandler.getClassNameForTupleDefinition(param)
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
      case AssemblyTypes.bool:
        this.importManager.addType(LibTypes.Bytes)
        return `${LibTypes.Bytes}.fromBool(${paramName})`
      case AssemblyTypes.i8:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromI8(${paramName})`
      case AssemblyTypes.u8:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromU8(${paramName})`
      case AssemblyTypes.i16:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromI16(${paramName})`
      case AssemblyTypes.u16:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromU16(${paramName})`
      case AssemblyTypes.i32:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromI32(${paramName})`
      case AssemblyTypes.u32:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromU32(${paramName})`
      case AssemblyTypes.i64:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromI64(${paramName})`
      case AssemblyTypes.u64:
        this.importManager.addType(LibTypes.BigInt)
        return `${LibTypes.BigInt}.fromU64(${paramName})`
      case AssemblyTypes.string:
        this.importManager.addType(LibTypes.Bytes)
        return `${LibTypes.Bytes}.fromUTF8(${paramName})`
      case LibTypes.BigInt:
      case LibTypes.Address:
      case LibTypes.Bytes:
        return paramName
      default:
        return paramName
    }
  }

  public generateTypeConversion(
    type: InputType,
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
      case AssemblyTypes.i8:
      case AssemblyTypes.u8:
      case AssemblyTypes.i16:
      case AssemblyTypes.u16:
      case AssemblyTypes.i32:
      case AssemblyTypes.u32:
      case AssemblyTypes.i64:
      case AssemblyTypes.u64:
        conversion = `${type}.parse(${valueVarName})`
        break
      case AssemblyTypes.bool:
        conversion = `${AssemblyTypes.u8}.parse(${valueVarName}) as ${AssemblyTypes.bool}`
        break
      default:
        conversion = this.tupleHandler.isTupleClassName(type) ? `${type}._parse(${valueVarName})` : valueVarName
        break
    }
    return isMapFunction ? `${valueVarName} => ${conversion}` : includeReturn ? `return ${conversion}` : conversion
  }

  private generateIntegerTypeMappings(): Record<string, InputType> {
    const mappings: Record<string, InputType> = {
      int8: AssemblyTypes.i8,
      uint8: AssemblyTypes.u8,
      int16: AssemblyTypes.i16,
      uint16: AssemblyTypes.u16,
      int32: AssemblyTypes.i32,
      uint32: AssemblyTypes.u32,
      int64: AssemblyTypes.i64,
      uint64: AssemblyTypes.u64,
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

  private generateBytesTypeMappings(): Record<string, InputType> {
    const mappings: Record<string, InputType> = {
      bytes: LibTypes.Bytes,
    }
    const MAX_SIZE = 32
    for (let size = 1; size <= MAX_SIZE; size++) {
      mappings[`bytes${size}`] = LibTypes.Bytes
    }
    return mappings
  }

  private generateAbiTypecastMap(): Readonly<Record<string, InputType>> {
    return {
      ...this.generateIntegerTypeMappings(),
      ...this.generateBytesTypeMappings(),
      address: LibTypes.Address,
      bool: AssemblyTypes.bool,
      string: AssemblyTypes.string,
    } as const
  }
}
