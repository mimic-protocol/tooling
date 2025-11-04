import { JSON } from 'json-as'

import { OperationType, Swap, SwapBuilder, SwapTokenIn, SwapTokenOut } from '../../src/intents'
import { ERC20Token, SPLToken, TokenAmount } from '../../src/tokens'
import { Address, BigInt, ChainId } from '../../src/types'
import {
  randomERC20Token,
  randomEvmAddress,
  randomSettler,
  randomSPLToken,
  randomSvmAddress,
  setContext,
} from '../helpers'

describe('Swap', () => {
  it('creates a simple Swap with default values', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const tokenIn = ERC20Token.fromAddress(randomEvmAddress(), chainId)
    const amountIn = BigInt.fromI32(10)
    const tokenOut = ERC20Token.fromAddress(randomEvmAddress(), chainId)
    const minAmountOut = BigInt.fromI32(100)
    const settler = randomSettler(chainId)

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = Swap.create(chainId, tokenIn, amountIn, tokenOut, minAmountOut)
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe('300')
    expect(swap.nonce).toBe('0x')
    expect(swap.maxFees.length).toBe(0)

    expect(swap.sourceChain).toBe(chainId)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.address.toString())
    expect(swap.tokensIn[0].amount).toBe(amountIn.toString())

    expect(swap.destinationChain).toBe(chainId)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.address.toString())
    expect(swap.tokensOut[0].minAmount).toBe(minAmountOut.toString())
    expect(swap.tokensOut[0].recipient).toBe(user.toString())

    expect(swap.events.length).toBe(0)

    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","maxFees":[],"events":[],"sourceChain":${chainId},"tokensIn":[{"token":"${tokenIn.address.toString()}","amount":"${amountIn}"}],"tokensOut":[{"token":"${tokenOut.address.toString()}","minAmount":"${minAmountOut}","recipient":"${user}"}],"destinationChain":${chainId}}`
    )
  })

  it('creates a simple Swap with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomEvmAddress()
    const settler = randomSettler(chainId)
    const deadline = BigInt.fromI32(999999)
    const tokenIn = ERC20Token.fromAddress(randomEvmAddress(), chainId)
    const amountIn = BigInt.fromI32(10)
    const tokenOut = ERC20Token.fromAddress(randomEvmAddress(), chainId)
    const minAmountOut = BigInt.fromI32(100)

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = Swap.create(
      chainId,
      tokenIn,
      amountIn,
      tokenOut,
      minAmountOut,
      Address.fromString(settler.address),
      user,
      deadline,
      null,
      []
    )
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe(deadline.toString())
    expect(swap.nonce).toBe('0x')
    expect(swap.maxFees.length).toBe(0)

    expect(swap.sourceChain).toBe(chainId)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.address.toString())
    expect(swap.tokensIn[0].amount).toBe(amountIn.toString())

    expect(swap.destinationChain).toBe(chainId)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.address.toString())
    expect(swap.tokensOut[0].minAmount).toBe(minAmountOut.toString())
    expect(swap.tokensOut[0].recipient).toBe(user.toString())

    expect(swap.events.length).toBe(0)

    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[],"events":[],"sourceChain":${chainId},"tokensIn":[{"token":"${tokenIn.address.toString()}","amount":"${amountIn}"}],"tokensOut":[{"token":"${tokenOut.address.toString()}","minAmount":"${minAmountOut}","recipient":"${user}"}],"destinationChain":${chainId}}`
    )
  })

  it('creates a complex Swap with valid parameters and stringifies it', () => {
    const sourceChain = 1
    const destinationChain = 10
    const user = randomEvmAddress()
    const settler = randomSettler(sourceChain)
    const deadline = BigInt.fromI32(999999)
    const tokenIn = SwapTokenIn.fromI32(randomERC20Token(sourceChain), 10)
    const tokenOut = SwapTokenOut.fromI32(randomERC20Token(destinationChain), 100, randomEvmAddress())

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = new Swap(
      sourceChain,
      [tokenIn],
      [tokenOut],
      destinationChain,
      Address.fromString(settler.address),
      user,
      deadline
    )
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe(deadline.toString())
    expect(swap.nonce).toBe('0x')
    expect(swap.maxFees.length).toBe(0)

    expect(swap.sourceChain).toBe(sourceChain)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.token)
    expect(swap.tokensIn[0].amount).toBe(tokenIn.amount)

    expect(swap.destinationChain).toBe(destinationChain)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.token)
    expect(swap.tokensOut[0].minAmount).toBe(tokenOut.minAmount)
    expect(swap.tokensOut[0].recipient).toBe(tokenOut.recipient)

    expect(swap.events.length).toBe(0)

    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[],"events":[],"sourceChain":${sourceChain},"tokensIn":[{"token":"${tokenIn.token}","amount":"${tokenIn.amount}"}],"tokensOut":[{"token":"${tokenOut.token}","minAmount":"${tokenOut.minAmount}","recipient":"${tokenOut.recipient}"}],"destinationChain":${destinationChain}}`
    )
  })

  it('throws an error when SwapTokenIn list is empty', () => {
    expect(() => {
      const tokensOut = [SwapTokenOut.fromI32(randomERC20Token(), 10, randomEvmAddress())]
      new Swap(1, [], tokensOut, 10)
    }).toThrow('TokenIn list cannot be empty')
  })

  it('throws an error when SwapTokenOut list is empty', () => {
    expect(() => {
      const tokensIn = [SwapTokenIn.fromI32(randomERC20Token(), 10)]
      new Swap(1, tokensIn, [], 10)
    }).toThrow('TokenOut list cannot be empty')
  })
})

