import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const chainId = 1
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = new Token(NULL_ADDRESS, chainId, 18, 'TEST')
  let feeAmount = BigInt.zero()
  const feeTokenAmount = new TokenAmount(feeToken, feeAmount)

  feeAmount = feeAmount.plus(BigInt.fromI32(undeclaredVariable))

  // Replace this with your task code
  environment.call([new CallData(target, data, BigInt.zero())], feeTokenAmount, settler)
}
