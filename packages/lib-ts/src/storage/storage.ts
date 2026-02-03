import { environment } from '../environment'
import { evm } from '../evm'
import { MIMIC_HELPER_ADDRESS } from '../helpers'
import { EvmCall, EvmCallBuilder } from '../intents'
import { TokenAmount } from '../tokens'
import { Address, Bytes, ChainId, EvmDecodeParam, EvmEncodeParam, Result } from '../types'

const ADDRESS = Address.fromHexString(MIMIC_HELPER_ADDRESS)
const DEFAULT_CHAIN_ID = ChainId.OPTIMISM

export namespace storage {
  export function createSetDataCall(
    smartAccount: Address,
    maxFee: TokenAmount,
    key: string,
    data: Bytes,
    chainId: ChainId = DEFAULT_CHAIN_ID
  ): EvmCall {
    const encodedData = Bytes.fromHexString(
      '0x1c1bbd37' +
        evm.encode([EvmEncodeParam.fromValue('string', Bytes.fromUTF8(key)), EvmEncodeParam.fromValue('bytes', data)])
    )
    return EvmCallBuilder.forChain(chainId)
      .addUser(smartAccount)
      .addMaxFee(maxFee)
      .addCall(ADDRESS, encodedData)
      .build()
  }

  export function getData(
    smartAccount: Address,
    key: string,
    chainId: ChainId = DEFAULT_CHAIN_ID
  ): Result<Bytes, string> {
    const encodedData =
      '0x53f71fd3' +
      evm.encode([
        EvmEncodeParam.fromValue('address', smartAccount),
        EvmEncodeParam.fromValue('string', Bytes.fromUTF8(key)),
      ])
    const response = environment.evmCallQuery(ADDRESS, chainId, encodedData)
    if (response.isError) return Result.err<Bytes, string>(response.error)
    const decoded = Bytes.fromHexString(evm.decode(new EvmDecodeParam('bytes', response.unwrap())))
    return Result.ok<Bytes, string>(decoded)
  }
}
