import { environment } from '../environment'
import { Token, TokenAmount } from '../tokens'
import { Address, BigInt, ChainId } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

/**
 * Builder for creating Transfer intents with token transfer operations.
 * Supports multiple transfers within a single transaction on the same chain.
 */
export class TransferBuilder extends IntentBuilder {
  private chainId: ChainId
  private transfers: TransferData[] = []
  private fee: TokenAmount | null = null

  /**
   * Creates a TransferBuilder for a specific chain.
   * @param chainId - The blockchain network identifier
   * @returns A new TransferBuilder instance
   */
  static forChain(chainId: ChainId): TransferBuilder {
    return new TransferBuilder(chainId)
  }

  /**
   * Creates a TransferBuilder for a specific chain with a pre-configured fee.
   * @param chainId - The blockchain network identifier
   * @param fee - The fee token amount for the transfer
   * @returns A new TransferBuilder instance with fee set
   */
  static forChainWithFee(chainId: ChainId, fee: TokenAmount): TransferBuilder {
    const builder = new TransferBuilder(chainId)
    builder.addFee(fee)
    return builder
  }

  /**
   * Creates a new TransferBuilder instance.
   * @param chainId - The blockchain network identifier
   */
  constructor(chainId: ChainId) {
    super()
    this.chainId = chainId
  }

  /**
   * Adds a transfer to the intent.
   * @param transfer - The transfer data configuration
   * @returns This TransferBuilder instance for method chaining
   */
  addTransfer(transfer: TransferData): TransferBuilder {
    this.transfers.push(transfer)
    return this
  }

  /**
   * Adds multiple transfers to the intent.
   * @param transfers - Array of transfer data configurations
   * @returns This TransferBuilder instance for method chaining
   */
  addTransfers(transfers: TransferData[]): TransferBuilder {
    for (let i = 0; i < transfers.length; i++) this.transfers.push(transfers[i])
    return this
  }

  /**
   * Adds a transfer from a TokenAmount.
   * @param tokenAmount - The token amount to transfer (must be on same chain)
   * @param recipient - The address to receive the tokens
   * @returns This TransferBuilder instance for method chaining
   */
  addTransferFromTokenAmount(tokenAmount: TokenAmount, recipient: Address): TransferBuilder {
    if (tokenAmount.token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromTokenAmount(tokenAmount, recipient))
  }

  /**
   * Adds a transfer from a 32-bit integer amount.
   * @param token - The token to transfer (must be on same chain)
   * @param amount - The amount as a whole number
   * @param recipient - The address to receive the tokens
   * @returns This TransferBuilder instance for method chaining
   */
  addTransferFromI32(token: Token, amount: i32, recipient: Address): TransferBuilder {
    if (token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromI32(token, amount, recipient))
  }

  /**
   * Adds a transfer from a BigInt amount.
   * @param token - The token to transfer (must be on same chain)
   * @param amount - The amount in the token's smallest unit
   * @param recipient - The address to receive the tokens
   * @returns This TransferBuilder instance for method chaining
   */
  addTransferFromBigInt(token: Token, amount: BigInt, recipient: Address): TransferBuilder {
    if (token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromBigInt(token, amount, recipient))
  }

  /**
   * Adds a transfer from a decimal string amount.
   * @param token - The token to transfer (must be on same chain)
   * @param amount - The amount as a decimal string
   * @param recipient - The address to receive the tokens
   * @returns This TransferBuilder instance for method chaining
   */
  addTransferFromStringDecimal(token: Token, amount: string, recipient: Address): TransferBuilder {
    if (token.chainId !== this.chainId) throw new Error('Transfer tokens must be on the same chain')
    return this.addTransfer(TransferData.fromStringDecimal(token, amount, recipient))
  }

  /**
   * Adds multiple transfers from TokenAmounts to the same recipient.
   * @param tokenAmounts - Array of token amounts to transfer (must be on same chain)
   * @param recipient - The address to receive all the tokens
   * @returns This TransferBuilder instance for method chaining
   */
  addTransfersFromTokenAmounts(tokenAmounts: TokenAmount[], recipient: Address): TransferBuilder {
    for (let i = 0; i < tokenAmounts.length; i++) this.addTransferFromTokenAmount(tokenAmounts[i], recipient)
    return this
  }

  /**
   * Sets the fee for this transfer intent.
   * @param fee - The fee token amount (must be on same chain)
   * @returns This TransferBuilder instance for method chaining
   */
  addFee(fee: TokenAmount): TransferBuilder {
    if (fee.token.chainId !== this.chainId) throw new Error('Fee token must be on the same chain')
    this.fee = fee
    return this
  }

  /**
   * Sets the settler address for this intent.
   * @param settler - The settler address as an Address instance
   * @returns This TransferBuilder instance for method chaining
   */
  addSettler(settler: Address): TransferBuilder {
    return changetype<TransferBuilder>(super.addSettler(settler))
  }

  /**
   * Sets the settler address from a string.
   * @param settler - The settler address as a hex string
   * @returns This TransferBuilder instance for method chaining
   */
  addSettlerAsString(settler: string): TransferBuilder {
    return changetype<TransferBuilder>(super.addSettlerAsString(settler))
  }

  /**
   * Sets the deadline for this intent.
   * @param deadline - The deadline as a timestamp
   * @returns This TransferBuilder instance for method chaining
   */
  addDeadline(deadline: BigInt): TransferBuilder {
    return changetype<TransferBuilder>(super.addDeadline(deadline))
  }

