import {
  AddressValidator,
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
  TokenAmountValidator,
  TokenValidator,
  TriggerType,
  z,
} from '@mimicprotocol/sdk'

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

export const InputsValidator = z.record(
  z.string(),
  z.union([z.number(), z.string(), TokenValidator, TokenAmountValidator])
)

// ========= Mocks =========

export const MockFunctionResponseValidator = z.union([z.string(), ParameterizedResponseValidator, z.literal('log')])

export const MockSectionValidator = z.record(MockFunctionResponseValidator)

export const MockConfigValidator = z.record(z.union([MockSectionValidator, InputsValidator]))

// ========= Token Price =========

export const TokenPriceRequestValidator = OracleTokenPriceRequestValidator.omit({ timestamp: true }).extend({
  timestamp: PastTimestamp.optional(),
})

export const TokenPriceResponseValidator = z
  .array(OracleTokenPriceResultValidator.regex(/^\d+$/, 'Value must be a valid bigint in 18 decimal format'))
  .min(1, 'Response must contain at least one element')

// ========= Relevant Tokens =========

export const RelevantTokensRequestValidator = OracleRelevantTokensRequestValidator

export const RelevantTokenBalanceValidator = OracleRelevantTokenResultValidator

export const RelevantTokensResponseValidator = OracleRelevantTokensResultValidator

// ========= Evm Call =========

export const EvmCallTypedValueValidator = z.object({
  abiType: SolidityTypeValidator,
  value: StringValidator,
})

export const EvmCallRequestValidator = OracleEvmCallRequestValidator.omit({ data: true, timestamp: true }).extend({
  timestamp: PastTimestamp.optional(),
  fnSelector: HexValidator,
  params: z.array(EvmCallTypedValueValidator).optional(),
})

// ========= Subgraph Query =========

export const SubgraphQueryRequestValidator = OracleSubgraphQueryRequestValidator.omit({ timestamp: true }).extend({
  timestamp: PastTimestamp.optional(),
})

export const SubgraphQueryResponseValidator = OracleSubgraphQueryResultValidator
