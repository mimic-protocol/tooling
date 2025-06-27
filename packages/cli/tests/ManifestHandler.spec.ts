import { expect } from 'chai'

import ManifestHandler from '../src/lib/ManifestHandler'
import { SEM_VER_REGEX } from '../src/validators'

import invalidSemVers from './fixtures/sem-vers/invalid-sem-vers.json'
import validSemVers from './fixtures/sem-vers/valid-sem-vers.json'

describe('ManifestHandler', () => {
  const manifest = {
    version: '1.0.0',
    name: 'sample task',
    description: 'some description',
    inputs: [{ firstStaticNumber: 'uint8' }, { secondStaticNumber: 'uint8' }],
    abis: [{ ERC20: './abis/ERC20.json' }],
  }

  describe('validate', () => {
    context('when the manifest is valid', () => {
      context('when everything is present', () => {
        it('returns the parsed manifest', () => {
          for (const version of validSemVers) {
            const parsedManifest = ManifestHandler.validate({ ...manifest, version })

            expect(parsedManifest).to.not.be.undefined
            expect(Array.isArray(parsedManifest.inputs)).to.be.false
            expect(Array.isArray(parsedManifest.abis)).to.be.false
          }
        })
      })

      context('when dealing with inputs', () => {
        context('when inputs have descriptions', () => {
          it('returns the parsed manifest with described inputs', () => {
            const manifestWithDescriptions = {
              ...manifest,
              inputs: [
                { staticNumber: 'uint32' },
                { describedNumber: { type: 'uint32', description: 'A number with description' } },
              ],
            }
            const parsedManifest = ManifestHandler.validate(manifestWithDescriptions)

            expect(parsedManifest).to.not.be.undefined
            expect(parsedManifest.inputs.staticNumber).to.equal('uint32')
            expect(parsedManifest.inputs.describedNumber).to.deep.equal({
              type: 'uint32',
              description: 'A number with description',
            })
          })
        })

        context('when inputs do not have descriptions', () => {
          it('returns the parsed manifest with simple type inputs', () => {
            const parsedManifest = ManifestHandler.validate(manifest)

            expect(parsedManifest).to.not.be.undefined
            expect(parsedManifest.inputs.firstStaticNumber).to.equal('uint8')
            expect(parsedManifest.inputs.secondStaticNumber).to.equal('uint8')
          })
        })

        context('when inputs is missing', () => {
          it('returns the parsed manifest', () => {
            const parsedManifest = ManifestHandler.validate({ ...manifest, inputs: undefined })

            expect(parsedManifest).to.not.be.undefined
            expect(Array.isArray(parsedManifest.inputs)).to.be.false
            expect(Array.isArray(parsedManifest.abis)).to.be.false
          })
        })
      })

      context('when dealing with lib version', () => {
        context('when the lib version is not present', () => {
          it('adds the lib version to the manifest', () => {
            const parsedManifest = ManifestHandler.validate(manifest)

            expect(parsedManifest.metadata.libVersion).to.match(SEM_VER_REGEX)
          })
        })

        context('when the lib version is present', () => {
          it('overrides the lib version', () => {
            const libVersion = '999.9.9'
            const manifestWithLibVersion = { ...manifest, metadata: { libVersion } }
            const parsedManifest = ManifestHandler.validate(manifestWithLibVersion)

            expect(parsedManifest.metadata.libVersion).to.not.equal(libVersion)
          })
        })
      })

      context('when abis is missing', () => {
        it('returns the parsed manifest', () => {
          const parsedManifest = ManifestHandler.validate({ ...manifest, abis: undefined })

          expect(parsedManifest).to.not.be.undefined
          expect(Array.isArray(parsedManifest.inputs)).to.be.false
          expect(Array.isArray(parsedManifest.abis)).to.be.false
        })
      })
    })

    context('when the manifest is not valid', () => {
      const itReturnsAnError = (m, ...errors) => {
        it('returns an error', () => {
          for (const error of errors) expect(() => ManifestHandler.validate(m)).to.throw(error)
        })
      }

      context('when the inputs are not unique', () => {
        itReturnsAnError({ ...manifest, inputs: [{ first: 1 }, { first: 2 }, { second: 3 }] }, 'Duplicate Entry')
      })

      context('when the abis are not unique', () => {
        itReturnsAnError(
          { ...manifest, abis: [{ first: 'first' }, { first: 'something' }, { second: 'second' }] },
          'Duplicate Entry'
        )
      })

      context('when there is more than one entry on inputs', () => {
        itReturnsAnError({ ...manifest, inputs: [{ first: 2, second: 4 }] }, 'More than one entry')
      })

      context('when there is more than one entry on abis', () => {
        itReturnsAnError({ ...manifest, abis: [{ first: 'first', second: 'second' }] }, 'More than one entry')
      })

      context('when the version is invalid', () => {
        it('returns an error', () => {
          for (const version of invalidSemVers)
            expect(() => ManifestHandler.validate({ ...manifest, version })).to.throw('Must be a valid semver')
        })
      })

      context('when an input is invalid', () => {
        itReturnsAnError(
          { ...manifest, inputs: [...manifest.inputs, { wrong: 'u8' }] },
          'Must be a valid solidity type'
        )
      })

      context('when the name is empty', () => {
        itReturnsAnError({ ...manifest, name: '' }, 'String must contain at least 1 character(s)')
      })

      context('when the name is missing', () => {
        itReturnsAnError({ ...manifest, name: undefined }, 'Required', 'name')
      })
    })
  })
})
