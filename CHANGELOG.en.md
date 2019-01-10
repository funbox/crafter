# Changelog

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
