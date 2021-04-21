# Changelog

## 2.21.0 (21.04.2021)

* Improve detection of unrecognized nodes.

## 2.20.0 (20.04.2021)

* Create httpTransaction even if an Action block has no response.

## 2.19.0 (16.04.2021)

* Handle duplicated Default sections as unrecognized blocks.

## 2.18.0 (14.04.2021)

* Add sourceMap of httpTransaction in ActionElement;

## 2.17.1 (02.04.2021)

* Get correct source lines during the extraction of description.

## 2.17.0 (02.04.2021)

* Update gitlab-ci config.

## 2.16.6 (29.03.2021)

* Change repo links with Gitlab links.

## 2.16.5 (29.03.2021)

* Delete `no_proxy` variable.

## 2.16.4 (25.03.2021)

* Fix the situation when nullable enum attributes get overridden.

## 2.16.3 (23.03.2021)

* Setup package auto-publish.

## 2.16.2 (23.03.2021)

* Cache node_modules.

## 2.16.1 (22.03.2021)

* Disable pipeline for tags.

## 2.16.0 (19.03.2021)

* Fix parsing of invalid section Resource Group, Resource, and Action, when parser is in language server mode.

## 2.15.1 (16.03.2021)

* Correctly parse a named enum when it contains only a Default section.

## 2.15.0 (15.03.2021)

* Different improvements inspired by Jest testing report.

## 2.14.0 (15.03.2021)

* Fix unwanted indentation in nested description blocks.

## 2.13.8 (09.03.2021)

* Update usage example in README.

## 2.13.7 (04.03.2021)

* Handle unrecognized block when it comes after Import directive.

## 2.13.6 (04.03.2021)

* Fix processing multiple Default sections.

## 2.13.5 (02.03.2021)

* Remove duplicated types from getDefaultValue.

## 2.13.4 (02.03.2021)

* Handle empty titles in Resource Prototypes.

## 2.13.3 (02.03.2021)

* Fix Attributes section parsing in language server mode.

## 2.13.2 (02.03.2021)

* Fix determination of a description when element signature is incorrect in language server mode.

## 2.13.1 (02.03.2021)

* Fix Source Map of a description of ValueMemberElement that belongs to MSONNamedTypeElement.

## 2.13.0 (01.03.2021)

* Delete Drafter tests.

## 2.12.0 (26.02.2021)

* Use separate classes for byteBlock / charBlock.

## 2.11.0 (26.02.2021)

* Simplify nodeText helper.

## 2.10.0 (25.02.2021)

* Add a description to One Of elements.

## 2.9.0 (24.02.2021)

* Split utils.js into separate modules.

## 2.8.0 (15.02.2021)

* Add unrecognizedBlocks to AST.

## 2.7.0 (15.02.2021)

* Update dependencies to pass audit.

## 2.6.0 (29.01.2021)

* Check allowed attributes of an element.

## 2.5.0 (27.01.2021)

* Use unified title field for resource prototypes.

## 2.4.0 (26.01.2021)

* Add source maps for resource prototypes.

## 2.3.3 (21.01.2021)

* Fix generated schema for enums defined as a reference.

## 2.3.2 (15.01.2021)

* Process an empty node in named types.

## 2.3.1 (15.01.2021)

* Handle missing mixins inside of Attributes section when language server mode activated.

## 2.3.0 (13.01.2021)

* Add tolerate parsing mode.

## 2.2.0 (13.01.2021)

* Generate source map for nested types.

## 2.1.1 (22.12.2020)

* Fix collision of "ref" and "nullable" in JSON schema.

## 2.1.0 (10.12.2020)

* Correctly add attributes "fixed" and "fixedType" to the attributes list of the inherited element.

## 2.0.1 (25.11.2020)

* Fix message of the error caused by a wrong parameter.

## 2.0.0 (23.11.2020)

* Add the ability to redefine the function that reads an imported file.

## 1.68.1 (23.11.2020)

* Fix detection of duplicating requests.

## 1.68.0 (23.11.2020)

* Improve import errors.

## 1.67.1 (18.11.2020)

* Fix generated charBlocks when doc includes multiple files.

## 1.67.0 (06.11.2020)

* Check if resource has duplicated actions.

## 1.66.3 (06.11.2020)

* Fix typos in docs.

## 1.66.2 (23.10.2020)

* Fix processing of fixed objects inside of arrays.

## 1.66.1 (23.10.2020)

* Switch to the next node when encountering an unknown node inside of a primitive element.

## 1.66.0 (23.10.2020)

* Refactor SourceMap.

## 1.65.0 (19.10.2020)

* Process Default section in named types.

## 1.64.1 (16.10.2020)

* Fix processing of nameless endpoint resources.

## 1.64.0 (12.10.2020)

