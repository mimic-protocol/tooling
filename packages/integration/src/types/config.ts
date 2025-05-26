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

// Function mocks
const MockFunctionResponseValidator = z.union([z.string(), ParameterizedResponseValidator, z.literal('log')])

export const MockSectionValidator = z.record(MockFunctionResponseValidator)

// The full config: a record of dynamic namespaces → sections (function mocks or inputs)
export const MockConfigValidator = z.record(z.union([MockSectionValidator, InputsValidator]))

export type MockResponseValue = z.infer<typeof MockFunctionResponseValidator>
export type ParameterizedResponse = z.infer<typeof ParameterizedResponseValidator>
export type MockConfig = z.output<typeof MockConfigValidator>
