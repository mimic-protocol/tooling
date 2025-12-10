<h1 align="center">
  <a href="https://mimic.fi"><img src="https://www.mimic.fi/logo.png" alt="Mimic Protocol" width="200"></a> 
</h1>

<h4 align="center">Blockchain development platform</h4>

<p align="center">
  <a href="https://github.com/mimic-protocol/tooling/actions/workflows/ci.yml">
    <img src="https://github.com/mimic-protocol/tooling/actions/workflows/ci.yml/badge.svg" alt="Build">
  </a>
  <a href="https://discord.mimic.fi">
    <img alt="Discord" src="https://img.shields.io/discord/989984112397922325">
  </a>
</p>

<p align="center">
  <a href="#content">Content</a> •
  <a href="#setup">Setup</a> •
  <a href="#usage">Usage</a> •
  <a href="#security">Security</a> •
  <a href="#license">License</a>
</p>

---

## Content

This package provides tooling and helpers to write and run tests for Mimic Protocol tasks using TypeScript. It includes:

- Mocking of inputs, balances, prices, contract calls responses, and context variables
- Simulated task execution with mocked environment
- Structured task outputs to assert emitted intents using frameworks like Mocha and Chai

## Setup

To set up this project you'll need [git](https://git-scm.com) and [yarn](https://classic.yarnpkg.com) installed.

Install the library from the root of the monorepo:

```bash
# Clone this repository
$ git clone https://github.com/mimic-protocol/tooling

# Go into the repository
$ cd tooling

# Install dependencies
$ yarn
```

## Usage

Here’s an example of how to test a Mimic task:

```ts
import { runTask } from "@mimicprotocol/test-ts";
import { expect } from "chai";

const taskDir = "./my-task";
const context = { user: "0x...", settler: "0x...", timestamp: Date.now() };
const inputs = { token: "0x...", amount: "10000000" };

const intents = await runTask(taskDir, context, { inputs });

expect(intents).to.be.an("array").that.is.not.empty;
expect(intents).to.have.lengthOf(1);

expect(intents[0].type).to.be.equal("transfer");
expect(intents[0].settler).to.be.equal(context.settler);

expect(intents[0].transfers).to.have.lengthOf(1);
expect(intents[0].transfers[0].token).to.be.equal(inputs.token);
expect(intents[0].transfers[0].amount).to.be.equal(inputs.amount);
```

For full task testing guide and examples please visit [docs.mimic.fi](https://docs.mimic.fi/)

## Security

To read more about our auditing and related security processes please refer to the [security section](https://docs.mimic.fi/miscellaneous/security) of our docs site.

However, if you found any potential issue in any of our smart contracts or in any piece of code you consider critical
for the safety of the protocol, please contact us through <a href="mailto:security@mimic.fi">security@mimic.fi</a>.

## License

This project is licensed under the GNU General Public License v3.0.  
See the [LICENSE](../../LICENSE) file for details.

---

> Website [mimic.fi](https://mimic.fi) &nbsp;&middot;&nbsp;
> Docs [docs.mimic.fi](https://docs.mimic.fi) &nbsp;&middot;&nbsp;
> GitHub [@mimic-fi](https://github.com/mimic-fi) &nbsp;&middot;&nbsp;
> Twitter [@mimicfi](https://twitter.com/mimicfi) &nbsp;&middot;&nbsp;
> Discord [mimic](https://discord.mimic.fi)