* Do not use default logger inside of Crafter.parse.

## 1.63.1 (15.09.2020)

* Improve acquiring nested types in inherited named types.

## 1.63.0 (21.07.2020)

* Improve message of the error "Type not found".

## 1.62.0 (17.07.2020)

* Improve check of MemberTypeGroup section in named types.

## 1.61.0 (15.07.2020)

* Do not use attributes validity check result as a return value.

## 1.60.0 (09.07.2020)

* Improve files description in the folder `crafter/parsers/elements`.

## 1.59.0 (09.07.2020)

* Improve documentation in the folder `crafter/docs`.

## 1.58.1 (09.07.2020)

* Fix source maps for files with no new line at the end.

## 1.58.0 (08.07.2020)

* Improve `README.md`.

## 1.57.0 (08.07.2020)

* Improve attributes overriding and precedence.

## 1.56.0 (08.07.2020)

* Check type of included mixins.

## 1.55.0 (08.07.2020)

* Add the ability to use Include in arrays and enums.

## 1.54.4 (07.07.2020)

* Call callback in Crafter.parse only once.

## 1.54.3 (22.06.2020)

* Fix imports processing inside of an imported file.

## 1.54.2 (22.06.2020)

* Fix processing of the Resource section when it comes after Resource Prototypes section.

## 1.54.1 (22.06.2020)

* Improve error handling when unknown Resource Prototype found.

## 1.54.0 (22.06.2020)

* Detect first node of the imported file.

## 1.53.0 (17.06.2020)

* Use Node.js 12.16.3 in Docker image.

## 1.52.0 (19.05.2020)

* Fix jsdoc for constructors of RequestElement and ResponseElement classes.

## 1.51.0 (19.05.2020)

* Disallow complex data types used in URI parameters.

## 1.50.0 (14.05.2020)

* Add support of recursive objects.

## 1.49.0 (13.05.2020)

* Show a warning in case of duplicated resources.

## 1.48.1 (14.04.2020)

* Delete definitions for inherited types.

## 1.48.0 (09.04.2020)

* Show a warning when arrays of objects or enums of objects have a sample.

## 1.47.2 (20.03.2020)

* Keep list indentation in a description blocks.

## 1.47.1 (26.02.2020)

* Improve JSON schemas for recursive arrays with nested elements.

## 1.47.0 (14.02.2020)

* Delete unnecessary check.

## 1.46.1 (12.02.2020)

* Refactor the titles and descriptions of variables and parameters in functions.

## 1.46.0 (31.01.2020)

* Add an information of how to debug Crafter.

## 1.45.0 (31.01.2020)

* Add a description for data structures from parsers/elements.

## 1.44.0 (28.01.2020)

* Add a comment to explain why StringElement is used as an element for description.

## 1.43.0 (28.01.2020)

* Add debug mode.

## 1.42.0 (28.01.2020)

* Add postprocessing to a ValueMemberElement object in schema.test.js.

## 1.41.0 (27.01.2020)

* Add SourceMap class.

## 1.40.0 (27.01.2020)

* Add SourceMapElementWithLineColumnInfo.

## 1.39.1 (24.01.2020)

* Fix the value type of statusCode element in ResponseElement.

## 1.39.0 (24.01.2020)

* Delete redundant type checks in splitValues and convertType.

## 1.38.0 (21.01.2020)

* Describe the process of how Markdown transforms to APIB AST.

## 1.37.0 (02.11.2019)

* Use property value as a sample if no sample provided.

## 1.36.1 (29.10.2019)

* Fix the error "Type not found" caused by parsing of "default" and "sample" attributes.

## 1.36.0 (19.10.2019)

* Add support of recursive arrays.

## 1.35.1 (17.10.2019)

* Add pretest npm task.

## 1.35.0 (14.10.2019)

* Avoid valueMemberElement object mutation in the "getSchema" method.

## 1.34.2 (07.10.2019)

* Skip attributes parsing in schema named types.

## 1.34.1 (03.10.2019)

* Fix body generation for falsy samples.

## 1.34.0 (03.10.2019)

* Build Docker image at postpublish stage.

## 1.33.0 (02.10.2019)

* Exclude tests from files to publish.

## 1.32.0 (02.10.2019)

* Add source maps to inline-defined samples.

## 1.31.4 (02.10.2019)

* Remove in-place correction of sourcepos for code_block sections.

## 1.31.3 (01.10.2019)

* Specify Crafter version in a container.

## 1.31.2 (01.10.2019)

* Use the latest Crafter version to install into a container.

## 1.31.1 (01.10.2019)

* Add a separate command to push the latest version of the image.

## 1.31.0 (01.10.2019)

* Add Dockerfile to build an image.

## 1.30.0 (30.09.2019)

* Add custom error SignatureError.

