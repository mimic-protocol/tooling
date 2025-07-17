import { Context, runTask, Transfer } from '@mimicprotocol/test-ts'
import { expect } from 'chai'

describe('Task', () => {
  it('produces the expected intents', async () => {
    const taskDir = './'

    const context: Context = {
      user: '0x756f45e3fa69347a9a973a725e3c98bc4db0b5a0',
      settlers: [
        {
          address: '0xdcf1d9d12a0488dfb70a8696f44d6d3bc303963d',
          chainId: 10,
        },
      ],
      configSig: '682ec8210b1ce912da4d2952',
    }

    const inputs = {
      chainId: 10,
      token: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      amount: '10000000',
      recipient: context.user!,
      fee: '100',
    }

    const intents = await runTask(taskDir, context, { inputs })

    expect(intents).to.be.an('array').that.is.not.empty
    expect(intents).to.have.lengthOf(1)

    const intent = intents[0]
    expect(intent.type).to.be.equal('transfer')
    expect(intent.settler).to.be.equal(context.settlers![0].address)
    expect(intent.user).to.be.equal(context.user)

    const transferIntent = intent as Transfer
    expect(transferIntent.chainId).to.be.equal(inputs.chainId)
    expect(transferIntent.feeToken).to.be.equal(inputs.token)
    expect(transferIntent.feeAmount).to.be.equal(inputs.fee)

    expect(transferIntent.transfers).to.have.lengthOf(1)
    expect(transferIntent.transfers[0].token).to.be.equal(inputs.token)
    expect(transferIntent.transfers[0].amount).to.be.equal(inputs.amount)
    expect(transferIntent.transfers[0].recipient).to.be.equal(inputs.recipient)
  })
})
