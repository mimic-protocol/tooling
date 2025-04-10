import { Address, Token, TokenAmount, USD } from '@mimicprotocol/lib-ts'

declare function _enableLogging(value: boolean): void
declare function _setTokenPrice(address: string, chainId: u64, price: string): void
declare function _setRelevantTokens(address: string, tokens: string): void
declare function _resetState(): void

export function enableLogging(value: boolean): void {
  _enableLogging(value)
}

export function setTokenPrice(token: Token, price: USD): void {
  _setTokenPrice(token.address.serialize(), token.chainId, price.value.toString())
}

export function setRelevantTokens(address: Address, tokens: TokenAmount[]): void {
  let tokenAmounts = ''
  for (let i = 0; i < tokens.length; i++) {
    tokenAmounts += tokens[i].serialize() + '\n'
  }
  _setRelevantTokens(address.serialize(), tokenAmounts)
}

export function resetState(): void {
  _resetState()
}