## 1.29.0 (26.09.2019)

* Use commonmark fork to correctly generate sourcepos of html comments.

## 1.28.0 (23.09.2019)

* Remove redundant copied content when inheriting one type from another type.

## 1.27.0 (18.09.2019)

* Parse "Sample" sections defined as headers.

## 1.26.0 (02.09.2019)

* Allow to use Schema-types in different sections.

## 1.25.0 (30.08.2019)

* Add the ability to get a list of files used to generate documentation.

## 1.24.4 (28.08.2019)

* Fix errors «invalid sectionType».

## 1.24.3 (22.08.2019)

* Fix parsing of imported docs with the Headers section.

## 1.24.2 (22.08.2019)

* Fix line/column info in sourcemaps of imported file.

## 1.24.1 (20.08.2019)

* Fix error «Maximum call stack size exceeded».

## 1.24.0 (15.08.2019)

* Improve merge of "items" fields in helper method mergeSchemas.

## 1.23.1 (15.08.2019)

* Fix error message when expected block not found.

## 1.23.0 (02.08.2019)

* Fix refract to conform api-elements spec.

## 1.22.0 (31.07.2019)

* Show warning when a value doesnt match an expected data type.

## 1.21.4 (31.07.2019)

* Show warning after the attempt to set an inline-value for an object.

## 1.21.3 (30.07.2019)

* Correctly detect type of inline-value of an array element.

## 1.21.2 (29.07.2019)

* Fix processing of description of URI parameters.

## 1.21.1 (29.07.2019)

* Fix Sample / Default section added to a named type.

## 1.21.0 (26.07.2019)

* Refactor getBody method.

## 1.20.0 (25.07.2019)

* Refactor Default section.

## 1.19.0 (25.07.2019)

* Refactor Samples section.

## 1.18.3 (10.07.2019)

* Fix error when incorrect MSON-attribute encountered.

## 1.18.2 (26.06.2019)

* Use "null" value for nullable enums in JSON schema.

## 1.18.1 (26.06.2019)

* Fix JSON schema for nullable enum.

## 1.18.0 (19.06.2019)

* Parse Schema Structures.

## 1.17.0 (18.06.2019)

* Add version option to cli.

## 1.16.0 (14.06.2019)

* Generate json-schema for Message sections.

## 1.15.0 (10.06.2019)

* Schema Structures section implementation.

## 1.14.5 (07.06.2019)

* Generate correct body for primitive types without samples.

## 1.14.4 (03.06.2019)

* Fix parsing of empty Body/Schema section.

## 1.14.3 (03.06.2019)

* Add correct value to schema when inheritance of named types is applied.

## 1.14.2 (03.06.2019)

* Fix generated JSON schema for complex objects with "nullable" attribute.

## 1.14.1 (31.05.2019)

* Fix refract for a title of Message section

## 1.14.0 (25.05.2019)

* Message section parsing.

## 1.13.1 (24.05.2019)

* Fix lost indentation in code_block.

## 1.13.0 (24.05.2019)

* Add installation and use info to readme.md.

## 1.12.1 (22.05.2019)

* Show a warning when Headers and Body sections have wrong indentation.

## 1.12.0 (21.05.2019)

* Add support of "minimum" and "maximum" attributes.

## 1.11.1 (20.05.2019)

* Fix parsing of URI parameters that have star symbol.

## 1.11.0 (17.05.2019)

* SubGroup section parsing.

## 1.10.2 (16.05.2019)

* Change the way how to parse signature of a Resource section.

## 1.10.1 (14.05.2019)

* Fix sourcemaps for block description with zero indentation.

## 1.10.0 (13.05.2019)

* Put errors in AST.

## 1.9.4 (07.05.2019)

* Fix parsing of a code block in a description.

## 1.9.3 (07.05.2019)

* Fix JSON schema for "fixed" and "fixed-type" elements.

## 1.9.2 (07.05.2019)

* Convert array elements that have no explicit type.

## 1.9.1 (26.04.2019)

* Copy nested elements of an enum.

## 1.9.0 (23.04.2019)

* Text blocks in description.

## 1.8.4 (23.04.2019)

* Fix transfer of the "fixed-type" attribute to nested elements.

## 1.8.3 (19.04.2019)

* Fix attributes type check when attributes are being compared.

## 1.8.2 (19.04.2019)

* Fix check of matching attributes during inheritance routine.

## 1.8.1 (18.04.2019)

* Fix processing of "Resource prototype" sections.

## 1.8.0 (18.04.2019)

* Show a warning if the actual value type of "pattern"/"format" attributes cannot be casted to string type.

## 1.7.0 (16.04.2019)

* Add warnings to AST.

## 1.6.0 (07.04.2019)

* Delete from tree "fixed-type" keyword in array element.

