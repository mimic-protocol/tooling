import { expect } from 'chai'
import * as path from 'path'

import ManifestHandler, { getRunnerVersion } from '../src/lib/ManifestHandler'
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

      context('when dealing with runner version', () => {
        context('when the runner version is not present', () => {
          it('adds the runner version to the manifest', () => {
            const parsedManifest = ManifestHandler.validate(manifest)

            expect(parsedManifest.metadata.runnerVersion).to.match(SEM_VER_REGEX)
          })
        })

        context('when the runner version is present', () => {
          it('overrides the runner version', () => {
            const runnerVersion = '999.9.9'
            const manifestWithRunnerVersion = { ...manifest, metadata: { runnerVersion } }
            const parsedManifest = ManifestHandler.validate(manifestWithRunnerVersion)

            expect(parsedManifest.metadata.runnerVersion).to.not.equal(runnerVersion)
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

  describe('getRunnerVersion', () => {
    const singleRangePath = path.join(__dirname, 'fixtures', 'lib-runner-mappings', 'single-range.yaml')
    const multipleRangesPath = path.join(__dirname, 'fixtures', 'lib-runner-mappings', 'multiple-ranges.yaml')
    const invalidMappingPath = path.join(__dirname, 'fixtures', 'lib-runner-mappings', 'invalid-mapping.yaml')

    context('when using a single range mapping', () => {
      context('when version satisfies the range', () => {
        context('when version is at exact boundary', () => {
          it('returns the corresponding runner version', () => {
            const result = getRunnerVersion('0.0.1-rc.1', singleRangePath)

            expect(result).to.equal('1.0.0')
          })
        })

        context('when version is above the boundary', () => {
          it('returns the corresponding runner version', () => {
            const versions = ['0.0.1-rc.5', '0.1.0', '1.0.0', '2.0.0']

            for (const version of versions) {
              const result = getRunnerVersion(version, singleRangePath)
              expect(result).to.equal('1.0.0')
            }
          })
        })
      })

      context('when version does not satisfy the range', () => {
        context('when version is below the boundary', () => {
          it('throws an error', () => {
            const versions = ['0.0.0', '0.0.1-alpha.1', '0.0.1-beta.1', '0.0.1-rc.0']

            for (const version of versions) {
              expect(() => getRunnerVersion(version, singleRangePath)).to.throw(
                `No runner version mapping found for lib-ts version ${version}`
              )
            }
          })
        })
      })
    })

    context('when using multiple range mappings', () => {
      context('when version satisfies multiple ranges', () => {
        it('returns the runner version from the first matching range', () => {
          const result = getRunnerVersion('0.0.5', multipleRangesPath)

          expect(result).to.equal('1.0.0')
        })
      })

      context('when version satisfies only one range', () => {
        it('returns the corresponding runner version', () => {
          const testCases = [
            { version: '0.0.1-rc.1', expected: '1.0.0' },
            { version: '0.0.9', expected: '1.0.0' },
            { version: '0.1.0', expected: '2.0.0' },
            { version: '0.5.0', expected: '2.0.0' },
            { version: '1.0.0', expected: '3.0.0' },
            { version: '2.0.0', expected: '3.0.0' },
          ]

          for (const { version, expected } of testCases) {
            const result = getRunnerVersion(version, multipleRangesPath)
            expect(result).to.equal(expected)
          }
        })
      })

      context('when version does not satisfy any range', () => {
        it('throws an error', () => {
          const versions = ['0.0.0', '0.0.1-alpha.1', '0.0.1-beta.1']

          for (const version of versions) {
            expect(() => getRunnerVersion(version, multipleRangesPath)).to.throw(
              `No runner version mapping found for lib-ts version ${version}`
            )
          }
        })
      })
    })

    context('when mapping file is invalid', () => {
      it('throws an error', () => {
        expect(() => getRunnerVersion('0.0.1-rc.1', invalidMappingPath)).to.throw(
          'Failed to read lib-runner-mapping.yaml'
        )
      })
    })
  })
})
