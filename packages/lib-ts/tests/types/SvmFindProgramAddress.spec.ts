import { JSON } from '../../src/types'
import { Seed, SvmFindProgramAddressParams, SvmFindProgramAddressResult } from '../../src/types/SvmFindProgramAddress'
import { randomSvmAddress } from '../helpers'

describe('SvmFindProgramAddress', () => {
  describe('params', () => {
    describe('stringify', () => {
      it('serializes to JSON correctly', () => {
        const seeds = [Seed.fromString('tag'), Seed.from(randomSvmAddress()), Seed.from(randomSvmAddress())]
        const programId = randomSvmAddress()

        const params = new SvmFindProgramAddressParams(seeds, programId.toString())
        const json = JSON.stringify(params)

        expect(json).toBe(
          `{"seeds":[${seeds.map((seed: Seed) => `{"hex":"${seed.hex}"}`).join(',')}],"programId":"${programId.toString()}"}`
        )
      })

      it('serializes to JSON correctly 2', () => {
        const seeds = [Seed.fromString('tag'), Seed.fromString('another tag'), Seed.from(randomSvmAddress())]
        const programId = randomSvmAddress()

        const params = new SvmFindProgramAddressParams(seeds, programId.toString())
        const json = JSON.stringify(params)

        expect(json).toBe(
          `{"seeds":[${seeds.map((seed: Seed) => `{"hex":"${seed.hex}"}`).join(',')}],"programId":"${programId.toString()}"}`
        )
      })
    })
  })

  describe('result', () => {
    it('deserializes from JSON correctly', () => {
      const addr = randomSvmAddress()
      const bump: u8 = 255
      const json = `{"address":"${addr.toString()}","bump":${bump}}`
      const output = SvmFindProgramAddressResult.fromString(json)

      expect(output.address).toBe(addr)
      expect(output.bump).toBe(bump)
    })
  })
})