## 1.5.0 (05.04.2019)

* Process "format" attribute.

## 1.4.0 (03.04.2019)

* Process min-length / max-length attributes.

## 1.3.0 (30.03.2019)

* Add a description to fixtures.

## 1.2.0 (19.03.2019)

* Add support of the "pattern" attribute for string-typed elements.

## 1.1.14 (18.03.2019)

* JSON schema should consider "optional" attributes.

## 1.1.13 (13.03.2019)

* Use default values in body and JSON schema.

## 1.1.12 (07.03.2019)

* Fix generation of JSON schemas for object with "fixed" and "fixed-type" attributes.

## 1.1.11 (07.03.2019)

* Improve Default section processing.
* Add the ability to use nested Default and Sample sections in primitive types.

## 1.1.10 (07.03.2019)

* Fix attributes parsing.

## 1.1.9 (07.03.2019)

* Add a warning if action has no responses.

## 1.1.8 (06.03.2019)

* Fix processing of named primitive types.

## 1.1.7 (01.02.2019)

* Fix processing of a named endpoint.

## 1.1.6 (27.02.2019)

* Delete empty strings from source map sections.

## 1.1.5 (27.02.2019)

* Fix processing of a URI parameter with missing "+ Members".

## 1.1.4 (27.02.2019)

* Add full URI parameter signature to output.

## 1.1.3 (27.02.2019)

* Use stderr to output warnings.

## 1.1.2 (26.02.2019)

* Process nested elements of a href parameter as a description.

## 1.1.1 (22.02.2019)

* Fixed processing of empty enum values.
* Fixed parsing of a Resource Prototype section.

## 1.1.0 (21.02.2019)

* Make error message more readable when error occurs in NamedType and Attributes sections.

## 1.0.4 (20.02.2019)

* Improved conversion of values in MSON-attributes.

## 1.0.3 (16.02.2019)

* Fix body generation.

## 1.0.2 (11.02.2019)

* Fix inheritance from an empty named type.

## 1.0.1 (06.02.2019)

* Fix the Crafter.parse method when it is used along with the utils.promisify helper.

## 1.0.0 (30.01.2019)

* Process the "sample" attribute in MSON elements declaration.

## 0.13.0 (29.01.2019)

* Preprocess types.

## 0.12.1 (24.01.2019)

* Fix wrong sourcemaps from imported files.

## 0.12.0 (23.01.2019)

* Define line and current file in a warning message.

## 0.11.0 (22.01.2019)

* Generate messageBody.

## 0.10.3 (18.01.2019)

* Delete duplicated "Warning" word in a warning message.

## 0.10.2 (18.01.2019)

* JSON schema creation now correctly applies "fixed" attribute.

## 0.10.1 (10.01.2019)

* Fix description processing for requests and responses.

## 0.10.0 (09.01.2019)

* Use array's inline-defined values as array samples.

## 0.9.2 (27.12.2018)

* Fix Action section parsing when action uri is missing.

## 0.9.1 (27.12.2018)

* Add a return condition when getting a document description.

## 0.9.0 (27.12.2018)

* Parse metadata section.

## 0.8.2 (26.12.2018)

* Fix parsing of empty named types

## 0.8.1 (26.12.2018)

* Return correct nextNode from Attributes section.

## 0.8.0 (25.12.2018)

* Parse block description in arrays

## 0.7.0 (19.12.2018)

* Add tests from Drafter.

## 0.6.1 (14.12.2018)

* Fix parsing when documentation has no title.

## 0.6.0 (07.12.2018)

* Change attributes order in named types to behave more Drafter-way

## 0.5.1 (06.12.2018)

* Detect currentFile properly.

## 0.5.0 (06.12.2018)

* Parse description and properties of MSONNamedTypeElement.

## 0.4.0 (05.12.2018)

* Add warnings to SignatureParser.
* Add more tests for SignatureParser.

## 0.3.0 (03.12.2018)

* Process Schema section.

## 0.2.0 (03.12.2018)

* Add unit-tests for DataStructureProcessor.

## 0.1.2 (03.12.2018)

* Fix paths when dealing with imports

## 0.1.1 (27.11.2018)

* Fix `bin` field in package.json.

## 0.1.0 (17.11.2018)

Initial project prototype. This project builds AST in the same way as Drafter does on master branch (v4.0.0-pre.2). Currently implemented functions:

* data structures parsing;
* requests and responses parsing;
* `Resource Prototypes` parsing;
* JSON Schema parsing;
* source maps generation;
* ability to include files via `Import` keyword.

For this is the first iteration, some functions are missing, e.g. old syntax for request parameters (`+ id (number, optional, 1000) description`) and [Model](https://github.com/apiaryio/api-blueprint/blob/master/API%20Blueprint%20Specification.md#def-model-section).
