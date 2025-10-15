import { Address, Bytes, CallBuilder, DenominationToken, environment, evm, TokenAmount } from '@mimicprotocol/lib-ts'

export default function main(): void {
  CallBuilder.forEvmChain(1)
    .addMaxFee(TokenAmount.fromStringDecimal(DenominationToken.USD(), '1'))
    .addCall(Address.fromString('0x0000000000000000000000000000000000000001'), Bytes.empty())
    .addUser(environment.getContext().user)
    .addEvent(Bytes.fromHexString(evm.keccak('event1')), Bytes.fromUTF8('data'))
    .addEvent(Bytes.fromHexString(evm.keccak('event2')), Bytes.fromUTF8('data'))
    .build()
    .send()
}
