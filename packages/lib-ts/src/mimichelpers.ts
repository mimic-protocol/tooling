import { environment } from './environment'
import { evm } from './evm'
import { Address, BigInt, ChainId, EvmDecodeParam, EvmEncodeParam, Result } from './types'

// todo replace with correct address once it is deployed
const MIMIC_HELPER_ADDRESS = Address.fromHexString('0x')

export namespace mimicHelpers {
  export function getNativeTokenBalance(chainId: ChainId, target: Address): Result<BigInt, string> {
    if (chainId === ChainId.SOLANA_MAINNET) return Result.err<BigInt, string>('Solana not supported')
    const data = '0xeffd663c' + evm.encode([EvmEncodeParam.fromValue('address', target)])
    const response = environment.evmCallQuery(MIMIC_HELPER_ADDRESS, chainId, data)
    if (response.isError) return Result.err<BigInt, string>(response.error)
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response.unwrap()))
    const decoded = BigInt.fromString(decodedResponse)
    return Result.ok<BigInt, string>(decoded)
  }
}
