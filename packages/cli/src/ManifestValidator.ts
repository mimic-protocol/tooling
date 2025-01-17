import { DuplicateEntryError, EmptyManifestError, MoreThanOneEntryError } from './errors'
import { Manifest, ManifestValidator } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateManifest(manifest: any): Manifest {
  if (!manifest) throw new EmptyManifestError()

  const mergedManifest = {
    ...manifest,
    inputs: mergeIfUnique(manifest.inputs),
    abis: mergeIfUnique(manifest.abis),
  }
  return ManifestValidator.parse(mergedManifest)
}

function mergeIfUnique(list: Record<string, unknown>[]) {
  const merged: Record<string, unknown> = {}
  for (const obj of list) {
    const entries = Object.entries(obj)
    if (entries.length != 1) throw new MoreThanOneEntryError(entries)
    const [key, val] = entries[0]
    if (key in merged) throw new DuplicateEntryError(key)
    merged[key] = val
  }
  return merged
}
