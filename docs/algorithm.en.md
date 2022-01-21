## Algorithm description

API Blueprint is based on Markdown, so when parsing the documentation, Crafter does the following:

- runs `commonmark` parser to transform a text from an APB file to Markdown AST
  (you can explore tree structure in [commonmark README](https://github.com/commonmark/commonmark.js/blob/master/README.md));
- sequentially walks the Markdown AST and creates instances of Element AST, a tree-like structure of objects, which classes are placed in the directory `parsers/elements`;
- with the help of the `toRefract()` method Crafter generates the final structure of [Refract AST](https://github.com/refractproject/refract-spec).
  Then serialized structure is emitted to a file or stdout. [API Elements](http://api-elements.readthedocs.io/en/latest/) format is based on Refract AST.

### The rationale for the transformation of Markdown AST to another format

Even though APIB is based on Markdown, these formats are different semantically.
Consider this simple example:

```markdown
# My API

# GET /foo

+ Response 200
```

From the point of view of Markdown, this document has three elements:

- the title `My API`;
- the title `GET /foo`;
- an unordered list containing one element `Response 200`.

From the point of view of APIB, this document defines an API with the title `My API`.
The API has the only method which describes a `GET` request to URL `/foo`, and the response should have HTTP Code 200.

### The role of Element AST

The attentive reader may wonder why not convert Markdown AST directly to Refract, skipping some intermediate format.
The problem is that Refract contains only the data themselves and does not contain any methods to process the data.
During the traversal of Markdown AST nodes, the result is supplemented and modified, as in the generation of JSON Schema.
To make the process of AST parsing more developer-friendly, an intermediate format was developed. To get Refract AST you need
to call `toRefract()` from the root node of Element AST. If necessary, the Element AST root node can call the method `toRefract()`
of child nodes.

As an example, parser processes the next section:

```Markdown
# GET /user

+ Response 200 (application/json)
  + Attributes
    + name (string)
    + age (number)
```

Parser had processed the response section and formed some structure based on this section.
We already have a certain result, but the type of the response is defined as `application/json`.
It means that the response should have a JSON Schema section which is absent in the raw documentation.
So the goal of the parser is to generate a JSON schema and add it to the resulted output.

## Stages of Element AST generation

The generation process starts with the call of the `parse` method of [BlueprintParser](../parsers/BlueprintParser.js)
and includes the following steps:

- imports resolving;
- types extraction;
- parsing of Markdown AST.

Let have a closer look at each of the steps.

### Imports resolving

The first step of Markdown AST parsing is to load all files, declared with `Import` keyword.
Import must be done before all next steps because imported files can define named types which are then used in other files.

The function `resolveImports` from [BlueprintParser.js](../parsers/BlueprintParser.js) manages import routine and
recursively traverse Markdown AST, finds a heading containing text like `/^[Ii]mport\s+(.+)$/`, then reads an imported file
and substitutes the heading with its content. The function also makes sure that imports don't have circular dependencies:
if a file A.apib contains `# Import B.apib` and a file B.apib contains `# Import A.apib`, an error will be thrown.

### Types extraction

Take a look at the next example:

```markdown
# My API

# Data Structures

## User

+ name: `John Smith` (string, required)
+ email: `admin@localhost` (string, required)

# GET /users

+ Response 200 (application/json)
  + Attributes (array[User])
```

In the example, we define the named type `User` and use it to describe the response to the request `GET /users`.
Parsing of the response gives us generated JSON schema and response example (Body). This means, at the moment of
parsing of `Response` section the `User` named type must be parsed and stored somewhere.

If the `Data Structures` section is higher in the documentation than `Response` section, there is no problem.
But the above example can be modified in the next way:

```markdown
# My API

# GET /users

+ Response 200 (application/json)
  + Attributes (array[User])

# Data Structures

## User

+ name: `John Smith` (string, required)
+ email: `admin@localhost` (string, required)
```

This documentation is valid and meets the API Blueprint specification, but
the `Response` section is now defined before the `User` type. Therefore, it is not
possible to generate a JSON schema because at the time of parsing the response
there is still no information about the `User` type.

To solve this problem, Crafter has preliminary extraction of named types,
also known as types preprocessing. [BlueprintParser](../parsers/BlueprintParser.js),
which is always the first to start parsing, has the method [preprocessNestedSections](../parsers/BlueprintParser.js#132) to perform such extraction.

The extraction completes in two steps:

1) extraction of type names and their base types;
2) extraction of types content.

To understand why we cannot extract both type and its content, we need to introduce two concepts:

1) parent type is the type from which the current type inherits;
2) base type is the root type of inheritance chain (object, array, enum, string,
   number, boolean).

Content of the current type is interpreted and filled differently depending on the base type.
For example:

```markdown
# Data Structures

## Type1 (array)

+ foo

## Type2 (object)

+ foo
```

For the type `Type1` the line `+ foo` means that the array can contain string elements,
such as `foo` string. For the `Type2` the line `+ foo` means that the object can contain
the `foo` field of the string type.

Sometimes it is easy to determine a base type. In such example:

```markdown
# Data Structures

## User

+ name: `John Smith` (string, required)
+ email: `admin@localhost` (string, required)
```

it is obvious that the base type of the `User` type is object (due to specification which declares
that the default type of a named type is object if no explicit type provided).
But sometimes it can be hard to determine a base type.

In such description:

```markdown
# Data Structures

## Admin (User)

+ permissions

## User

+ name: `John Smith` (string, required)
+ email: `admin@localhost` (string, required)
```

it is impossible to determine the base type of the `Admin` type until
the parent type `User` is parsed.

To solve this problem Crafter sets the variable `context.typeExtractingInProgress` to `true`
and starts [partial parsing of Markdown AST](../parsers/BlueprintParser.js#154-179).
"Partial" means that only `Data Structures` and `Schema Structures` are being parsed.
Blueprint parser extracts names and base types of defined named types and puts them in the
`context`.

After that the variable `context.typeExtractingInProgress` sets back to `false`
and the second [partial parsing of Markdown AST](../parsers/BlueprintParser.js#183-191) occurs,
during which the processor grabs the content of named types.

After the extraction, types must be checked in the function [context.typeResolver.resolveRegisteredTypes()](../TypeResolver.js#16)) which includes:

- a check that all used types are defined. Thus, if a type `A` inherits from a type `B`, the `B` type must be defined;
- a check that circular dependencies are valid. In some cases, circular dependencies are not applicable.

### Markdown AST parsing

The core functionality of Crafter is a set of parsers located in the directory [parsers](../parsers).
A general parser has the main method `parse(node, context)` which accepts a node of Markdown AST
and the context, and returns an array with two elements: the next node to parse and a parsing result.

Most of declared parsers extend from the [AbstractParser](../parsers/AbstractParser.js)
and override some of its methods. Typical APIB section (Request, Response, Attributes, etc)
consists of the following elements:

- signature — the first row that defines a section beginning and may contain additional info;
- description — an optional block of text description;
- nestedSections — other sections that can be included in the current section.

Consider the example:

```markdown
+ Response 200 (application/json)
  Abstract server response

  + Attributes
    + status: `ok` (required, fixed)
    + users (array)
```

There the `Response` block consists of:

- `+ Response 200 (application/json)` — signature;
- `Abstract server response` — description;
- other lines — nestedSections.

At the same time, inside of nested section the `Attributes` section exists in which:

- `+ Attributes` — signature;
- other lines — nestedSections.

`parse` method (see [AbstractParser.parse](../parsers/AbstractParser.js#7))
implements the next algorithm:

- parse a signature in the `processSignature` method;
- parse a description in the processDescription` method;
- parse nested sections in the `processNestedSection` method:
  - determine if the next node can be nested, using the `nestedSectionType` method;
  - if the next node is a nested section, parse it in the `processNestedSection` method
- call the `finalize` method to perform actions that should be done after the section parsing.
  For example, in the `ResponseParser` the [finalize](../parsers/ResponseParser.js#117) method
  generates a JSON schema and a sample of the response.

### JSON Schema generation

Generation of a JSON Schema for Request and Response sections is one of the steps of Markdown AST parsing.
This generation happens when two conditions are met:

- `content-type` is set to `application/json` (as in `+ Response 200 (application/json)`);
- a custom JSON Schema is not defined.

To generate a JSON Schema the method `finalize` of parsers [RequestParser](../parsers/RequestParser.js)
and [ResponseParser](../parsers/ResponseParser.js) calls the method `getSchema` of elements
[RequestElement](../parsers/elements/RequestElement.js) and [ResponseElement](../parsers/elements/ResponseElement.js). This method recursively calls similar methods of child elements
to form the resulting JSON schema. To support recursive data structures `getSchema` methods return an array
with two elements:

- the result of JSON schema building;
- a list of used named types to be included in the `definitions` section. This section appears in the
  [AttributesElement](../parsers/AttributesElement.js)

### Body generation (an example of request/response)

Generation of a Body for Request and Response sections is one of the steps of Markdown AST parsing.
This generation happens when two conditions are met:

- `content-type` is set to `application/json` (as in `+ Response 200 (application/json)`);
- a custom Body is not defined.

To generate a Body the method `finalize` of parsers [RequestParser](../parsers/RequestParser.js)
and [ResponseParser](../parsers/ResponseParser.js) calls the method `getBody` of elements
[RequestElement](../parsers/elements/RequestElement.js) and [ResponseElement](../parsers/elements/ResponseElement.js). This method recursively calls similar methods of child elements
to form the resulting Body.
