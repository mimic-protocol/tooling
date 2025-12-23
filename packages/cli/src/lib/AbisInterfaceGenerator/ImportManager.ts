import NameManager from './NameManager'
import { ImportedTypes } from './types'

export default class ImportManager {
  private types: Set<ImportedTypes>

  constructor() {
    this.types = new Set<ImportedTypes>()
  }

  addType(type: ImportedTypes): void {
    this.types.add(type)
  }

  generateImportsCode(): string {
    if (this.types.size === 0) return ''

    const sortedTypes = [...this.types].sort((a, b) => String(a).localeCompare(String(b)))
    const importIdentifiers = sortedTypes.map((type) => NameManager.formatImportStatement(type))

    return `import { ${importIdentifiers.join(', ')} } from '@mimicprotocol/lib-ts'`
  }
}
