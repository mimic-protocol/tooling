import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS, Token, TokenAmount } from '@mimicprotocol/lib-ts'

declare namespace input {
  const firstStaticNumber: i32
  const secondStaticNumber: i32
}

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const chainId = 1
  const feeAmount = BigInt.zero()

  const feeToken = new Token(NULL_ADDRESS, chainId, 18, 'TEST')

  const fee1 = feeAmount.times(BigInt.fromI32(input.firstStaticNumber))
  const fee2 = feeAmount.times(BigInt.fromI32(input.secondStaticNumber))
  const feeTokenAmount1 = new TokenAmount(feeToken, fee1)
  const feeTokenAmount2 = new TokenAmount(feeToken, fee2)

  // Replace this with your task code
  environment.call([new CallData(target, data, BigInt.zero())], feeTokenAmount1, settler)
  environment.call([new CallData(target, data, BigInt.zero())], feeTokenAmount2, settler)
}
