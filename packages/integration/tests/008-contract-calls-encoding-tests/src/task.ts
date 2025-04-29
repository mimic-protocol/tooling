import { Address, BigInt, Bytes } from '@mimicprotocol/lib-ts'

import { TEST } from './types/TEST'

const TEST_ADDRESS = Address.fromString('0x29464439c0267fe6ab8a306f304402f760b29f7e')
const TEST_CHAIN_ID = 11155111
const TEST_BYTES = Bytes.fromHexString('0x0102030405')

export default function main(): void {
  const testContract = new TEST(TEST_ADDRESS, TEST_CHAIN_ID)

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
}
