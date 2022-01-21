# @funbox/crafter

## Rationale

We use JSON API widely in the company, so each day, our developers face such issues as describing and approving
API documentation, tracking changes, distributing documentation among partners, and so on.
That is why we felt a strong need for convenient tools to work with documentation.

[По-русски](./README.ru.md)

Historically, the battle was between [API Blueprint](https://apiblueprint.org/) and [Swagger](https://swagger.io/).
We chose API Blueprint for two reasons. Firstly, the source code of documentation that is described using API Blueprint is more readable to humans.
Secondly, at the time of research conducted, Swagger lacked several important features, as One Of support.

API Blueprint consists of two parts:

- APIB format parser [Drafter](https://github.com/apiaryio/drafter);
- an API Blueprint renderer that outputs static HTML version of documentation [aglio](https://github.com/danielgtaylor/aglio).

Drafter is the library that takes a text in APIB format as an input and returns the parse result as a tree of
[API Elements](http://api-elements.readthedocs.io/en/latest/). Output can be serialized as YAML or as JSON.

Drafter is written in C++, and the code is pretty complicated and obscure while containing a lot of bugs and legacy.
It is understand to manage how some of its parts work. And if bug fixes are welcomed by maintainers, a new feature could become an obstacle.
Our company has a tiny percent of C++ projects, so almost none of the developers can maintain Drafter.

## Features

Crafter was created as the replacement of Drafter, written in JavaScript, and easy to maintain.
The library eliminates all previously described limitations and implements all needed features:

- Resource Prototypes is the ability to set up common responses for different resources in one place and to reuse it through the documentation.
- You can import external APIB files and split the documentation into modules. That makes documentation easy to use.
- Disabled "fixed-type" attribute of arrays. From its dawn, API Blueprint spec defines `array[SomeType]` as an array
  that MAY have nested elements of the `SomeType` type. Thus, it is not guaranteed the elements exist in fact.
  It would be more convenient to account that such array can contain ONLY elements of the `SomeType` type.
- The ability to use arrays in GET-parameters.
- The ability to describe certain data types directly as JSON Schema.
- String validations to check the expected length and match it to a regular expression.

Additional information about how the library works is placed in the [docs](docs) directory.

## Installation

Global install:

```bash
npm install -g @funbox/crafter
```

Local install:

```bash
npm install --save @funbox/crafter
```

## Usage

```javascript
const crafter = require('@funbox/crafter');
const ast = (await crafter.parseFile(file))[0].toRefract();
```

To parse a file named `doc.apib` run the next command:

```bash
crafter [options] doc.apib
```

Use `crafter -h` to list available options.

## Run tests

```bash
npm test
```

## Run in Docker

To run @funbox/crafter as a Docker container you need to execute the next command in the directory with documentation:

```bash
docker run \
  --rm \
  -v $(pwd):/app \
  funbox/crafter -f json doc-file.apib
```

You need to mount a host directory with documentation into some directory in a container and then specify the path to
the APIB file relative to the path created in the container.

The default working directory of the image is set to `/app`, therefore it may be easier to mount
a host directory into the `/app`. Then you can pass just a filename as a parameter.

### Docker container in Windows

If you run a container in Windows, you need to add slash (`/`) before `pwd`.
The command will look like this:

```bash
docker run \
  --rm \
  -v /$(pwd):/app/doc \
  funbox/crafter -f json doc/doc-file.apib
```

Moreover, you can find that the mounted directory is empty. In this case, you need to check
that your hard drive is marked as shared. This setting can be found in the settings of Docker Desktop for Windows,
Shared Drives section. If the disk is not shared, mark it as `shared`, apply changes, and restart Docker Desktop.
