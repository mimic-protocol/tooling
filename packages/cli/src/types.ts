import { z } from 'zod'

import { ManifestValidator } from './validators'

export type Manifest = z.infer<typeof ManifestValidator>

export type AbiParameter = {
  name?: string
  type: string
  components?: Array<{ name: string; type: string }>
}