describe('SwapBuilder', () => {
  const sourceChain = 1
  const destinationChain = 10
  const tokenInAddressStr = '0x0000000000000000000000000000000000000001'
  const tokenOutAddressStr = '0x0000000000000000000000000000000000000002'
  const recipientAddressStr = '0x0000000000000000000000000000000000000003'

  it('builds a Swap with token amounts', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = ERC20Token.fromAddress(tokenInAddress, sourceChain, 0)
    const tokenOut = ERC20Token.fromAddress(tokenOutAddress, destinationChain, 0)

    const tokenInAmount = TokenAmount.fromI32(tokenIn, 1000)
    const tokenOutAmount = TokenAmount.fromI32(tokenOut, 950)

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokenInFromTokenAmount(tokenInAmount)
    builder.addTokenOutFromTokenAmount(tokenOutAmount, recipientAddress)

    const swap = builder.build()
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.sourceChain).toBe(sourceChain)
    expect(swap.destinationChain).toBe(destinationChain)
    expect(swap.tokensIn[0].token).toBe(tokenInAddress.toString())
    expect(swap.tokensOut[0].recipient).toBe(recipientAddress.toString())
  })

  it('adds multiple TokenIn/Out with fromStringDecimal', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = ERC20Token.fromAddress(tokenInAddress, sourceChain, 0)
    const tokenOut = ERC20Token.fromAddress(tokenOutAddress, destinationChain, 0)

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokenInFromStringDecimal(tokenIn, '1')
    builder.addTokenOutFromStringDecimal(tokenOut, '1', recipientAddress)

    const swap = builder.build()
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensIn[0].amount).toBe('1')
    expect(swap.tokensOut[0].minAmount).toBe('1')
  })

  it('throws if SwapTokenIn chainId does not match sourceChain', () => {
    expect(() => {
      const token = ERC20Token.fromString(tokenInAddressStr, 999) // wrong chain
      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenInFromStringDecimal(token, '1')
    }).toThrow('Tokens in must be on the source chain')
  })

  it('throws if SwapTokenOut chainId does not match destinationChain', () => {
    expect(() => {
      const recipient = Address.fromString(recipientAddressStr)
      const token = ERC20Token.fromString(tokenOutAddressStr, 5) // wrong chain
      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenOutFromStringDecimal(token, '1', recipient)
    }).toThrow('Tokens out must be on the destination chain')
  })

  it('adds tokensIn and tokensOut via arrays', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = ERC20Token.fromAddress(tokenInAddress, sourceChain, 0)
    const tokenOut = ERC20Token.fromAddress(tokenOutAddress, destinationChain, 0)

    const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')
    const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '2')

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokensInFromTokenAmounts([tokenInAmount])
    builder.addTokensOutFromTokenAmounts([tokenOutAmount], recipientAddress)

    const swap = builder.build()
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensOut.length).toBe(1)
  })

  it('throws if no SwapTokenIn is added before build', () => {
    expect(() => {
      const tokenOut = ERC20Token.fromString(tokenOutAddressStr, destinationChain)
      const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '1')
      const recipient = Address.fromString(recipientAddressStr)

      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenOutFromTokenAmount(tokenOutAmount, recipient)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })

  it('throws if no SwapTokenOut is added before build', () => {
    expect(() => {
      const tokenIn = ERC20Token.fromString(tokenInAddressStr, sourceChain)
      const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')

      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenInFromTokenAmount(tokenInAmount)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })
})

describe('Swap - SVM', () => {
  it('creates a simple Swap with default values', () => {
    const chainId = ChainId.SOLANA_MAINNET
    const user = randomSvmAddress()
    const tokenIn = SPLToken.fromAddress(randomSvmAddress(), chainId, 6, 'USDC')
    const amountIn = BigInt.fromI32(10)
    const tokenOut = SPLToken.fromAddress(randomSvmAddress(), chainId, 6, 'USDT')
    const minAmountOut = BigInt.fromI32(100)
    const settler = randomSettler(chainId)

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = Swap.create(chainId, tokenIn, amountIn, tokenOut, minAmountOut)
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe('300')
    expect(swap.nonce).toBe('0x')
    expect(swap.maxFees.length).toBe(0)

    expect(swap.sourceChain).toBe(chainId)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.address.toString())
    expect(swap.tokensIn[0].amount).toBe(amountIn.toString())

    expect(swap.destinationChain).toBe(chainId)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.address.toString())
    expect(swap.tokensOut[0].minAmount).toBe(minAmountOut.toString())
    expect(swap.tokensOut[0].recipient).toBe(user.toString())

    expect(swap.events.length).toBe(0)

    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","maxFees":[],"events":[],"sourceChain":${chainId},"tokensIn":[{"token":"${tokenIn.address.toString()}","amount":"${amountIn}"}],"tokensOut":[{"token":"${tokenOut.address.toString()}","minAmount":"${minAmountOut}","recipient":"${user}"}],"destinationChain":${chainId}}`
    )
  })

  it('creates a simple Swap with valid parameters and stringifies it', () => {
    const chainId = ChainId.SOLANA_MAINNET
    const user = randomSvmAddress()
    const settler = randomSettler(chainId)
    const deadline = BigInt.fromI32(999999)
    const tokenIn = SPLToken.fromAddress(randomSvmAddress(), chainId, 6, 'USDC')
    const amountIn = BigInt.fromI32(10)
    const tokenOut = SPLToken.fromAddress(randomSvmAddress(), chainId, 6, 'USDT')
    const minAmountOut = BigInt.fromI32(100)

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = Swap.create(
      chainId,
      tokenIn,
      amountIn,
      tokenOut,
      minAmountOut,
      Address.fromString(settler.address),
      user,
      deadline
    )
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe(deadline.toString())
    expect(swap.nonce).toBe('0x')
    expect(swap.maxFees.length).toBe(0)

    expect(swap.sourceChain).toBe(chainId)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.address.toString())
    expect(swap.tokensIn[0].amount).toBe(amountIn.toString())

    expect(swap.destinationChain).toBe(chainId)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.address.toString())
    expect(swap.tokensOut[0].minAmount).toBe(minAmountOut.toString())
    expect(swap.tokensOut[0].recipient).toBe(user.toString())

    expect(swap.events.length).toBe(0)

    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[],"events":[],"sourceChain":${chainId},"tokensIn":[{"token":"${tokenIn.address.toString()}","amount":"${amountIn}"}],"tokensOut":[{"token":"${tokenOut.address.toString()}","minAmount":"${minAmountOut}","recipient":"${user}"}],"destinationChain":${chainId}}`
    )
  })

  it('creates a complex Swap with valid parameters and stringifies it', () => {
    const sourceChain = ChainId.SOLANA_MAINNET
    const destinationChain = ChainId.SOLANA_MAINNET
    const user = randomSvmAddress()
    const settler = randomSettler(sourceChain)
    const deadline = BigInt.fromI32(999999)
    const tokenIn = SwapTokenIn.fromI32(randomSPLToken(sourceChain), 10)
    const tokenOut = SwapTokenOut.fromI32(randomSPLToken(destinationChain), 100, randomSvmAddress())

    setContext(1, 1, user.toString(), [settler], 'config-456')

    const swap = new Swap(
      sourceChain,
      [tokenIn],
      [tokenOut],
      destinationChain,
      Address.fromString(settler.address),
      user,
      deadline
    )
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.user).toBe(user.toString())
    expect(swap.settler).toBe(settler.address.toString())
    expect(swap.deadline).toBe(deadline.toString())
    expect(swap.nonce).toBe('0x')
    expect(swap.maxFees.length).toBe(0)

    expect(swap.sourceChain).toBe(sourceChain)
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensIn[0].token).toBe(tokenIn.token)
    expect(swap.tokensIn[0].amount).toBe(tokenIn.amount)

    expect(swap.destinationChain).toBe(destinationChain)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensOut[0].token).toBe(tokenOut.token)
    expect(swap.tokensOut[0].minAmount).toBe(tokenOut.minAmount)
    expect(swap.tokensOut[0].recipient).toBe(tokenOut.recipient)

    expect(swap.events.length).toBe(0)

    expect(JSON.stringify(swap)).toBe(
      `{"op":0,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[],"events":[],"sourceChain":${sourceChain},"tokensIn":[{"token":"${tokenIn.token}","amount":"${tokenIn.amount}"}],"tokensOut":[{"token":"${tokenOut.token}","minAmount":"${tokenOut.minAmount}","recipient":"${tokenOut.recipient}"}],"destinationChain":${destinationChain}}`
    )
  })

  it('throws an error when SwapTokenIn list is empty', () => {
    expect(() => {
      const tokensOut = [SwapTokenOut.fromI32(randomSPLToken(), 10, randomSvmAddress())]
      new Swap(1, [], tokensOut, 10)
    }).toThrow('TokenIn list cannot be empty')
  })

  it('throws an error when SwapTokenOut list is empty', () => {
    expect(() => {
      const tokensIn = [SwapTokenIn.fromI32(randomSPLToken(), 10)]
      new Swap(1, tokensIn, [], 10)
    }).toThrow('TokenOut list cannot be empty')
  })
})

describe('SwapBuilder - SVM', () => {
  const sourceChain = ChainId.SOLANA_MAINNET
  const destinationChain = ChainId.SOLANA_MAINNET
  const tokenInAddressStr = 'So11111111111111111111111111111111111111111'
  const tokenOutAddressStr = 'So11111111111111111111111111111111111111112'
  const recipientAddressStr = 'So11111111111111111111111111111111111111113'

  it('builds a Swap with token amounts', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = SPLToken.fromAddress(tokenInAddress, sourceChain, 0, 'USDC')
    const tokenOut = SPLToken.fromAddress(tokenOutAddress, destinationChain, 0, 'USDT')

    const tokenInAmount = TokenAmount.fromI32(tokenIn, 1000)
    const tokenOutAmount = TokenAmount.fromI32(tokenOut, 950)

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokenInFromTokenAmount(tokenInAmount)
    builder.addTokenOutFromTokenAmount(tokenOutAmount, recipientAddress)

    const swap = builder.build()
    expect(swap.op).toBe(OperationType.Swap)
    expect(swap.sourceChain).toBe(sourceChain)
    expect(swap.destinationChain).toBe(destinationChain)
    expect(swap.tokensIn[0].token).toBe(tokenInAddress.toString())
    expect(swap.tokensOut[0].recipient).toBe(recipientAddress.toString())
  })

  it('adds multiple TokenIn/Out with fromStringDecimal', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = SPLToken.fromAddress(tokenInAddress, sourceChain, 0, 'USDC')
    const tokenOut = SPLToken.fromAddress(tokenOutAddress, destinationChain, 0, 'USDT')

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokenInFromStringDecimal(tokenIn, '1')
    builder.addTokenOutFromStringDecimal(tokenOut, '1', recipientAddress)

    const swap = builder.build()
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensOut.length).toBe(1)
    expect(swap.tokensIn[0].amount).toBe('1')
    expect(swap.tokensOut[0].minAmount).toBe('1')
  })

  it('throws if SwapTokenIn chainId does not match sourceChain', () => {
    expect(() => {
      const token = SPLToken.fromString(tokenInAddressStr, 999) // wrong chain
      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenInFromStringDecimal(token, '1')
    }).toThrow('Tokens in must be on the source chain')
  })

  it('throws if SwapTokenOut chainId does not match destinationChain', () => {
    expect(() => {
      const recipient = Address.fromString(recipientAddressStr)
      const token = SPLToken.fromString(tokenOutAddressStr, 5) // wrong chain
      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenOutFromStringDecimal(token, '1', recipient)
    }).toThrow('Tokens out must be on the destination chain')
  })

  it('adds tokensIn and tokensOut via arrays', () => {
    const tokenInAddress = Address.fromString(tokenInAddressStr)
    const tokenOutAddress = Address.fromString(tokenOutAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)

    const tokenIn = SPLToken.fromAddress(tokenInAddress, sourceChain, 0)
    const tokenOut = SPLToken.fromAddress(tokenOutAddress, destinationChain, 0)

    const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')
    const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '2')

    const builder = SwapBuilder.forChains(sourceChain, destinationChain)
    builder.addTokensInFromTokenAmounts([tokenInAmount])
    builder.addTokensOutFromTokenAmounts([tokenOutAmount], recipientAddress)

    const swap = builder.build()
    expect(swap.tokensIn.length).toBe(1)
    expect(swap.tokensOut.length).toBe(1)
  })

  it('throws if no SwapTokenIn is added before build', () => {
    expect(() => {
      const tokenOut = SPLToken.fromString(tokenOutAddressStr, destinationChain)
      const tokenOutAmount = TokenAmount.fromStringDecimal(tokenOut, '1')
      const recipient = Address.fromString(recipientAddressStr)

      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenOutFromTokenAmount(tokenOutAmount, recipient)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })

  it('throws if no SwapTokenOut is added before build', () => {
    expect(() => {
      const tokenIn = SPLToken.fromString(tokenInAddressStr, sourceChain)
      const tokenInAmount = TokenAmount.fromStringDecimal(tokenIn, '1')

      const builder = SwapBuilder.forChains(sourceChain, destinationChain)
      builder.addTokenInFromTokenAmount(tokenInAmount)

      builder.build()
    }).toThrow('Tokens in and out are required')
  })
})
