import {
  Address,
  BigInt,
  ChainId,
  SPLToken,
  SvmCallBuilder,
  SvmInstructionBuilder,
  SwapBuilder,
  TokenAmount,
  TransferBuilder,
} from '@mimicprotocol/lib-ts'
import { SvmAccountMeta } from '@mimicprotocol/lib-ts/src/types/svm/SvmAccountMeta'

export default function main(): void {
  const splToken = new SPLToken(Address.fromString('So11111111111111111111111111111111111111112'), 9, 'WSOL')
  // eslint-disable-next-line no-secrets/no-secrets
  const tokenProgram = Address.fromString('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
  // eslint-disable-next-line no-secrets/no-secrets
  const solanaUser = Address.fromString('HV1KXxWFaSeriyFvXyx48FqG9BoFbfinB8njCJonqP7K')

  // Transfer

  TransferBuilder.forChain(ChainId.SOLANA_MAINNET)
    .addTransferFromI32(splToken, 4000, solanaUser)
    .addUser(solanaUser)
    .addMaxFee(new TokenAmount(splToken, BigInt.fromI32(1)))
    .build()
    .send()

  // Swap

  SwapBuilder.forChain(ChainId.SOLANA_MAINNET)
    .addTokenInFromStringDecimal(splToken, '1000')
    .addTokenOutFromTokenAmount(new TokenAmount(splToken, BigInt.fromI32(2000)), solanaUser)
    .addUser(solanaUser)
    .build()
    .send()

  // Call

  const ix = new SvmInstructionBuilder()
    .setProgram(tokenProgram)
    .setAccounts([
      SvmAccountMeta.fromAddress(solanaUser).signer(),
      SvmAccountMeta.fromAddress(splToken.address).writable(),
    ])
    .setDataFromHex('0xabcd')
    .instruction()

  SvmCallBuilder.forChain()
    .addInstruction(ix)
    .addUser(solanaUser)
    .addMaxFee(new TokenAmount(splToken, BigInt.fromI32(1)))
    .build()
    .send()
}
