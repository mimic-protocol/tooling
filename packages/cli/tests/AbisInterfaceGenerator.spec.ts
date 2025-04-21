import { expect } from 'chai'

import { getKeccak256Selector } from '../src/helpers'
import AbisInterfaceGenerator from '../src/lib/AbisInterfaceGenerator'
import { AbiFunctionItem, AssemblyTypes, LibTypes } from '../src/types'

import { createNonViewFunction, createPureFunction, createViewFunction } from './helpers'

const CONTRACT_NAME = 'TestContract'

describe('AbisInterfaceGenerator', () => {
  describe('when generating a class', () => {
    it('should generate a class with the exact contract name', () => {
      const abi = [createViewFunction('getBalance', [], [{ name: 'balance', type: 'uint256' }])]
      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`export class ${CONTRACT_NAME}`)
    })

    it('should respect contract names with special characters', () => {
      const specialName = 'Test_Contract$123'
      const abi = [createViewFunction('getBalance', [], [{ name: 'balance', type: 'uint256' }])]
      const result = AbisInterfaceGenerator.generate(abi, specialName)

      expect(result).to.contain(`export class ${specialName}`)
    })
  })

  describe('when initializing private properties and constructor', () => {
    it('should correctly initialize private properties in the constructor', () => {
      const abi = [createViewFunction('getValue', [], [{ type: 'uint256' }])]
      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`private address: ${LibTypes.Address}`)
      expect(result).to.contain(`private chainId: ${AssemblyTypes.u64}`)
      expect(result).to.contain(`private timestamp: Date | null`)

      expect(result).to.contain(
        `constructor(address: ${LibTypes.Address}, chainId: ${AssemblyTypes.u64}, timestamp: Date | null = null) {`
      )
      expect(result).to.contain('this.address = address')
      expect(result).to.contain('this.chainId = chainId')
      expect(result).to.contain('this.timestamp = timestamp')
    })
  })

  describe('when generating method names', () => {
    it('should generate methods with exact names from the ABI', () => {
      const functionNames = ['getBalance', 'getName', 'getUserDetails']
      const abi: AbiFunctionItem[] = functionNames.map((name) => createViewFunction(name, [], [{ type: 'uint256' }]))

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      functionNames.forEach((name) => expect(result).to.contain(`${name}()`))
    })

    it('should respect method names with special characters', () => {
      const functionNames = ['get_balance', 'getName123', 'get$Info']
      const abi: AbiFunctionItem[] = functionNames.map((name) => createViewFunction(name, [], [{ type: 'uint256' }]))

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      functionNames.forEach((name) => expect(result).to.contain(`${name}()`))
    })
  })

  describe('when filtering functions', () => {
    it('should include only view and pure functions', () => {
      const viewFunctionNames = ['getBalance', 'getName']
      const pureFunctionNames = ['calculateTotal', 'formatAddress']
      const nonViewFunctionNames = ['transfer', 'mint', 'burn']

      const abi = [
        ...viewFunctionNames.map((name) => createViewFunction(name, [], [{ type: 'uint256' }])),
        ...pureFunctionNames.map((name) => createPureFunction(name, [], [{ type: 'uint256' }])),
        ...nonViewFunctionNames.map((name) => createNonViewFunction(name, [], [])),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      viewFunctionNames.concat(pureFunctionNames).forEach((name) => {
        expect(result).to.contain(`${name}()`)
      })

      nonViewFunctionNames.forEach((name) => {
        expect(result).not.to.contain(`${name}()`)
      })
    })

    it('should return an empty string if there are no view/pure functions', () => {
      const abi = [createNonViewFunction('transfer'), createNonViewFunction('mint')]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)
      expect(result).to.equal('')
    })
  })

  describe('when mapping parameters to types', () => {
    it('should correctly map basic types', () => {
      const abi = [
        createViewFunction(
          'getValues',
          [
            { name: 'addressParam', type: 'address' },
            { name: 'boolParam', type: 'bool' },
            { name: 'stringParam', type: 'string' },
            { name: 'uint8Param', type: 'uint8' },
            { name: 'uint256Param', type: 'uint256' },
            { name: 'int8Param', type: 'int8' },
            { name: 'bytesParam', type: 'bytes' },
            { name: 'bytes32Param', type: 'bytes32' },
          ],
          []
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`addressParam: ${LibTypes.Address}`)
      expect(result).to.contain(`boolParam: ${AssemblyTypes.bool}`)
      expect(result).to.contain(`stringParam: ${AssemblyTypes.string}`)
      expect(result).to.contain(`uint8Param: ${AssemblyTypes.u8}`)
      expect(result).to.contain(`uint256Param: ${LibTypes.BigInt}`)
      expect(result).to.contain(`int8Param: ${AssemblyTypes.i8}`)
      expect(result).to.contain(`bytesParam: ${LibTypes.Bytes}`)
      expect(result).to.contain(`bytes32Param: ${LibTypes.Bytes}`)
    })

    it('should correctly map array types', () => {
      const abi = [
        createViewFunction(
          'getArrays',
          [
            { name: 'addressesArray', type: 'address[]' },
            { name: 'uint256Array', type: 'uint256[]' },
            { name: 'boolArray', type: 'bool[]' },
          ],
          []
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`addressesArray: ${LibTypes.Address}[]`)
      expect(result).to.contain(`uint256Array: ${LibTypes.BigInt}[]`)
      expect(result).to.contain(`boolArray: ${AssemblyTypes.bool}[]`)
    })

    it('should handle parameters without names', () => {
      const abi = [createViewFunction('getValueWithUnnamedParams', [{ type: 'address' }, { type: 'uint256' }], [])]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`param0: ${LibTypes.Address}`)
      expect(result).to.contain(`param1: ${LibTypes.BigInt}`)
    })
  })

  describe('when generating contract call code', () => {
    it('should generate a call to environment.contractCall with the correct parameters', () => {
      const functionName = 'getBalance'
      const abi = [
        createViewFunction(functionName, [{ name: 'owner', type: 'address' }], [{ name: 'balance', type: 'uint256' }]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      const selector = getKeccak256Selector(abi[0])

      expect(result).to.contain(
        `environment.contractCall(this.address, this.chainId, this.timestamp, encodeCallData('${selector}', [owner]))`
      )
    })

    it('should apply the correct conversions to parameters', () => {
      const abi = [
        createViewFunction(
          'getValues',
          [
            { name: 'bigIntParam', type: 'uint256' },
            { name: 'boolParam', type: 'bool' },
            { name: 'u8Param', type: 'uint8' },
          ],
          []
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain('bigIntParam.toBytes()')
      expect(result).to.contain(`${LibTypes.Bytes}.fromBool(boolParam)`)
      expect(result).to.contain(`${LibTypes.Bytes}.fromU8(u8Param)`)
    })
  })

  describe('when handling return values', () => {
    it('should correctly map individual return types', () => {
      const returnTypes = ['address', 'uint256', 'bytes', 'bool', 'uint8', 'string']
      const abi: AbiFunctionItem[] = []

      for (const type of returnTypes) {
        abi.push(createViewFunction(`get${type}`, [], [{ type }]))
      }
      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`return ${LibTypes.Address}.fromString(result)`)
      expect(result).to.contain(`return ${LibTypes.BigInt}.fromString(result)`)
      expect(result).to.contain(`return ${LibTypes.Bytes}.fromHexString(result)`)
      expect(result).to.contain(`return ${AssemblyTypes.bool}.parse(result)`)
      expect(result).to.contain(`return ${AssemblyTypes.u8}.parse(result)`)
      expect(result).to.contain(`return result`)
    })

    it('should correctly map array return types', () => {
      const abi = [createViewFunction('getAddressArray', [], [{ name: 'addresses', type: 'address[]' }])]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(
        `return result === '' ? [] : result.split(',').map(value => ${LibTypes.Address}.fromString(value))`
      )
    })

    it('should handle functions without return values', () => {
      const functionName = 'noReturn'
      const abi = [createViewFunction(functionName, [], [])]
      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      const selector = getKeccak256Selector(abi[0])

      expect(result).to.contain(`${functionName}(): void {`)
      expect(result).to.contain(
        `environment.contractCall(this.address, this.chainId, this.timestamp, encodeCallData('${selector}', []))`
      )
      expect(result).not.to.contain('return')
    })
  })

  describe('when importing dependencies', () => {
    it('should correctly import the used dependencies', () => {
      const abi = [
        createViewFunction(
          'getAllTypes',
          [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
          [{ type: 'bool' }]
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)
      const importMatch = result.match(/^import \{ ([A-Za-z, ]+) \} from '@mimicprotocol\/lib-ts'/)?.toString()

      expect(importMatch).not.to.be.undefined
      expect(importMatch).to.contain(`${LibTypes.Address}`)
      expect(importMatch).to.contain(`${LibTypes.BigInt}`)
      expect(importMatch).to.contain(`${LibTypes.Bytes}`)
    })
  })
})
