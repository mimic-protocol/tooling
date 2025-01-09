export default abstract class Base {
  abstract generate(calls: string[]): Record<string, (...args: never) => unknown>
}
