import { runTask } from '@mimicprotocol/test-ts'
import { expect } from 'chai'

describe('Task', () => {
  it('produces the expected intents', async () => {
    const taskDir = './'

    const context = {
      user: '0x756f45e3fa69347a9a973a725e3c98bc4db0b5a0',
      settler: '0xdcf1d9d12a0488dfb70a8696f44d6d3bc303963d',
      timestamp: '1438223173000',
    }

    const inputs = {
      chainId: 10,
      token: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      amount: '10000000',
      recipient: context.user,
      fee: '100',
    }

    const intents = await runTask(taskDir, context, { inputs })

    expect(intents).to.be.an('array').that.is.not.empty
    expect(intents).to.have.lengthOf(1)

    expect(intents[0].type).to.be.equal('transfer')
    expect(intents[0].settler).to.be.equal(context.settler)
    expect(intents[0].user).to.be.equal(context.user)
    expect(intents[0].chainId).to.be.equal(inputs.chainId)
    expect(intents[0].feeToken).to.be.equal(inputs.token)
    expect(intents[0].feeAmount).to.be.equal(inputs.fee)

    expect(intents[0].transfers).to.have.lengthOf(1)
    expect(intents[0].transfers[0].token).to.be.equal(inputs.token)
    expect(intents[0].transfers[0].amount).to.be.equal(inputs.amount)
    expect(intents[0].transfers[0].recipient).to.be.equal(inputs.recipient)
  })
})
