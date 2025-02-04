export class MoreThanOneEntryError extends Error {
  public location: [string, unknown][]

  constructor(location: [string, unknown][]) {
    super('More than one entry')
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
    this.location = location
  }
}

export class DuplicateEntryError extends Error {
  public duplicateKey: string

  constructor(duplicateKey: string) {
    super('Duplicate Entry')
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
    this.duplicateKey = duplicateKey
  }
}

export class EmptyManifestError extends Error {
  constructor() {
    super('Empty Manifest')
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export const GENERIC_SUGGESTION = [
  'Contact the Mimic team for further assistance at our website https://www.mimic.fi/ or discord https://discord.com/invite/cpcyV9EsEg',
]
