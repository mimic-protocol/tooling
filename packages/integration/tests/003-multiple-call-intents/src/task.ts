import { Address, BigInt, Bytes, CallData, environment, NULL_ADDRESS } from '@mimicprotocol/lib-ts'
import { inputs } from "./types";

export default function main(): void {
  const settler = Address.fromString(NULL_ADDRESS)
  const target = Address.fromString(NULL_ADDRESS)
  const data = Bytes.empty()
  const feeToken = Address.fromString(NULL_ADDRESS)
  const feeAmount = BigInt.fromI32(2)
  environment.call([new CallData(target, data)], feeToken, feeAmount, inputs.chainId, settler)
  environment.call([new CallData(target, data)], feeToken, feeAmount.minus(BigInt.fromI32(1)), inputs.chainId, settler)
  environment.call([new CallData(target, data)], feeToken, feeAmount.minus(BigInt.fromI32(2)), inputs.chainId, settler)
}
