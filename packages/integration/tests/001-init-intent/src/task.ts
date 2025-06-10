import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const value = BigInt.fromString('5')
  const chainId = 1
  const feeToken = new Token(NULL_ADDRESS, chainId, 18, 'TEST')
  const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

  // Replace this with your task code
  environment.call([new CallData(target, data, value)], feeTokenAmount, chainId, settler)
}
