import {
  AddressValidator,
  BigIntegerValidator,
  ChainIdValidator,
  HexValidator,
  NaturalNumberValidator,
  PositiveNumberValidator,
  SolidityTypeValidator,
  StringValidator,
  TimestampValidator,
  TriggerType,
} from '@mimicprotocol/sdk'
import { z } from 'zod'

export const ContextValidator = z
  .object({
    timestamp: TimestampValidator,
    consensusThreshold: PositiveNumberValidator,
    user: AddressValidator,
    settlers: z.array(
      z.object({
        address: AddressValidator,
        chainId: ChainIdValidator,
      })
    ),
    configSig: HexValidator,
    trigger: z.object({
      type: z.nativeEnum(TriggerType),
      data: HexValidator,
    }),
  })
  .partial()

export const ParameterizedResponseValidator = z
  .object({
    paramResponse: z.record(z.string()).optional(),
    default: z.string().optional(),
    log: z.boolean().optional(),
  })
  .refine((data) => !!data.paramResponse || data.default !== undefined, {
    message: "At least one of 'paramResponse' or 'default' must be defined",
  })

export const BigInt18DecimalsValidator = StringValidator.regex(
  /^\d+$/,
  'Value must be a valid bigint in 18 decimal format'
)

export const TokenTypeValidator = z.object({
  address: AddressValidator,
  chainId: ChainIdValidator,
})

export const TokenAmountTypeValidator = z.object({
  token: TokenTypeValidator,
  amount: BigIntegerValidator,
})

export const InputsValidator = z.record(
  z.string(),
  z.union([z.number(), z.string(), TokenTypeValidator, TokenAmountTypeValidator])
)

export const MockFunctionResponseValidator = z.union([z.string(), ParameterizedResponseValidator, z.literal('log')])

export const MockSectionValidator = z.record(MockFunctionResponseValidator)

export const MockConfigValidator = z.record(z.union([MockSectionValidator, InputsValidator]))

export const GetPriceRequestValidator = z.object({
  token: AddressValidator,
  chainId: ChainIdValidator,
  timestamp: TimestampValidator.optional(),
})

export const GetPriceResponseValidator = z
  .array(BigInt18DecimalsValidator)
  .min(1, 'Response must contain at least one element (bigint in 18 decimal format)')

export enum ListType {
  AllowList = 0,
  DenyList = 1,
}

export const RelevantTokensRequestValidator = z.object({
  owner: AddressValidator,
  chainIds: z.array(ChainIdValidator),
  usdMinAmount: PositiveNumberValidator,
  tokens: z.array(TokenTypeValidator),
  tokenFilter: z.nativeEnum(ListType),
})

export const RelevantTokenBalanceValidator = z.object({
  token: TokenTypeValidator,
  balance: BigIntegerValidator,
})

export const RelevantTokensResponseValidator = z.object({
  timestamp: TimestampValidator,
  balances: z.array(RelevantTokenBalanceValidator),
})

export const ContractCallTypedValueValidator = z.object({
  abiType: SolidityTypeValidator,
  value: StringValidator,
})

export const ContractCallRequestValidator = z.object({
  to: AddressValidator,
  chainId: ChainIdValidator,
  timestamp: TimestampValidator.optional(),
  fnSelector: HexValidator,
  params: z.array(ContractCallTypedValueValidator).optional(),
})

export const SubgraphQueryRequestValidator = z.object({
  chainId: ChainIdValidator,
  subgraphId: StringValidator,
  query: StringValidator,
  timestamp: TimestampValidator,
})

export const SubgraphQueryResponseValidator = z.object({
  blockNumber: NaturalNumberValidator,
  data: StringValidator,
})
