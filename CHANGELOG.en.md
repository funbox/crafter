# Changelog

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
