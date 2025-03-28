import { expect } from 'chai'

import ManifestHandler from '../src/ManifestHandler'

describe('ManifestHandler', () => {
  const manifest = {
    version: '1.0.0',
    name: 'sample task',
    inputs: [{ firstStaticNumber: 2 }, { secondStaticNumber: 3 }],
    abis: [{ ERC20: './abis/ERC20.json' }],
  }

  describe('validate', () => {
    context('when the manifest is valid', () => {
      context('when everything is present', () => {
        it('returns the parsed manifest', () => {
          const parsedManifest = ManifestHandler.validate(manifest)

          expect(parsedManifest).to.not.be.undefined
          expect(Array.isArray(parsedManifest.inputs)).to.be.false
          expect(Array.isArray(parsedManifest.abis)).to.be.false
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
        itReturnsAnError({ ...manifest, version: '1.a' }, 'Must be a valid semver')
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
