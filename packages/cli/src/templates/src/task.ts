import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = new Token(NULL_ADDRESS, 1, 18, 'TEST')
  const feeTokenAmount = new TokenAmount(feeToken, BigInt.zero())

  // Replace this with your task code
  environment.call([new CallData(target, data)], feeTokenAmount, settler)
}
