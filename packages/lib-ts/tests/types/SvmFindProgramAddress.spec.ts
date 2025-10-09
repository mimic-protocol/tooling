import { JSON, SvmPdaSeed } from '../../src/types'
import {
  SerializableSvmFindProgramAddressResult,
  SvmFindProgramAddressParams,
  SvmFindProgramAddressResult,
} from '../../src/types'
import { randomSvmAddress } from '../helpers'

describe('SvmFindProgramAddress', () => {
  describe('params', () => {
    describe('stringify', () => {
      it('serializes to JSON correctly', () => {
        const seeds = [
          SvmPdaSeed.fromString('tag'),
          SvmPdaSeed.from(randomSvmAddress()),
          SvmPdaSeed.from(randomSvmAddress()),
        ]
        const programId = randomSvmAddress()

        const params = new SvmFindProgramAddressParams(seeds, programId.toString())
        const json = JSON.stringify(params)

        expect(json).toBe(
          `{"seeds":[${seeds.map((SvmPdaSeed: SvmPdaSeed) => `{"hex":"${SvmPdaSeed.hex}"}`).join(',')}],"programId":"${programId.toString()}"}`
        )
      })

      it('serializes to JSON correctly 2', () => {
        const seeds = [
          SvmPdaSeed.fromString('tag'),
          SvmPdaSeed.fromString('another tag'),
          SvmPdaSeed.from(randomSvmAddress()),
        ]
        const programId = randomSvmAddress()

        const params = new SvmFindProgramAddressParams(seeds, programId.toString())
        const json = JSON.stringify(params)

        expect(json).toBe(
          `{"seeds":[${seeds.map((SvmPdaSeed: SvmPdaSeed) => `{"hex":"${SvmPdaSeed.hex}"}`).join(',')}],"programId":"${programId.toString()}"}`
        )
      })
    })
  })

  describe('result', () => {
    it('deserializes from JSON correctly', () => {
      const addr = randomSvmAddress()
      const bump: u8 = 255
      const json = `{"address":"${addr.toString()}","bump":${bump}}`
      const parsed = JSON.parse<SerializableSvmFindProgramAddressResult>(json)
      const output = SvmFindProgramAddressResult.fromSerializable(parsed)

      expect(output.address).toBe(addr)
      expect(output.bump).toBe(bump)
    })
  })
})
