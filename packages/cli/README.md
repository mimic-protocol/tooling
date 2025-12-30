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

The `mimic` CLI is a command-line interface to:

- Initialize a Mimic-compatible task project
- Generate types from your task manifest and ABIs
- Compile your AssemblyScript tasks to WebAssembly
- Test your tasks
- Deploy compiled tasks to IPFS and the Mimic Registry
- Link tasks to a project in the Mimic explorer

## Setup

To set up this project you'll need [git](https://git-scm.com) and [yarn](https://classic.yarnpkg.com) installed.

Install the CLI from the root of the monorepo:

```bash
# Clone this repository
$ git clone https://github.com/mimic-protocol/tooling

# Go into the repository
$ cd tooling

# Install dependencies
$ yarn
```

## Usage

Here's a quick overview of common commands:

```
USAGE
  $ mimic [COMMAND]

COMMANDS
  login    Authenticate with Mimic by storing your API key locally
  logout   Remove stored credentials for a profile
  profiles List all configured authentication profiles
  codegen  Generates typed interfaces for declared inputs and ABIs from your manifest.yaml file
  compile  Compiles task
  test     Tests your tasks
  deploy   Uploads your compiled task artifacts to IPFS and registers it into the Mimic Registry
  init     Initializes a new Mimic-compatible project structure in the specified directory
```

### Authentication

Before deploying tasks, you need to authenticate with your Mimic API key:

```bash
# Interactive login (recommended)
$ mimic login

# Non-interactive login (for CI/CD)
$ mimic login --api-key YOUR_API_KEY

# Login with a specific profile
$ mimic login --profile staging -api-key YOUR_API_KEY
```

#### Managing Profiles

The CLI supports multiple authentication profiles. Credentials are stored in `~/.mimic/credentials`.

```bash
# List all configured profiles
$ mimic profiles

# Login with a specific profile
$ mimic login --profile production

# Deploy using a specific profile
$ mimic deploy --profile production

# Remove credentials for a profile
$ mimic logout --profile staging
```

#### Credential Storage

Credentials are stored in an INI-style format at `~/.mimic/credentials`:

```ini
[default]
api_key=YOUR_DEFAULT_KEY

[staging]
api_key=YOUR_STAGING_KEY

[production]
api_key=YOUR_PRODUCTION_KEY
```

#### Deploy with Authentication

The `deploy` command now supports profile-based authentication:

```bash
# Deploy using default profile
$ mimic deploy

# Deploy using a specific profile
$ mimic deploy --profile staging

# Deploy with explicit API key (overrides profile)
$ mimic deploy --api-key YOUR_API_KEY
```

For full CLI documentation and examples please visit [docs.mimic.fi](https://docs.mimic.fi/)

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
