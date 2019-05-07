# Changelog

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
