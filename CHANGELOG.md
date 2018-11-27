# История изменений проекта

## 0.1.1 (27.11.2018)

* Исправление поля bin в package.json.

## 0.1.0 (17.11.2018)

Начальный прототип проекта. Проект строит AST так же, как это делает Drafter в ветке master (v4.0.0-pre.2). Реализованы следующие функции:

* парсинг структур данных;
* парсинг запросов, ответов;
* парсинг `Resource Prototypes`;
* генерация JSON Schema;
* генерация Source Maps;
* подключение других файлов через `Import`.

В рамках начального прототипа не реализованы такие функции, как старый синтаксис параметров запроса (`+ id (number, optional, 1000) description`) и [Model](https://github.com/apiaryio/api-blueprint/blob/master/API%20Blueprint%20Specification.md#def-model-section).
