import { Arbitrum, Avalanche, Base, BaseSepolia, BNB, Ethereum, Gnosis, Optimism, Polygon, Sonic } from '../chains'

import { TokenProvider } from './TokenProvider'

/**
 * Token providers that can resolve to chain-specific BlockchainToken instances.
 * Use the `.on(chainId)` method to get the token for a specific chain.
 *
 * @example
 * ```typescript
 * import { Tokens, Ethereum } from '@mimicprotocol/lib-ts'
 *
 * const usdc = Tokens.USDC.on(inputs.chainId)
 * const weth = Tokens.WETH.on(Ethereum.CHAIN_ID)
 * ```
 */
export class Tokens {
  private static _instance: Tokens | null = null

  private readonly usdc: TokenProvider = new TokenProvider('USDC')
  private readonly usdt: TokenProvider = new TokenProvider('USDT')
  private readonly dai: TokenProvider = new TokenProvider('DAI')
  private readonly wbtc: TokenProvider = new TokenProvider('WBTC')
  private readonly weth: TokenProvider = new TokenProvider('WETH')
  private readonly eth: TokenProvider = new TokenProvider('ETH')
  private readonly avax: TokenProvider = new TokenProvider('AVAX')
  private readonly wavax: TokenProvider = new TokenProvider('WAVAX')
  private readonly pol: TokenProvider = new TokenProvider('POL')
  private readonly wpol: TokenProvider = new TokenProvider('WPOL')
  private readonly bnb: TokenProvider = new TokenProvider('BNB')
  private readonly wbnb: TokenProvider = new TokenProvider('WBNB')
  private readonly xdai: TokenProvider = new TokenProvider('xDAI')
  private readonly sonic: TokenProvider = new TokenProvider('SONIC')
  private readonly wxdai: TokenProvider = new TokenProvider('WXDAI')
  private readonly wsonic: TokenProvider = new TokenProvider('WSONIC')

