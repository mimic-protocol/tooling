import { Address, BigInt, ChainId, SPLToken, SwapBuilder, TokenAmount, TransferBuilder } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const splToken = new SPLToken(Address.fromString('So11111111111111111111111111111111111111112'), 9, 'WSOL')
  // eslint-disable-next-line no-secrets/no-secrets
  const solanaUser = Address.fromString('HV1KXxWFaSeriyFvXyx48FqG9BoFbfinB8njCJonqP7K')

  TransferBuilder.forChain(ChainId.SOLANA_MAINNET)
    .addTransferFromI32(splToken, 4000, solanaUser)
    .addUser(solanaUser)
    .addMaxFee(new TokenAmount(splToken, BigInt.fromI32(1)))
    .build()
    .send()

  SwapBuilder.forChain(ChainId.SOLANA_MAINNET)
    .addTokenInFromStringDecimal(splToken, '1000')
    .addTokenOutFromTokenAmount(new TokenAmount(splToken, BigInt.fromI32(2000)), solanaUser)
    .addUser(solanaUser)
    .build()
    .send()
}
