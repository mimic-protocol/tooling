import { z } from 'zod'

export const ParameterizedResponseValidator = z
  .object({
    paramResponse: z.record(z.string()).optional(),
    default: z.string().optional(),
    log: z.boolean().optional(),
  })
  .refine((data) => !!data.paramResponse || data.default !== undefined || data.log !== undefined, {
    message: "At least one of 'paramResponse', 'default', or 'log' must be defined",
  })

export const MockResponseValueValidator = z.union([z.string(), ParameterizedResponseValidator])
export const MockConfigValidator = z.record(MockResponseValueValidator)

export type MockResponseValue = z.infer<typeof MockResponseValueValidator>
export type ParameterizedResponse = z.infer<typeof ParameterizedResponseValidator>
export type MockConfig = z.infer<typeof MockConfigValidator>
