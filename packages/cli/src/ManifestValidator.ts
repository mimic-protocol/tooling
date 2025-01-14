export type Manifest = {
  version: string
  name: string
  trigger: {
    type: string
    schedule: string
  }
  inputs: { [key: string]: unknown }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function validateManifest(manifest: any): Manifest {
  // todo add validation
  // todo remove anys with validation implementation
  return {
    ...manifest,
    inputs: manifest.inputs.reduce((acc: any, item: any) => ({
      ...acc,
      ...item,
    })),
  }
}
