# @funboxteam/crafter

[![npm (scoped)](https://img.shields.io/npm/v/@funboxteam/crafter)](https://www.npmjs.com/package/@funboxteam/crafter)
[![Coverage Status](https://coveralls.io/repos/github/funbox/crafter/badge.svg?branch=master)](https://coveralls.io/github/funbox/crafter?branch=master)

<img align="right" width="160" height="160"
     alt="Crafter avatar"
     src="./logo.png">

**Crafter** is an [API Blueprint](https://apiblueprint.org/) parser written in pure JavaScript.
It is a replacement for Drafter library with some handy features added.

[По-русски](./README.ru.md)

## Rationale

Drafter is written in C++, so the code is pretty complicated and obscure while containing a lot of bugs and legacy.
It is hard to understand how some of its parts work. And if bug fixes are welcomed by maintainers, adding a new feature could become an obstacle.

Our company has a tiny percent of C++ projects, so almost none of the developers can maintain Drafter.

That is why we decided to create own JavaScript replacement which eliminates all previously described limitations,
is easy to maintain, and allows us to add all needed features.

## Features

Compared to Drafter, this library can offer some important features:

- **Modules**. Now it is possible to split one giant file into parts and inject APIB files into each other, which makes documentation easy to use.
- **Resource Prototypes** allow you to set up common responses in one place and reuse them through the documentation.
- Support of **arrays in query strings**.
- **JSON Schema based types**. In case of complex types it is possible to describe them directly as JSON Schema.
- **String validation** attributes that describe the expected length of parameters and regular expressions they should match.
- Describe a **non-HTTP interaction** (as WebSocket) by means of Message section.

Additional information about how the library works is placed in the [docs](docs) directory.

## Installation

Global install:

```bash
npm install -g @funboxteam/crafter
```

Local install:

```bash
npm install --save @funboxteam/crafter
```

## Usage

### Node.js

Parse a file:

```javascript
const crafter = require('@funboxteam/crafter');

const apibFile = 'doc.apib';
const ast = (await crafter.parseFile(apibFile))[0].toRefract();
```

Or provide a string variable containing APIB documentation:

```javascript
const crafter = require('@funboxteam/crafter');

const source = '# My API\n\n## List users [GET /users]\n\n+ Response 200';
const ast = (await crafter.parse(source))[0].toRefract();
```

### CLI

To parse a file named `doc.apib` run the next command:

```bash
crafter [options] doc.apib
```

## Options

- `-f, --format <format>` — set output format of the parse result. Available formats: `json`, `yaml`. Default is `yaml`.
- `-s, --sourcemap` — export source maps in the parse result.
- `-d, --debug` — enable debugging mode, which disables catching some of the exceptions.
- `-l, --langserver` — enable tolerant mode, which is used in language server.
- `-h, --help` — output usage information.

## Run tests

```bash
npm test
```

## Run in Docker

To run @funboxteam/crafter as a Docker container execute the next command in the directory with documentation:

```bash
docker run \
  --rm \
  -v $(pwd):/app \
  funbox/crafter -f json doc-file.apib
```

The default working directory of the image is set to `/app`, therefore it is easier to mount
a host directory into the `/app`. Then just a filename as a parameter will do.

### Docker container in Windows

To run a container in Windows, add a slash (`/`) before `pwd`.
The command will look like this:

```bash
docker run \
  --rm \
  -v /$(pwd):/app/doc \
  funbox/crafter -f json doc/doc-file.apib
```

There is a chance that the mounted directory is empty. In this case, check that your hard drive is marked as shared.
This setting can be found in the settings of Docker Desktop for Windows, Shared Drives section.
If the disk is not shared, mark it as `shared`, apply changes, and restart Docker Desktop.

## Why API Blueprint

We use JSON API widely in the company, so each day our developers face such issues as describing and approving API documentation,
tracking changes, distributing documentation among partners, and so on. That is why we felt a strong need for convenient tools
to work with documentation.

Historically, the battle was between [API Blueprint](https://apiblueprint.org/) and [Swagger](https://swagger.io/).
We chose API Blueprint for two reasons. Firstly, the source code of documentation that is described using API Blueprint is more readable to humans.
Secondly, at the time of research conducted, Swagger lacked several important features, as `One Of` support.

## Credits

Awesome logo for the project was made by [Igor Garybaldi](https://pandabanda.com/).

[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