  private constructor() {
    // Ethereum
    this.usdc.register(Ethereum.CHAIN_ID, Ethereum.USDC)
    this.usdt.register(Ethereum.CHAIN_ID, Ethereum.USDT)
    this.dai.register(Ethereum.CHAIN_ID, Ethereum.DAI)
    this.wbtc.register(Ethereum.CHAIN_ID, Ethereum.WBTC)
    this.weth.register(Ethereum.CHAIN_ID, Ethereum.WETH)
    this.eth.register(Ethereum.CHAIN_ID, Ethereum.ETH)

    // Arbitrum
    this.usdc.register(Arbitrum.CHAIN_ID, Arbitrum.USDC)
    this.usdt.register(Arbitrum.CHAIN_ID, Arbitrum.USDT)
    this.dai.register(Arbitrum.CHAIN_ID, Arbitrum.DAI)
    this.wbtc.register(Arbitrum.CHAIN_ID, Arbitrum.WBTC)
    this.weth.register(Arbitrum.CHAIN_ID, Arbitrum.WETH)
    this.eth.register(Arbitrum.CHAIN_ID, Arbitrum.ETH)

    // Avalanche
    this.usdc.register(Avalanche.CHAIN_ID, Avalanche.USDC)
    this.usdt.register(Avalanche.CHAIN_ID, Avalanche.USDT)
    this.dai.register(Avalanche.CHAIN_ID, Avalanche.DAI)
    this.wbtc.register(Avalanche.CHAIN_ID, Avalanche.WBTC)
    this.weth.register(Avalanche.CHAIN_ID, Avalanche.WETH)
    this.avax.register(Avalanche.CHAIN_ID, Avalanche.AVAX)
    this.wavax.register(Avalanche.CHAIN_ID, Avalanche.WAVAX)

    // Base
    this.usdc.register(Base.CHAIN_ID, Base.USDC)
    this.usdt.register(Base.CHAIN_ID, Base.USDT)
    this.dai.register(Base.CHAIN_ID, Base.DAI)
    this.wbtc.register(Base.CHAIN_ID, Base.WBTC)
    this.weth.register(Base.CHAIN_ID, Base.WETH)
    this.eth.register(Base.CHAIN_ID, Base.ETH)

    // BNB
    this.usdc.register(BNB.CHAIN_ID, BNB.USDC)
    this.usdt.register(BNB.CHAIN_ID, BNB.USDT)
    this.dai.register(BNB.CHAIN_ID, BNB.DAI)
    this.wbtc.register(BNB.CHAIN_ID, BNB.WBTC)
    this.weth.register(BNB.CHAIN_ID, BNB.WETH)
    this.bnb.register(BNB.CHAIN_ID, BNB.BNB)
    this.wbnb.register(BNB.CHAIN_ID, BNB.WBNB)

    // Optimism
    this.usdc.register(Optimism.CHAIN_ID, Optimism.USDC)
    this.usdt.register(Optimism.CHAIN_ID, Optimism.USDT)
    this.dai.register(Optimism.CHAIN_ID, Optimism.DAI)
    this.wbtc.register(Optimism.CHAIN_ID, Optimism.WBTC)
    this.weth.register(Optimism.CHAIN_ID, Optimism.WETH)
    this.eth.register(Optimism.CHAIN_ID, Optimism.ETH)

    // Gnosis
    this.usdc.register(Gnosis.CHAIN_ID, Gnosis.USDC)
    this.usdt.register(Gnosis.CHAIN_ID, Gnosis.USDT)
    this.wbtc.register(Gnosis.CHAIN_ID, Gnosis.WBTC)
    this.weth.register(Gnosis.CHAIN_ID, Gnosis.WETH)
    this.xdai.register(Gnosis.CHAIN_ID, Gnosis.xDAI)
    this.wxdai.register(Gnosis.CHAIN_ID, Gnosis.WXDAI)

    // Polygon
    this.usdc.register(Polygon.CHAIN_ID, Polygon.USDC)
    this.usdt.register(Polygon.CHAIN_ID, Polygon.USDT)
    this.dai.register(Polygon.CHAIN_ID, Polygon.DAI)
    this.wbtc.register(Polygon.CHAIN_ID, Polygon.WBTC)
    this.weth.register(Polygon.CHAIN_ID, Polygon.WETH)
    this.pol.register(Polygon.CHAIN_ID, Polygon.POL)
    this.wpol.register(Polygon.CHAIN_ID, Polygon.WPOL)

    // Sonic
    this.usdc.register(Sonic.CHAIN_ID, Sonic.USDC)
    this.usdt.register(Sonic.CHAIN_ID, Sonic.USDT)
    this.weth.register(Sonic.CHAIN_ID, Sonic.WETH)
    this.sonic.register(Sonic.CHAIN_ID, Sonic.SONIC)
    this.wsonic.register(Sonic.CHAIN_ID, Sonic.WSONIC)

    // BaseSepolia
    this.eth.register(BaseSepolia.CHAIN_ID, BaseSepolia.ETH)
  }

  private static getInstance(): Tokens {
    if (Tokens._instance === null) {
      Tokens._instance = new Tokens()
    }
    return Tokens._instance!
  }

  static get USDC(): TokenProvider {
    return Tokens.getInstance().usdc
  }

  static get USDT(): TokenProvider {
    return Tokens.getInstance().usdt
  }

  static get DAI(): TokenProvider {
    return Tokens.getInstance().dai
  }

  static get WBTC(): TokenProvider {
    return Tokens.getInstance().wbtc
  }

  static get WETH(): TokenProvider {
    return Tokens.getInstance().weth
  }

  static get ETH(): TokenProvider {
    return Tokens.getInstance().eth
  }

  static get AVAX(): TokenProvider {
    return Tokens.getInstance().avax
  }

  static get WAVAX(): TokenProvider {
    return Tokens.getInstance().wavax
  }

  static get POL(): TokenProvider {
    return Tokens.getInstance().pol
  }

  static get WPOL(): TokenProvider {
    return Tokens.getInstance().wpol
  }

  static get BNB(): TokenProvider {
    return Tokens.getInstance().bnb
  }

  static get WBNB(): TokenProvider {
    return Tokens.getInstance().wbnb
  }

  static get XDAI(): TokenProvider {
    return Tokens.getInstance().xdai
  }

  static get SONIC(): TokenProvider {
    return Tokens.getInstance().sonic
  }

  static get WXDAI(): TokenProvider {
    return Tokens.getInstance().wxdai
  }

  static get WSONIC(): TokenProvider {
    return Tokens.getInstance().wsonic
  }
}
