import { Address, Bytes, join, serialize, serializeArray, Token, TokenAmount, USD } from '@mimicprotocol/lib-ts'

declare function _enableLogging(value: boolean): void
declare function _setTokenPrice(address: string, chainId: u64, price: string): void
declare function _setRelevantTokens(address: string, tokens: string): void
declare function _setContractCall(params: string, value: string): void
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

export function setContractCall(
  address: Address,
  chainId: u64,
  fnName: string,
  fnArgs: Bytes[],
  responseValue: string
): void {
  const params = join([serialize(address), serialize(chainId), null, serialize(fnName), serializeArray(fnArgs)])
  _setContractCall(params, responseValue)
}

export function resetState(): void {
  _resetState()
}
