import { expect } from 'chai'

import { getFunctionSelector } from '../src/helpers'
import { AbisInterfaceGenerator } from '../src/lib'
import { AbiFunctionItem, AssemblyPrimitiveTypes, LibTypes } from '../src/types'

import { createNonViewFunction, createPayableFunction, createPureFunction, createViewFunction } from './helpers'

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

      expect(result).to.contain(`private _address: ${LibTypes.Address}`)
      expect(result).to.contain(`private _chainId: ${LibTypes.ChainId}`)
      expect(result).to.contain(`private _timestamp: Date | null`)

      expect(result).to.contain(
        `constructor(address: ${LibTypes.Address}, chainId: ${LibTypes.ChainId}, timestamp: Date | null = null) {`
      )
      expect(result).to.contain('this._address = address')
      expect(result).to.contain('this._chainId = chainId')
      expect(result).to.contain('this._timestamp = timestamp')
    })
  })

  describe('when generating property getters', () => {
    it('should generate getters with correct return type', () => {
      const abi = [createViewFunction('getValue', [], [{ type: 'uint256' }])]
      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`get address(): ${LibTypes.Address} {`)
      expect(result).to.contain('return this._address.clone()')
      expect(result).to.contain(`get chainId(): ${LibTypes.ChainId} {`)
      expect(result).to.contain('return this._chainId')
      expect(result).to.contain(`get timestamp(): ${AssemblyPrimitiveTypes.Date} | null {`)
      expect(result).to.contain(
        `return this._timestamp ? new ${AssemblyPrimitiveTypes.Date}(changetype<${AssemblyPrimitiveTypes.Date}>(this._timestamp).getTime()) : null`
      )
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

    it('should handle duplicate method names', () => {
      const abi: AbiFunctionItem[] = [
        createViewFunction('getData', [], [{ type: 'uint256' }]),
        createNonViewFunction('getData', [{ name: 'id', type: 'uint256' }]),
        createPayableFunction('getData', [
          { name: 'id', type: 'uint256' },
          { name: 'flag', type: 'bool' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`getData(): ${LibTypes.BigInt} {`)
      expect(result).to.contain(`getData_1(id: ${LibTypes.BigInt}): CallBuilder {`)
      expect(result).to.contain(
        `getData_2(id: ${LibTypes.BigInt}, flag: ${AssemblyPrimitiveTypes.bool}): CallBuilder {`
      )
    })

    it('should handle mixed duplicate and unique method names', () => {
      const abi: AbiFunctionItem[] = [
        createViewFunction('getBalance', [], [{ type: 'uint256' }]),
        createNonViewFunction('transfer', [{ name: 'to', type: 'address' }]),
        createViewFunction('getBalance', [{ name: 'owner', type: 'address' }], [{ type: 'uint256' }]),
        createViewFunction('getName', [], [{ type: 'string' }]),
        createPayableFunction('transfer', [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`getBalance(): ${LibTypes.BigInt} {`)
      expect(result).to.contain(`transfer(to: ${LibTypes.Address}): CallBuilder {`)
      expect(result).to.contain(`getBalance_1(owner: ${LibTypes.Address}): ${LibTypes.BigInt} {`)
      expect(result).to.contain(`getName(): ${AssemblyPrimitiveTypes.string} {`)
      expect(result).to.contain(`transfer_1(to: ${LibTypes.Address}, amount: ${LibTypes.BigInt}): CallBuilder {`)
    })

    it('should handle duplicate method names with reserved word conflicts', () => {
      const abi: AbiFunctionItem[] = [
        createViewFunction('constructor', [], [{ type: 'uint256' }]),
        createNonViewFunction('constructor', [{ name: 'value', type: 'uint256' }]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`constructor_(): ${LibTypes.BigInt} {`)
      expect(result).to.contain(`constructor_1(value: ${LibTypes.BigInt}): CallBuilder {`)
    })
  })

  describe('when filtering functions', () => {
    it('should include read and write functions', () => {
      const viewFunctionNames = ['getBalance', 'getName']
      const pureFunctionNames = ['calculateTotal', 'formatAddress']
      const nonViewFunctionNames = ['transfer', 'mint', 'burn']

      const abi = [
        ...viewFunctionNames.map((name) => createViewFunction(name, [], [{ type: 'uint256' }])),
        ...pureFunctionNames.map((name) => createPureFunction(name, [], [{ type: 'uint256' }])),
        ...nonViewFunctionNames.map((name) => createNonViewFunction(name, [], [])),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      viewFunctionNames
        .concat(pureFunctionNames)
        .concat(nonViewFunctionNames)
        .forEach((name) => {
          expect(result).to.contain(`${name}()`)
        })
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
      expect(result).to.contain(`boolParam: ${AssemblyPrimitiveTypes.bool}`)
      expect(result).to.contain(`stringParam: ${AssemblyPrimitiveTypes.string}`)
      expect(result).to.contain(`uint8Param: ${AssemblyPrimitiveTypes.u8}`)
      expect(result).to.contain(`uint256Param: ${LibTypes.BigInt}`)
      expect(result).to.contain(`int8Param: ${AssemblyPrimitiveTypes.i8}`)
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
      expect(result).to.contain(`boolArray: ${AssemblyPrimitiveTypes.bool}[]`)
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

      const selector = getFunctionSelector(abi[0])

      expect(result).to.contain(
        ` environment.contractCall(this._address, this._chainId, this._timestamp, '${selector}' + evm.encode([EvmEncodeParam.fromValue('address', owner)]))`
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

      expect(result).to.contain('bigIntParam')
      expect(result).to.contain(`${LibTypes.Bytes}.fromBool(boolParam)`)
      expect(result).to.contain(`${LibTypes.BigInt}.fromU8(u8Param)`)
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

      expect(result).to.contain(`return ${LibTypes.Address}.fromString(decodedResponse)`)
      expect(result).to.contain(`return ${LibTypes.BigInt}.fromString(decodedResponse)`)
      expect(result).to.contain(`return ${LibTypes.Bytes}.fromHexString(decodedResponse)`)
      expect(result).to.contain(
        `return ${AssemblyPrimitiveTypes.u8}.parse(decodedResponse) as ${AssemblyPrimitiveTypes.bool}`
      )
      expect(result).to.contain(`return decodedResponse`)
    })

    it('should correctly map array return types', () => {
      const abi = [createViewFunction('getAddressArray', [], [{ name: 'addresses', type: 'address[]' }])]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(
        `return decodedResponse === '' ? [] : parseCSVNotNullable(decodedResponse).map<${LibTypes.Address}>(((item0: string) => ${LibTypes.Address}.fromString(item0)))`
      )
    })

    it('should handle functions without return values', () => {
      const functionName = 'noReturn'
      const abi = [createViewFunction(functionName, [], [])]
      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME).replace(/return.*\n/g, '')

      const selector = getFunctionSelector(abi[0])

      expect(result).to.contain(`${functionName}(): void {`)

      expect(result).to.contain(
        `environment.contractCall(this._address, this._chainId, this._timestamp, '${selector}')`
      )
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
      const importMatch = result.match(/import \{ ([A-Za-z, ]+) \} from '@mimicprotocol\/lib-ts'/)?.toString()

      expect(importMatch).not.to.be.undefined
      expect(importMatch).to.contain(`${LibTypes.Address}`)
      expect(importMatch).to.contain(`${LibTypes.BigInt}`)
      expect(importMatch).to.contain(`${LibTypes.Bytes}`)
    })
  })

  describe('when generating tuple classes', () => {
    it('should extract struct name from internalType', () => {
      const abi = [
        createViewFunction(
          'getUserInfo',
          [],
          [
            {
              name: 'info',
              type: 'tuple',
              internalType: 'struct UserContract.UserInfo',
              components: [
                { name: 'id', type: 'uint256' },
                { name: 'name', type: 'string' },
              ],
            },
          ]
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain('export class UserInfo {')
      expect(result).not.to.contain('export class Tuple0 {')
    })

    it('should extract struct name without contract prefix', () => {
      const abi = [
        createViewFunction(
          'getAssetDetails',
          [],
          [
            {
              name: 'details',
              type: 'tuple',
              internalType: 'struct AssetDetails',
              components: [
                { name: 'id', type: 'uint256' },
                { name: 'value', type: 'uint256' },
              ],
            },
          ]
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain('export class AssetDetails {')
    })

    it('should fallback to generic tuple name if no internalType is provided', () => {
      const abi = [
        createViewFunction(
          'getConfig',
          [],
          [
            {
              name: 'config',
              type: 'tuple',
              components: [
                { name: 'enabled', type: 'bool' },
                { name: 'value', type: 'uint256' },
              ],
            },
          ]
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain('export class Tuple0 {')
    })

    it('should properly handle type conversions in toEvmEncodeParams', () => {
      const abi = [
        createViewFunction(
          'getData',
          [],
          [
            {
              name: 'data',
              type: 'tuple',
              components: [
                { name: 'flag', type: 'bool' },
                { name: 'text', type: 'string' },
                { name: 'amount', type: 'uint256' },
              ],
            },
          ]
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      // Check that proper type conversions are applied in toEvmEncodeParams
      expect(result).to.contain('toEvmEncodeParams(): EvmEncodeParam[] {')
      expect(result).to.contain(`EvmEncodeParam.fromValue('bool', ${LibTypes.Bytes}.fromBool(this.flag))`)
      expect(result).to.contain(`EvmEncodeParam.fromValue('string', ${LibTypes.Bytes}.fromUTF8(this.text))`)
      // eslint-disable-next-line no-secrets/no-secrets
      expect(result).to.contain(`EvmEncodeParam.fromValue('uint256', this.amount)`)
    })

    it('should generate proper parse method for handling tuple data', () => {
      const abi = [
        createViewFunction(
          'getComplexData',
          [],
          [
            {
              name: 'complexData',
              type: 'tuple',
              components: [
                { name: 'id', type: 'uint256' },
                { name: 'account', type: 'address' },
                { name: 'active', type: 'bool' },
                { name: 'data', type: 'bytes' },
                { name: 'description', type: 'string' },
              ],
            },
          ]
        ),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      // Check parse method existence and signature
      expect(result).to.contain('static parse(data: string): Tuple0 {')
      expect(result).to.contain('const parts = parseCSVNotNullable(data)')
      expect(result).to.contain('if (parts.length !== 5) throw new Error("Invalid data for tuple parsing")')

      // Check type conversions
      expect(result).to.contain(`id: ${LibTypes.BigInt} = BigInt.fromString(parts[0])`)
      expect(result).to.contain(`account: ${LibTypes.Address} = Address.fromString(parts[1])`)
      expect(result).to.contain(
        `active: ${AssemblyPrimitiveTypes.bool} = ${AssemblyPrimitiveTypes.u8}.parse(parts[2]) as ${AssemblyPrimitiveTypes.bool}`
      )
      expect(result).to.contain(`data_var: ${LibTypes.Bytes} = Bytes.fromHexString(parts[3])`)
      expect(result).to.contain(`description: ${AssemblyPrimitiveTypes.string} = parts[4]`)

      // Check constructor call
      expect(result).to.contain('return new Tuple0(id, account, active, data_var, description)')
    })
  })

  describe('when handling write functions', () => {
    it('should generate methods that return CallBuilder type', () => {
      const abi = [
        createNonViewFunction('transfer', [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ]),
        createPayableFunction('deposit', []),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`transfer(to: ${LibTypes.Address}, amount: ${LibTypes.BigInt}): CallBuilder {`)
      expect(result).to.contain(`deposit(): CallBuilder {`)
    })

    it('should generate proper encoded data for write functions', () => {
      const abi = [
        createNonViewFunction('transfer', [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)
      const selector = getFunctionSelector(abi[0])

      expect(result).to.contain(
        // eslint-disable-next-line no-secrets/no-secrets
        `const encodedData = ${LibTypes.Bytes}.fromHexString('${selector}' + evm.encode([EvmEncodeParam.fromValue('address', to), EvmEncodeParam.fromValue('uint256', amount)]))`
      )
    })

    it('should generate CallBuilder with proper chain and fee configuration', () => {
      const abi = [
        createNonViewFunction('approve', [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`return CallBuilder.forChain(this._chainId).addCall(this._address, encodedData)`)
    })

    it('should handle write functions without parameters', () => {
      const abi = [createPayableFunction('deposit', [])]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)
      const selector = getFunctionSelector(abi[0])

      expect(result).to.contain('deposit(): CallBuilder {')
      expect(result).to.contain(`const encodedData = ${LibTypes.Bytes}.fromHexString('${selector}')`)
      expect(result).not.to.contain('evm.encode')
    })

    it('should handle both payable and nonpayable write functions', () => {
      const abi = [
        createNonViewFunction('transfer', [{ name: 'to', type: 'address' }]),
        createPayableFunction('deposit', [{ name: 'amount', type: 'uint256' }]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`transfer(to: ${LibTypes.Address}): CallBuilder {`)
      expect(result).to.contain(`deposit(amount: ${LibTypes.BigInt}): CallBuilder {`)
    })

    it('should apply correct parameter conversions for write functions', () => {
      const abi = [
        createNonViewFunction('complexTransfer', [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'flag', type: 'bool' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(`EvmEncodeParam.fromValue('address', to)`)
      // eslint-disable-next-line no-secrets/no-secrets
      expect(result).to.contain(`EvmEncodeParam.fromValue('uint256', amount)`)
      expect(result).to.contain(`EvmEncodeParam.fromValue('bytes', data)`)
      expect(result).to.contain(`EvmEncodeParam.fromValue('bool', ${LibTypes.Bytes}.fromBool(flag))`)
    })

    it('should generate proper imports for write functions', () => {
      const abi = [createPayableFunction('deposit', [{ name: 'amount', type: 'uint256' }])]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)
      const importMatch = result.match(/import \{ ([A-Za-z, ]+) \} from '@mimicprotocol\/lib-ts'/)?.toString()

      expect(importMatch).not.to.be.undefined
      expect(importMatch).to.contain('CallBuilder')
      expect(importMatch).to.contain(`${LibTypes.Bytes}`)
    })

    it('should handle write functions with array parameters', () => {
      const abi = [
        createNonViewFunction('batchTransfer', [
          { name: 'recipients', type: 'address[]' },
          { name: 'amounts', type: 'uint256[]' },
          { name: 'flags', type: 'bool[]' },
        ]),
        createPayableFunction('depositMultiple', [
          { name: 'tokens', type: 'address[]' },
          { name: 'values', type: 'uint256[]' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(
        `batchTransfer(recipients: ${LibTypes.Address}[], amounts: ${LibTypes.BigInt}[], flags: ${AssemblyPrimitiveTypes.bool}[]): CallBuilder {`
      )
      expect(result).to.contain(
        `depositMultiple(tokens: ${LibTypes.Address}[], values: ${LibTypes.BigInt}[]): CallBuilder {`
      )

      expect(result).to.contain(
        `EvmEncodeParam.fromValues('address[]', recipients.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('address', s0)))`
      )
      expect(result).to.contain(
        // eslint-disable-next-line no-secrets/no-secrets
        `EvmEncodeParam.fromValues('uint256[]', amounts.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('uint256', s0)))`
      )
      expect(result).to.contain(
        `EvmEncodeParam.fromValues('bool[]', flags.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('bool', ${LibTypes.Bytes}.fromBool(s0))))`
      )
    })

    it('should handle write functions with tuple/struct parameters', () => {
      const abi = [
        createNonViewFunction('createUser', [
          {
            name: 'userData',
            type: 'tuple',
            internalType: 'struct UserInfo',
            components: [
              { name: 'id', type: 'uint256' },
              { name: 'name', type: 'string' },
              { name: 'active', type: 'bool' },
            ],
          },
        ]),
        createPayableFunction('updateProfile', [
          {
            name: 'profile',
            type: 'tuple',
            components: [
              { name: 'email', type: 'string' },
              { name: 'age', type: 'uint8' },
              { name: 'wallet', type: 'address' },
            ],
          },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain('createUser(userData: UserInfo): CallBuilder {')
      expect(result).to.contain('updateProfile(profile: Tuple1): CallBuilder {')

      expect(result).to.contain(`EvmEncodeParam.fromValues('()', userData.toEvmEncodeParams())`)
      expect(result).to.contain(`EvmEncodeParam.fromValues('()', profile.toEvmEncodeParams())`)

      expect(result).to.contain('export class UserInfo {')
      expect(result).to.contain('export class Tuple1 {')
    })

    it('should handle write functions with nested complex types', () => {
      const abi = [
        createNonViewFunction('processOrders', [
          {
            name: 'orders',
            type: 'tuple[]',
            components: [
              { name: 'id', type: 'uint256' },
              { name: 'items', type: 'address[]' },
              { name: 'quantities', type: 'uint256[]' },
              { name: 'buyer', type: 'address' },
            ],
          },
        ]),
        createPayableFunction('complexOperation', [
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'values', type: 'uint256[]' },
              { name: 'addresses', type: 'address[]' },
              {
                name: 'config',
                type: 'tuple',
                components: [
                  { name: 'enabled', type: 'bool' },
                  { name: 'threshold', type: 'uint256' },
                ],
              },
            ],
          },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain('processOrders(orders: Tuple0[]): CallBuilder {')
      expect(result).to.contain('complexOperation(data: Tuple1): CallBuilder {')

      expect(result).to.contain(
        `EvmEncodeParam.fromValues('()[]', orders.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValues('()', s0.toEvmEncodeParams())))`
      )

      expect(result).to.contain(`EvmEncodeParam.fromValues('()', data.toEvmEncodeParams())`)

      expect(result).to.contain('export class Tuple0 {')
      expect(result).to.contain('export class Tuple1 {')
    })

    it('should handle write functions with mixed parameter complexity', () => {
      const abi = [
        createNonViewFunction('mixedFunction', [
          { name: 'simpleAddress', type: 'address' },
          { name: 'simpleAmount', type: 'uint256' },
          { name: 'addressArray', type: 'address[]' },
          {
            name: 'userInfo',
            type: 'tuple',
            components: [
              { name: 'id', type: 'uint256' },
              { name: 'roles', type: 'uint8[]' },
            ],
          },
          { name: 'flags', type: 'bool[]' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(
        `mixedFunction(simpleAddress: ${LibTypes.Address}, simpleAmount: ${LibTypes.BigInt}, addressArray: ${LibTypes.Address}[], userInfo: Tuple0, flags: ${AssemblyPrimitiveTypes.bool}[]): CallBuilder {`
      )

      expect(result).to.contain(`EvmEncodeParam.fromValue('address', simpleAddress)`)
      // eslint-disable-next-line no-secrets/no-secrets
      expect(result).to.contain(`EvmEncodeParam.fromValue('uint256', simpleAmount)`)
      expect(result).to.contain(
        `EvmEncodeParam.fromValues('address[]', addressArray.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('address', s0)))`
      )
      expect(result).to.contain(`EvmEncodeParam.fromValues('()', userInfo.toEvmEncodeParams())`)
      expect(result).to.contain(
        `EvmEncodeParam.fromValues('bool[]', flags.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('bool', ${LibTypes.Bytes}.fromBool(s0))))`
      )
    })

    it('should handle write functions with array of arrays', () => {
      const abi = [
        createNonViewFunction('batchOperations', [
          { name: 'addressMatrix', type: 'address[][]' },
          { name: 'valueMatrix', type: 'uint256[][]' },
          { name: 'flagMatrix', type: 'bool[][]' },
        ]),
        createPayableFunction('processMatrix', [
          { name: 'data', type: 'bytes[][]' },
          { name: 'ids', type: 'uint256[][]' },
        ]),
      ]

      const result = AbisInterfaceGenerator.generate(abi, CONTRACT_NAME)

      expect(result).to.contain(
        `batchOperations(addressMatrix: ${LibTypes.Address}[][], valueMatrix: ${LibTypes.BigInt}[][], flagMatrix: ${AssemblyPrimitiveTypes.bool}[][]): CallBuilder {`
      )
      expect(result).to.contain(
        `processMatrix(data: ${LibTypes.Bytes}[][], ids: ${LibTypes.BigInt}[][]): CallBuilder {`
      )

      expect(result).to.contain(
        `EvmEncodeParam.fromValues('address[][]', addressMatrix.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValues('address[]', s0.map<EvmEncodeParam>((s1) => EvmEncodeParam.fromValue('address', s1)))))`
      )

      expect(result).to.contain(
        // eslint-disable-next-line no-secrets/no-secrets
        `EvmEncodeParam.fromValues('uint256[][]', valueMatrix.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValues('uint256[]', s0.map<EvmEncodeParam>((s1) => EvmEncodeParam.fromValue('uint256', s1)))))`
      )
      expect(result).to.contain(
        `EvmEncodeParam.fromValues('bool[][]', flagMatrix.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValues('bool[]', s0.map<EvmEncodeParam>((s1) => EvmEncodeParam.fromValue('bool', ${LibTypes.Bytes}.fromBool(s1))))))`
      )
      expect(result).to.contain(
        `EvmEncodeParam.fromValues('bytes[][]', data.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValues('bytes[]', s0.map<EvmEncodeParam>((s1) => EvmEncodeParam.fromValue('bytes', s1)))))`
      )
    })
  })
})
