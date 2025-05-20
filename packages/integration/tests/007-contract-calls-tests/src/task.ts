import { Address, BigInt, Bytes, Token } from '@mimicprotocol/lib-ts'

import { ERC20 } from './types/ERC20'
import { ERC4626 } from './types/ERC4626'
import { SAFE } from './types/SAFE'
import { MyStruct, Test } from './types/Test'

const MAINNET_CHAIN_ID = 1
const POLYGON_CHAIN_ID = 137

const TEST_ADDRESS = Address.fromString('0x047be3bb46f9416732fe39a05134f20235c19334')
const TEST_CHAIN_ID = 11155111
const TEST_BYTES = Bytes.fromHexString('0x0102030405')

export default function main(): void {
  const USDC = new Token('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', MAINNET_CHAIN_ID, 6)
  const usdcContract = new ERC20(USDC.address, USDC.chainId)
  usdcContract.name()
  usdcContract.totalSupply()
  usdcContract.decimals()
  usdcContract.balanceOf(Address.zero())
  usdcContract.symbol()
  usdcContract.allowance(Address.zero(), Address.zero())

  const customTimestamp = Date.fromString('2025-04-04T16:35:57-03:00')
  const erc4626Contract = new ERC4626(Address.zero(), POLYGON_CHAIN_ID, customTimestamp)
  erc4626Contract.convertToAssets(BigInt.fromI32(1234))

  const safeContract = new SAFE(Address.zero(), MAINNET_CHAIN_ID)
  safeContract.encodeTransactionData(
    Address.zero(),
    BigInt.fromI32(1),
    Bytes.fromHexString('0x1234'),
    0,
    BigInt.fromI32(2),
    BigInt.fromI32(3),
    BigInt.fromI32(4),
    Address.zero(),
    Address.zero(),
    BigInt.fromI32(5)
  )

  const testContract = new Test(TEST_ADDRESS, TEST_CHAIN_ID)

  testContract.concatStrings('Hello', 'World')
  testContract.echoUint(BigInt.fromU32(123456))
  testContract.readAddress(TEST_ADDRESS)
  testContract.getBool()

  const bytes1 = new Bytes(32)
  bytes1.set([1], 0)
  const bytes2 = new Bytes(32)
  bytes2.set([2], 0)
  const bytes3 = new Bytes(32)
  bytes3.set([3], 0)

  const arr = [bytes1, bytes2, bytes3]
  testContract.getElement(arr, BigInt.fromU32(1))
  testContract.getStatusName(1)

  testContract.readDynamicAddressArray([TEST_ADDRESS])
  testContract.readFixedAddressArray([TEST_ADDRESS, TEST_ADDRESS, TEST_ADDRESS])

  testContract.processTransactionData(TEST_ADDRESS, BigInt.fromU64(8388608), 'testing', TEST_BYTES)
  testContract.reverseBytes(TEST_BYTES)
  testContract.sumArray([
    BigInt.fromU32(1000),
    BigInt.fromU32(2000),
    BigInt.fromU32(3000),
    BigInt.fromU32(4000),
    BigInt.fromU32(5000),
  ])
  testContract.readBytes8(TEST_BYTES)
  testContract.readBytes16(TEST_BYTES.concat(TEST_BYTES))

  testContract.getIntArray(BigInt.fromI32(-20))

  const myStruct = new MyStruct(BigInt.fromU32(1), 'test', BigInt.fromI32(-20))
  testContract.echoStruct(myStruct)
}
