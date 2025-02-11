import { randomAddress } from '@mimic-fi/helpers'
import { expect } from 'chai'

import ManifestHandler from '../src/ManifestHandler'

describe('ManifestHandler', () => {
  const manifest = {
    version: '1.0.0',
    name: 'sample task',
    trigger: { type: 'cron', schedule: '0 0 * * *', delta: '1h' },
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
        itReturnsAnError({ ...manifest, version: '1.a' }, 'Must be a valid version')
      })

      context('when the trigger is invalid', () => {
        context('when the type is not valid', () => {
          itReturnsAnError(
            { ...manifest, trigger: { ...manifest.trigger, type: 'nothing' } },
            `Invalid discriminator value. Expected 'event' | 'cron' | 'balance'`
          )
        })

        context('when the trigger is cron', () => {
          context('when the schedule is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...manifest.trigger, schedule: '0 0' } }, 'Invalid Schedule')
          })

          context('when delta is missing', () => {
            itReturnsAnError({ ...manifest, trigger: { ...manifest.trigger, delta: undefined } }, 'Required')
          })

          context('when the delta is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...manifest.trigger, delta: '2' } }, 'Invalid Delta')
          })
        })

        context('when the trigger is event', () => {
          const eventTrigger = {
            type: 'event',
            chainId: 1,
            contract: randomAddress(),
            event: 'Something(bool)',
            delta: '1h',
          }

          context('when chainId is missing', () => {
            itReturnsAnError({ ...manifest, trigger: { ...eventTrigger, chainId: undefined } }, 'Required')
          })

          context('when chainId is invalid', () => {
            itReturnsAnError(
              { ...manifest, trigger: { ...eventTrigger, chainId: '123' } },
              'Expected number, received string'
            )
          })

          context('when contract is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...eventTrigger, contract: '0x0' } }, 'Must be a valid address')
          })

          context('when event is missing', () => {
            itReturnsAnError({ ...manifest, trigger: { ...eventTrigger, event: undefined } }, 'Required')
          })

          context('when event is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...eventTrigger, event: 'test' } }, 'Must be a valid event')
          })

          context('when delta is missing', () => {
            itReturnsAnError({ ...manifest, trigger: { ...eventTrigger, delta: undefined } }, 'Required')
          })

          context('when delta is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...eventTrigger, delta: '2' } }, 'Invalid Delta')
          })
        })

        context('when the trigger is balance', () => {
          const balanceTrigger = {
            type: 'balance',
            chainId: 1,
            account: randomAddress(),
            token: 'native',
            gt: '100',
            lt: '500',
            delta: '1h',
          }

          context('when chainId is missing', () => {
            itReturnsAnError({ ...manifest, trigger: { ...balanceTrigger, chainId: undefined } }, 'Required')
          })

          context('when chainId is invalid', () => {
            itReturnsAnError(
              { ...manifest, trigger: { ...balanceTrigger, chainId: '123' } },
              'Expected number, received string'
            )
          })

          context('when account is missing', () => {
            itReturnsAnError({ ...manifest, trigger: { ...balanceTrigger, account: undefined } }, 'Required')
          })

          context('when account is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...balanceTrigger, account: '0x0' } }, 'Must be a valid address')
          })

          context('when token is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...balanceTrigger, token: 'test' } }, 'Invalid input')
          })

          context('when gt and lt are missing', () => {
            itReturnsAnError(
              { ...manifest, trigger: { ...balanceTrigger, gt: undefined, lt: undefined } },
              'Either gt and/or lt should be used'
            )
          })

          context('when delta is missing', () => {
            itReturnsAnError({ ...manifest, trigger: { ...balanceTrigger, delta: undefined } }, 'Required')
          })

          context('when delta is invalid', () => {
            itReturnsAnError({ ...manifest, trigger: { ...balanceTrigger, delta: '2' } }, 'Invalid Delta')
          })
        })
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
