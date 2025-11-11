import { z } from 'zod'

export const ParameterizedResponseValidator = z
  .object({
    paramResponse: z.record(z.string()).optional(),
    default: z.string().optional(),
    log: z.boolean().optional(),
  })
  .refine((data) => !!data.paramResponse || data.default !== undefined, {
    message: "At least one of 'paramResponse' or 'default' must be defined",
  })

export const TokenTypeValidator = z.object({
  address: z.string(),
  chainId: z.number(),
})

export const TokenAmountTypeValidator = z.object({
  token: TokenTypeValidator,
  amount: z.string(),
})

export const InputsValidator = z.record(
  z.string(),
  z.union([z.number(), z.string(), TokenTypeValidator, TokenAmountTypeValidator])
)

export const MockFunctionResponseValidator = z.union([z.string(), ParameterizedResponseValidator, z.literal('log')])

export const MockSectionValidator = z.record(MockFunctionResponseValidator)

export const MockConfigValidator = z.record(z.union([MockSectionValidator, InputsValidator]))
