import { Address, BigInt } from '@mimicprotocol/lib-ts'

import { TEST } from './types/TEST'

const TEST_ADDRESS = '0x2fc31716b5b385645255c5f08d9e65ce1fd21b21'
const TEST_CHAIN_ID = 11155111

export default function main(): void {
  const testContract = new TEST(Address.fromString(TEST_ADDRESS), TEST_CHAIN_ID)

  testContract.concatStrings('Hello', 'World')
  testContract.echoUint(BigInt.fromU32(123456))
  testContract.getAddress()
  testContract.getBool()
}
