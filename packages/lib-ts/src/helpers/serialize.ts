export interface Stringable {
  toString(): string
}

export interface Serializable {
  serialize(): string
}

export function serialize<T extends Stringable>(elem: T): string {
  // eslint-disable-next-line
  // @ts-ignore
  if (elem instanceof Serializable) return elem.serialize()
  return elem.toString()
}
