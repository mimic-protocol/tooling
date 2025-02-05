export default class Oracle {
  getETHPrice(): Promise<number> {
    // Mock
    return new Promise((resolve) => setTimeout(() => resolve(10), 1000))
  }
}
