import { Address, BigInt, environment, TokenAmount, USD } from '@mimicprotocol/lib-ts'

import { ETH, USDC } from './tokens'

/**
 * Portfolio Analysis & Rebalancing Strategy
 *
 * This task demonstrates a practical real-world example:
 * 1. Analyzing a user's portfolio across multiple chains
 * 2. Calculating portfolio allocations
 * 3. Determining token conversions needed
 */
export default function main(): void {
  // Define the wallet address to analyze (using zero address as example)
  const userWallet = Address.zero()

  // Define chains to include in portfolio analysis
  const chains: u64[] = [1, 137] // Ethereum and Polygon

  console.log(`Analyzing portfolio for wallet ${userWallet.toHexString()}...`)

  // Step 1: Retrieve all user's tokens across chains with a minimum value
  const minTokenValue = USD.fromStringDecimal('100') // Only tokens worth >$100
  const relevantTokens = environment.getRelevantTokens(userWallet, chains, minTokenValue)

  if (relevantTokens.length === 0) {
    console.log('No significant token holdings found.')
    return
  }

  console.log(`Found ${relevantTokens.length} token holdings across ${chains.length} chains.`)

  // Step 2: Calculate total portfolio value in USD
  let portfolioValue = USD.zero()

  // First pass: calculate total value
  for (let i = 0; i < relevantTokens.length; i++) {
    const tokenUsdValue = relevantTokens[i].toUsd()
    portfolioValue = portfolioValue.plus(tokenUsdValue)
  }

  console.log(`Total portfolio value: $${portfolioValue.toString()} USD`)

  // Step 3: Calculate and display current allocation
  console.log('\nCurrent Portfolio Allocation:')
  for (let i = 0; i < relevantTokens.length; i++) {
    const tokenAmount = relevantTokens[i]
    const tokenValue = tokenAmount.toUsd()
    const tokenValueStr = tokenValue.toString()
    // We can't do percentage calculation with BigInt directly in AssemblyScript
    // so we'll just show the raw value
    console.log(`${tokenAmount.token.symbol} (Chain: ${tokenAmount.token.chainId}): $${tokenValueStr}`)
  }

  // Step 4: Show some practical conversions between tokens
  console.log('\nExample Token Conversions:')

  // Only proceed if we have at least one token
  if (relevantTokens.length > 0) {
    const exampleToken = relevantTokens[0]
    const exampleAmount = exampleToken.toUsd() // Get USD value

    // Show conversion to ETH
    const ethEquivalent = exampleAmount.toTokenAmount(ETH)
    console.log(`${exampleToken.toString()} = ${ethEquivalent.toString()}`)

    // Show conversion to USDC
    const usdcEquivalent = exampleAmount.toTokenAmount(USDC)
    console.log(`${exampleToken.toString()} = ${usdcEquivalent.toString()}`)
  }

  // Step 5: Demonstrate a swap (for example purposes)
  console.log('\nExample Swap Operation:')

  // Convert 1000 USDC to ETH
  const usdcToSwap = TokenAmount.fromStringDecimal(USDC, '1000')
  const ethReceived = usdcToSwap.toTokenAmount(ETH)

  console.log(`Converting ${usdcToSwap.toString()} to approximately ${ethReceived.toString()}`)

  // Example of how to execute this swap

  environment.swap(
    userWallet,
    USDC.chainId,
    USDC.address,
    usdcToSwap.amount,
    ETH.address,
    ethReceived.amount.div(BigInt.fromI32(100)).times(BigInt.fromI32(95)) // 5% slippage protection
  )

  console.log('\nPortfolio analysis complete.')
}
