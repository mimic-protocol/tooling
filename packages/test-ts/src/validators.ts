import {
  AddressValidator,
  BigIntegerValidator,
  ChainIdValidator,
  HexValidator,
  OracleEvmCallRequestValidator,
  OracleRelevantTokenResultValidator,
  OracleRelevantTokensRequestValidator,
  OracleRelevantTokensResultValidator,
  OracleSubgraphQueryRequestValidator,
  OracleSubgraphQueryResultValidator,
  OracleTokenPriceRequestValidator,
  OracleTokenPriceResultValidator,
  PastTimestamp,
  PositiveNumberValidator,
  SolidityTypeValidator,
  StringValidator,
  TimestampValidator,
  TokenIdValidator,
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

export const TokenTypeValidator = TokenIdValidator

export const TokenAmountTypeValidator = OracleRelevantTokenResultValidator.omit({ balance: true }).extend({
  amount: BigIntegerValidator,
})

export const InputsValidator = z.record(
  z.string(),
  z.union([z.number(), z.string(), TokenTypeValidator, TokenAmountTypeValidator])
)

export const MockFunctionResponseValidator = z.union([z.string(), ParameterizedResponseValidator, z.literal('log')])

export const MockSectionValidator = z.record(MockFunctionResponseValidator)

export const MockConfigValidator = z.record(z.union([MockSectionValidator, InputsValidator]))

export const GetPriceRequestValidator = OracleTokenPriceRequestValidator.omit({ timestamp: true }).extend({
  timestamp: PastTimestamp.optional(),
})

export const GetPriceResponseValidator = z
  .array(OracleTokenPriceResultValidator.regex(/^\d+$/, 'Value must be a valid bigint in 18 decimal format'))
  .min(1, 'Response must contain at least one element')

export const RelevantTokensRequestValidator = OracleRelevantTokensRequestValidator

export const RelevantTokenBalanceValidator = OracleRelevantTokenResultValidator

export const RelevantTokensResponseValidator = OracleRelevantTokensResultValidator

export const ContractCallTypedValueValidator = z.object({
  abiType: SolidityTypeValidator,
  value: StringValidator,
})

export const ContractCallRequestValidator = OracleEvmCallRequestValidator.omit({ data: true, timestamp: true }).extend({
  timestamp: PastTimestamp.optional(),
  fnSelector: HexValidator,
  params: z.array(ContractCallTypedValueValidator).optional(),
})

export const SubgraphQueryRequestValidator = OracleSubgraphQueryRequestValidator.omit({ timestamp: true }).extend({
  timestamp: PastTimestamp.optional(),
})

export const SubgraphQueryResponseValidator = OracleSubgraphQueryResultValidator
