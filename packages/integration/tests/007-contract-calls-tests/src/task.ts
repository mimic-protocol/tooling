import { Address, BigInt, Bytes, Token } from '@mimicprotocol/lib-ts'

import { ERC20 } from './types/ERC20'
import { ERC4626 } from './types/ERC4626'
import { SAFE } from './types/SAFE'

const MAINNET_CHAIN_ID = 1
const POLYGON_CHAIN_ID = 137

export default function main(): void {
  const USDC = new Token('USDC', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', MAINNET_CHAIN_ID, 6)
  const usdcContract = new ERC20(USDC.address, USDC.chainId)
  usdcContract.name()
  usdcContract.totalSupply()
  usdcContract.decimals()
  usdcContract.balanceOf(Address.zero())
  usdcContract.symbol()
  usdcContract.allowance(Address.zero(), Address.zero())

  const customTimestamp = Date.fromString('2025-04-04T16:35:57-03:00')
  const erc4626Contract = new ERC4626(Address.zero(), POLYGON_CHAIN_ID, customTimestamp)
  erc4626Contract.convertToAssets(BigInt.fromI32(1234))

  const safeContract = new SAFE(Address.zero(), MAINNET_CHAIN_ID)
  safeContract.encodeTransactionData(
    Address.zero(),
    BigInt.fromI32(1),
    Bytes.fromHexString('0x1234'),
    0,
    BigInt.fromI32(2),
    BigInt.fromI32(3),
    BigInt.fromI32(4),
    USDC.address,
    Address.zero(),
    BigInt.fromI32(5)
  )
}
