## Crafter debugging

During code writing, any developer most likely will be meeting errors of any sort, which must be identified and fixed. There are many different ways of doing it. The most common are using a logger or a debugger.

Logging supposes that different parts of a program include `console.log` instructions, which can help a developer to understand what state the program has at a particular point in time.

A debugger is a tool that is typically used to halt the execution of the program, examine the values of variables, execute the program step by step and line by line.

Further in the text it is assumed that a developer uses [WebStorm](https://www.jetbrains.com/webstorm/) IDE.
Other development environments (VS Code, Sublime Text, Vim, etc) definitely have similar debugging solutions
but their consideration is beyond the scope of this document. A guide to Node.js app debugging in WebStorm can
be found in [the official documentation](https://www.jetbrains.com/help/webstorm/running-and-debugging-node-js.html).

An error can be related to one of the two groups:

- a JavaScript error;
- a mismatch between expected and actual results.

Let's take a look at each of the groups.

### JavaScript errors

Javascript errors can be recognized by such messages as `undefined is not a function`,
`cannot read property of undefined` and similar to them. Due to the specificity of Javascript,
you can always track from where the particular error comes. To do that, you need to run Crafter with
the `-d` option, this enables a debugging mode. If debugging mode is enabled and an error is thrown,
Crafter will exit with a stack trace printed. To know where an error occurs is the first step to know
how to fix it.

For example, in the case of the error `cannot read property of undefined`, there is possibly an attempt to call a method on an object that is undefined. Maybe some function returned `null` or `undefined`
or no value was assigned to an object in some `if` section or a `for` loop.

When a JavaScript error occurs, a debugger can be a helping hand. A breakpoint should be set just above the place where an error occurred to give a developer the ability to watch values of local variables or to execute a program step by step so that the developer can eliminate the error.

### A mismatch between expected and actual results

Another type of error is the situation when no Javascript error is present, but the result
of the parsing is completely different from the result expected by a developer. Here is the list of possible reasons:

- one of the sections was not recognized, so Crafter has to skip it. Probably, the message `Ignoring unrecognized block` will be in the output;
- a section was recognized as a description, not as a content section. Such section will likely  have a `copy` block in the result;
- a section was incorrectly recognized. As a result, the section will have an invalid type. For example, the type will be `httpTransaction` instead of `dataStructure`.
- a JSON schema is missing, invalid or does not look as expected.

Unlike JavaScript errors, in the case of logical errors, it is not obvious where to start debugging.
Debugging large documentation could be unhandy, so it is important to provide a minimal reproducible example. An example can be prepared by sequential deletion of blocks that are not related to the error.
Bisection method can also be used: delete half of the sections, then check if the error still exists. If it does exist, delete half of the remaining blocks. If not, restore deleted blocks and delete the other half.

After an example is prepared, you can now begin to search and fix errors.

#### An unrecognized section

Each section in Crafter is handled by its own parser from the `parsers` directory.
Each parser implements the next algorithm (see also [algorithm.md](algorithm.md))):

- parse a signature;
- parse a description;
- parse nested sections.

Nested sections are parsed in a next way:

- call the `nestedSectionType` method;
- if the method returned a defined value (not-`undefined`), run `processNestedSection`;
- if the method returned an undefined value, check if the section is valid by calling the `isUnexpectedNode` method. If the section is not valid, skip it.

If a section is not recognized, it means that one of the parsers returned `undefined` from the `nestedSectionType` method. To manage how it happens, set a breakpoint in the `processNestedSections` method of [AbstractParser.js](../parsers/AbstractParser.js) in a place where a warning about an unrecognized section appears. It can help to understand which parser tries to process a section:

![search for a signature](search-for-signature.png)

After that, you can explore the `nestedSectionType` method of the target parser to understand what is wrong.

#### A section is recognized as a description

Most of the parsers use the function `processDescription` from the [AbstractParser](../parsers/AbstractParser.js) to parse a description. To understand why a section is parsed as a description, it is recommended to add a breakpoint into this function and run the parser in debugging mode. In some cases, it might be not Crafter's fault, but invalid documentation.

In the next example, the whole section will be parsed as a description because of the missing empty line after the `+ Body` keyword:

```markdown
+ Body 
            Hello world
```

#### A section is recognized incorrectly

To understand why a section can be incorrectly parsed, you need to determine what piece of code breaks the process. Add a breakpoint to the [BlueprintParser](../parsers/BlueprintParser.js) at the end of the `parse` method and check the resulting AST. After that, try to find an invalid section, detect a corresponding parser, add a breakpoint to the parser and find out why the section is parsed incorrectly.

Common reasons for an error of this type:

- a part of a section is parsed as a description, and the parser tries to parse the rest of the section from the middle;
- there might be a typo in a `processNestedSection` function.

#### JSON Schema issues

To generate a JSON schema recursive function `getSchema` is called in the `finalize` function in
[ResponseParser](../parsers/ResponseParser.js) and [RequestParser](../parsers/RequestParser.js), therefore,
in case of any bugs, you need to set an initial breakpoint in the `finalize` function and then go deeper.

It is important to notice that no schema will be generated automatically if
a `Request` element or a `Response` element has its own nested `Schema` section.

#### Body issues

To generate a JSON schema recursive function `getBody` is called in the `finalize` function in
[ResponseParser](../parsers/ResponseParser.js) and [RequestParser](../parsers/RequestParser.js), therefore,
in case of any bugs, you need to set an initial breakpoint in the `finalize` function and then go deeper.

It is important to notice that no schema will be generated automatically if
a `Request` element or a `Response` element has its own nested `Body` section.

### Tests

When bugfix is accomplished, a test should be added to make sure that an error will not appear again.
A new test should be placed in the directory `tests/fixtures`, then run `npm run regenerate-fixtures`.
This script generates JSON files that act as a model to compare with an actual result.
If some other JSON files changed after regeneration, that change must be validated manually to prevent regression.