  /**
   * Sets the user address for this intent.
   * @param user - The user address
   * @returns This TransferBuilder instance for method chaining
   */
  addUser(user: Address): TransferBuilder {
    return changetype<TransferBuilder>(super.addUser(user))
  }

  /**
   * Sets the user address from a string.
   * @param user - The user address as a hex string
   * @returns This TransferBuilder instance for method chaining
   */
  addUserAsString(user: string): TransferBuilder {
    return changetype<TransferBuilder>(super.addUserAsString(user))
  }

  /**
   * Sets the nonce for this intent.
   * @param nonce - A unique identifier to prevent replay attacks
   * @returns This TransferBuilder instance for method chaining
   */
  addNonce(nonce: string): TransferBuilder {
    return changetype<TransferBuilder>(super.addNonce(nonce))
  }

  /**
   * Builds and returns the final Transfer intent.
   * @returns A new Transfer instance with all configured parameters
   */
  build(): Transfer {
    if (!this.fee) throw new Error('Transfer fee must be specified')
    return new Transfer(
      this.chainId,
      this.transfers,
      this.fee as TokenAmount,
      this.settler,
      this.user,
      this.deadline,
      this.nonce
    )
  }
}

/**
 * Represents transfer data for a single token transfer operation.
 * Specifies the token, amount, and recipient for the transfer.
 */
@json
export class TransferData {
  public token: string
  public amount: string
  public recipient: string

  /**
   * Creates TransferData from a TokenAmount.
   * @param tokenAmount - The token amount to transfer
   * @param recipient - The address to receive the tokens
   * @returns A new TransferData instance
   */
  static fromTokenAmount(tokenAmount: TokenAmount, recipient: Address): TransferData {
    return new TransferData(tokenAmount.token.address, tokenAmount.amount, recipient)
  }

  /**
   * Creates TransferData from a 32-bit integer amount.
   * @param token - The token to transfer
   * @param amount - The amount as a whole number
   * @param recipient - The address to receive the tokens
   * @returns A new TransferData instance
   */
  static fromI32(token: Token, amount: i32, recipient: Address): TransferData {
    return this.fromTokenAmount(TokenAmount.fromI32(token, amount), recipient)
  }

  /**
   * Creates TransferData from a BigInt amount.
   * @param token - The token to transfer
   * @param amount - The amount in the token's smallest unit
   * @param recipient - The address to receive the tokens
   * @returns A new TransferData instance
   */
  static fromBigInt(token: Token, amount: BigInt, recipient: Address): TransferData {
    return this.fromTokenAmount(TokenAmount.fromBigInt(token, amount), recipient)
  }

  /**
   * Creates TransferData from a decimal string amount.
   * @param token - The token to transfer
   * @param amount - The amount as a decimal string
   * @param recipient - The address to receive the tokens
   * @returns A new TransferData instance
   */
  static fromStringDecimal(token: Token, amount: string, recipient: Address): TransferData {
    return this.fromTokenAmount(TokenAmount.fromStringDecimal(token, amount), recipient)
  }

  /**
   * Creates a new TransferData instance.
   * @param token - The token address
   * @param amount - The amount in the token's smallest unit
   * @param recipient - The address to receive the tokens
   */
  constructor(token: Address, amount: BigInt, recipient: Address) {
    this.token = token.toString()
    this.amount = amount.toString()
    this.recipient = recipient.toString()
  }
}

/**
 * Represents a Transfer intent for sending tokens to recipients on a blockchain network.
 */
@json
export class Transfer extends Intent {
  public chainId: ChainId
  public transfers: TransferData[]
  public feeToken: string
  public feeAmount: string

  /**
   * Creates a simple single-token transfer intent.
   * @param chainId - The blockchain network identifier
   * @param token - The token address to transfer
   * @param amount - The amount to transfer
   * @param recipient - The address to receive the tokens
   * @param fee - The fee amount for the transfer
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   * @returns A new Transfer instance
   */
  static create(
    chainId: ChainId,
    token: Address,
    amount: BigInt,
    recipient: Address,
    fee: BigInt,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ): Transfer {
    const transferToken = Token.fromAddress(token, chainId)
    const transferAmount = TokenAmount.fromBigInt(transferToken, amount)
    const transferData = TransferData.fromTokenAmount(transferAmount, recipient)
    const feeAmount = TokenAmount.fromBigInt(transferToken, fee)
    return new Transfer(chainId, [transferData], feeAmount, settler, user, deadline, nonce)
  }

  /**
   * Creates a new Transfer intent.
   * @param chainId - The blockchain network identifier
   * @param transfers - Array of transfer data configurations
   * @param fee - The fee token amount for the transfers
   * @param settler - The settler address (optional)
   * @param user - The user address (optional)
   * @param deadline - The deadline timestamp (optional)
   * @param nonce - The nonce for replay protection (optional)
   */
  constructor(
    chainId: ChainId,
    transfers: TransferData[],
    fee: TokenAmount,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ) {
    let settlerAddress = settler
    if (!settlerAddress) {
      const _settler = environment.getContext().findSettler(chainId)
      if (!_settler) throw new Error(`Settler not found for chainId: ${chainId}`)
      settlerAddress = _settler.address
    }
    super(OperationType.Transfer, settlerAddress, user, deadline, nonce)

    if (transfers.length === 0) throw new Error('Transfer list cannot be empty')

    this.transfers = transfers
    this.feeToken = fee.token.address.toString()
    this.feeAmount = fee.amount.toString()
    this.chainId = chainId
  }

  /**
   * Sends this Transfer intent to the execution environment.
   */
  send(): void {
    environment.transfer(this)
  }
}
