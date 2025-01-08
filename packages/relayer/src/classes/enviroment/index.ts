export default class Enviroment {
  getNumber(): number {
    console.log('>>> getNumber called')
    return Math.floor(Math.random() * 10)
  }

  create(value: number, output: number[]): void {
    console.log(`>>> environment.create(${value})`)
    output.push(value)
  }
}
