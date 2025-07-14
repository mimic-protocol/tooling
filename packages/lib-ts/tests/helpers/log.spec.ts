import { log } from '../../src/log'
import { clearLogs, getLogs, getLogsByLevel } from '../helpers'

describe('log', () => {
  beforeEach(() => {
    clearLogs()
  })

  describe('critical', () => {
    describe('when message has no placeholders', () => {
      it('should throw an error with the critical message', () => {
        expect(() => {
          log.critical('Critical error occurred')
        }).toThrow('Critical error occurred')
      })
    })

    describe('when message has placeholders', () => {
      it('should throw an error with formatted message', () => {
        expect(() => {
          log.critical('Critical error: {} at {}', ['database', 'startup'])
        }).toThrow('Critical error: database at startup')
      })
    })

    describe('when format string has insufficient arguments', () => {
      it('should throw format error', () => {
        expect(() => {
          log.critical('Error: {} and {}', ['only-one'])
        }).toThrow('Too few arguments for format string')
      })
    })
  })

  describe('error', () => {
    describe('when message has no placeholders', () => {
      it('should not throw an error and capture the message', () => {
        expect(() => {
          log.error('An error occurred')
        }).not.toThrow()

        const errorLogs = getLogsByLevel(log.Level.ERROR)
        expect(errorLogs.length).toBe(1)
        expect(errorLogs[0].message).toBe('An error occurred')
      })
    })

    describe('when message has placeholders', () => {
      it('should not throw an error and capture formatted message', () => {
        expect(() => {
          log.error('Error in {}: {}', ['component', 'validation failed'])
        }).not.toThrow()

        const errorLogs = getLogsByLevel(log.Level.ERROR)
        expect(errorLogs.length).toBe(1)
        expect(errorLogs[0].message).toBe('Error in component: validation failed')
      })
    })

    describe('when format string has insufficient arguments', () => {
      it('should throw format error', () => {
        expect(() => {
          log.error('Error: {} and {}', ['only-one'])
        }).toThrow('Too few arguments for format string')
      })
    })
  })

  describe('warning', () => {
    describe('when message has no placeholders', () => {
      it('should not throw an error and capture the message', () => {
        expect(() => {
          log.warning('This is a warning')
        }).not.toThrow()

        const warningLogs = getLogsByLevel(log.Level.WARNING)
        expect(warningLogs.length).toBe(1)
        expect(warningLogs[0].message).toBe('This is a warning')
      })
    })

    describe('when message has placeholders', () => {
      it('should not throw an error and capture formatted message', () => {
        expect(() => {
          log.warning('Warning: {} is deprecated, use {} instead', ['oldMethod', 'newMethod'])
        }).not.toThrow()

        const warningLogs = getLogsByLevel(log.Level.WARNING)
        expect(warningLogs.length).toBe(1)
        expect(warningLogs[0].message).toBe('Warning: oldMethod is deprecated, use newMethod instead')
      })
    })

    describe('when format string has insufficient arguments', () => {
      it('should throw format error', () => {
        expect(() => {
          log.warning('Warning: {} and {}', ['only-one'])
        }).toThrow('Too few arguments for format string')
      })
    })
  })

  describe('info', () => {
    describe('when message has no placeholders', () => {
      it('should not throw an error and capture the message', () => {
        expect(() => {
          log.info('Information message')
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Information message')
      })
    })

    describe('when message has placeholders', () => {
      it('should not throw an error and capture formatted message', () => {
        expect(() => {
          log.info('Processing {} items from {}', ['100', 'queue'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Processing 100 items from queue')
      })
    })

    describe('when format string has insufficient arguments', () => {
      it('should throw format error', () => {
        expect(() => {
          log.info('Info: {} and {}', ['only-one'])
        }).toThrow('Too few arguments for format string')
      })
    })

    describe('when arguments are more than placeholders', () => {
      it('should not throw an error and capture partial message', () => {
        expect(() => {
          log.info('Value is {}', ['10', 'extra', 'arguments'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Value is 10')
      })
    })
  })

  describe('debug', () => {
    describe('when message has no placeholders', () => {
      it('should not throw an error and capture the message', () => {
        expect(() => {
          log.debug('Debug information')
        }).not.toThrow()

        const debugLogs = getLogsByLevel(log.Level.DEBUG)
        expect(debugLogs.length).toBe(1)
        expect(debugLogs[0].message).toBe('Debug information')
      })
    })

    describe('when message has placeholders', () => {
      it('should not throw an error and capture formatted message', () => {
        expect(() => {
          log.debug('Variable {} has value {}', ['counter', '42'])
        }).not.toThrow()

        const debugLogs = getLogsByLevel(log.Level.DEBUG)
        expect(debugLogs.length).toBe(1)
        expect(debugLogs[0].message).toBe('Variable counter has value 42')
      })
    })

    describe('when format string has insufficient arguments', () => {
      it('should throw format error', () => {
        expect(() => {
          log.debug('Debug: {} and {}', ['only-one'])
        }).toThrow('Too few arguments for format string')
      })
    })
  })

  describe('format function behavior', () => {
    describe('when message contains single braces', () => {
      it('should not replace single braces and capture correctly', () => {
        expect(() => {
          log.info('Object { value: {} }', ['42'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Object { value: 42 }')
      })
    })

    describe('when message contains mixed brace patterns', () => {
      it('should handle mixed brace patterns correctly and capture output', () => {
        expect(() => {
          log.info('Config: { key: "{}" }', ['value'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Config: { key: "value" }')
      })
    })

    describe('when arguments contain special characters', () => {
      it('should handle special characters and capture correctly', () => {
        expect(() => {
          log.info('Path: {} with {} characters', ['/path/to/file', '"quotes"'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Path: /path/to/file with "quotes" characters')
      })
    })

    describe('when arguments are empty strings', () => {
      it('should handle empty string arguments and capture correctly', () => {
        expect(() => {
          log.info('Value: "{}" and "{}"', ['', 'non-empty'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Value: "" and "non-empty"')
      })
    })

    describe('when message has consecutive placeholders', () => {
      it('should replace consecutive placeholders correctly and capture output', () => {
        expect(() => {
          log.info('Values: {}, {}, {}', ['a', 'b', 'c'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Values: a, b, c')
      })
    })

    describe('when message has no placeholders but arguments provided', () => {
      it('should not throw an error and capture original message', () => {
        expect(() => {
          log.info('Simple message', ['unused', 'arguments'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('Simple message')
      })
    })

    describe('when format string is empty', () => {
      it('should handle empty format strings and capture correctly', () => {
        expect(() => {
          log.info('')
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('')
      })
    })

    describe('when format string has only placeholders', () => {
      it('should handle only placeholders and capture concatenated result', () => {
        expect(() => {
          log.info('{}{}{}', ['a', 'b', 'c'])
        }).not.toThrow()

        const infoLogs = getLogsByLevel(log.Level.INFO)
        expect(infoLogs.length).toBe(1)
        expect(infoLogs[0].message).toBe('abc')
      })
    })
  })

  describe('multiple logs interaction', () => {
    it('should capture and verify multiple sequential logs', () => {
      log.info('Step 1: Initialization')
      log.warning('Step 2: Warning about {}', ['configuration'])
      log.error('Step 3: Error in {}', ['validation'])

      const allLogs = getLogs()
      expect(allLogs.length).toBe(3)
      expect(allLogs[0].level).toBe(log.Level.INFO)
      expect(allLogs[0].message).toBe('Step 1: Initialization')
      expect(allLogs[1].level).toBe(log.Level.WARNING)
      expect(allLogs[1].message).toBe('Step 2: Warning about configuration')
      expect(allLogs[2].level).toBe(log.Level.ERROR)
      expect(allLogs[2].message).toBe('Step 3: Error in validation')
    })
  })
})
