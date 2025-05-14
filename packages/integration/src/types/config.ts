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

const InputsValidator = z.record(z.string(), z.union([z.number(), z.string()]))

export const MockResponseValueValidator = z.union([z.string(), ParameterizedResponseValidator, InputsValidator])
export const MockConfigValidator = z.record(MockResponseValueValidator)

export type MockResponseValue = z.infer<typeof MockResponseValueValidator>
export type ParameterizedResponse = z.infer<typeof ParameterizedResponseValidator>
export type MockConfig = z.infer<typeof MockConfigValidator>
