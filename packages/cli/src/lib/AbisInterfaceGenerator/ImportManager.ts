import { LibTypes } from '../../types'

export type ImportedTypes = LibTypes | 'environment' | 'EvmCallParam' | 'EvmDecodeParam' | 'parseCSV'

export class ImportManager {
  private types: Set<ImportedTypes>

  constructor() {
    this.types = new Set<ImportedTypes>()
  }

  addType(type: ImportedTypes): void {
    this.types.add(type)
  }

  addTypes(types: ImportedTypes[]): void {
    types.forEach((t) => this.types.add(t))
  }

  getImportedTypes(): Set<ImportedTypes> {
    return this.types
  }

  generateImportsCode(): string {
    if (this.types.size === 0) return ''

    const sortedTypes = [...this.types].sort((a, b) => String(a).localeCompare(String(b)))
    return `import { ${sortedTypes.join(', ')} } from '@mimicprotocol/lib-ts';`
  }
}
