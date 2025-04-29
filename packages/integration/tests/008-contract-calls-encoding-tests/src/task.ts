import { Address, BigInt, Bytes } from '@mimicprotocol/lib-ts'

import { TEST } from './types/TEST'

const TEST_ADDRESS = Address.fromString('0xcc7d7defe9d5e26cddea572e7d9f46d87d849105')
const TEST_CHAIN_ID = 11155111

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

  testContract.readDynamicAddressArray([TEST_ADDRESS])
  testContract.readFixedAddressArray([TEST_ADDRESS, TEST_ADDRESS, TEST_ADDRESS])
}
