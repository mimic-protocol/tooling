import { z } from 'zod'

export const ParameterizedResponseValidator = z.object({
  paramResponses: z.record(z.string()),
  default: z.string().optional(),
})

export const MockResponseValueValidator = z.union([z.string(), ParameterizedResponseValidator])
export const MockConfigValidator = z.record(MockResponseValueValidator)

export type MockResponseValue = z.infer<typeof MockResponseValueValidator>
export type ParameterizedResponse = z.infer<typeof ParameterizedResponseValidator>
export type MockConfig = z.infer<typeof MockConfigValidator>
