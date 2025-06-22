<h1 align="center">
  <a href="https://mimic.fi"><img src="https://www.mimic.fi/logo.png" alt="Mimic Protocol" width="200"></a> 
</h1>

<h4 align="center">Blockchain automation protocol</h4>

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

This package provides a lightweight standard library for writing Mimic Protocol tasks in AssemblyScript. It includes:

- Typed primitives to interact with oracles and contracts
- Safe and minimal bindings for blockchain-specific operations
- Utility helpers for developing deterministic, deployable task logic

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

Here’s an example of how to use the library in a Mimic task:

```ts
import { environment, Token } from '@mimicprotocol/lib-ts'

const USDC = Token.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 1)

environment.getPrice(USDC, new Date(1744818017000))
```

For full task development guide and examples please visit [docs.mimic.fi](https://docs.mimic.fi/)

## Security

To read more about our auditing and related security processes please refer to the [security section](https://docs.mimic.fi/miscellaneous/security) of our docs site.

However, if you found any potential issue in any of our smart contracts or in any piece of code you consider critical
for the safety of the protocol, please contact us through <a href="mailto:security@mimic.fi">security@mimic.fi</a>.

## License

This project is licensed under the GNU General Public License v3.0.  
See the [LICENSE](../../LICENSE) file for details.

### Third-Party Code

This project includes code from [The Graph Tooling](https://github.com/graphprotocol/graph-tooling), licensed under the MIT License.  
See the [LICENSE-MIT](https://github.com/graphprotocol/graph-tooling/blob/27659e56adfa3ef395ceaf39053dc4a31e6d86b7/LICENSE-MIT) file for details.
Their original license and attribution are preserved.


---

> Website [mimic.fi](https://mimic.fi) &nbsp;&middot;&nbsp;
> Docs [docs.mimic.fi](https://docs.mimic.fi) &nbsp;&middot;&nbsp;
> GitHub [@mimic-fi](https://github.com/mimic-fi) &nbsp;&middot;&nbsp;
> Twitter [@mimicfi](https://twitter.com/mimicfi) &nbsp;&middot;&nbsp;
> Discord [mimic](https://discord.mimic.fi)
