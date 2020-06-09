## Алгоритм работы

API Blueprint основан на Markdown, поэтому при разборе документации Crafter
поступает следующим образом:

- запускает парсер `commonmark` для преобразования текста APIB-файла в Markdown
  AST (структуру элементов дерева можно посмотреть в
  [README проекта commonmark](https://github.com/commonmark/commonmark.js/blob/master/README.md));
- последовательно обходит Markdown AST и формирует Element AST, древовидную
  структуру из объектов, классы которых расположены в каталоге
  `parsers/elements`;
- с помощью метода `toRefract()` корневого элемента дерева получает финальную
  структуру [Refract AST](https://github.com/refractproject/refract-spec),
  которую сериализует в файл или stdout. На ее основе построен формат
  [API Elements](http://api-elements.readthedocs.io/en/latest/).

### Необходимость преобразования Markdown AST в другой формат

Хотя APIB основан на Markdown, данные форматы имеют совершенно разную семантику.
Рассмотрим простой пример:

```markdown
# My API

# GET /foo

+ Response 200
```

С точки зрения Markdown в этом документе есть три элемента:

- заголовок `My API`;
- заголовок `GET /foo`;
- ненумерованный список, содержащий один элемент `Response 200`.

С точки зрения APIB этот документ определяет API с названием `My API`. Внутри
API есть единственный метод, описывающий запрос типа `GET` на URL `/foo`. В
документации сказано, что сервер может вернуть ответ с HTTP Code 200.

### Роль Element AST

У внимательного читателя может возникнуть вопрос, почему не преобразовывать
Markdown AST напрямую в Refract, минуя какой-то промежуточный формат. Refract —
формат, содержащий только данные, причем часто в достаточно обобщенном виде, но
не методы работы с ними. В процессе разбора узлов Markdown AST результат
дополняется и модифицируется, например при генерации JSON Schema. Для более
удобной работы с AST в процессе разбора был разработан промежуточный формат
Element AST. Чтобы получить Refract AST из Element AST, используется метод
`toRefract()`, который вызывается у корневого узла Refract AST. При
необходимости узел Element AST может вызывать метод `toRefract()` дочерних
узлов.

Например, парсер обрабатывает секцию вида:

```Markdown
# GET /user

+ Response 200 (application/json)
  + Attributes
    + name (string)
    + age (number)
```

Парсер разобрал секцию ответа и сформировал на основе этой секции какую-то
структуру в Element AST (т. е. некоторый результат уже получен). Но так как тип
ответа указан как `application/json`, то предполагается, что у описываемого
ответа должна быть секция JSON Schema. Этой секции в явном виде нет, поэтому
парсер генерирует ее автоматически и подставляет в результат, тем самым
модифицируя его.

## Этапы формирования Element AST

Процесс формирования Element AST начинается с вызова метода `parse` у
[BlueprintParser](../parsers/BlueprintParser.js) и состоит из следующих этапов:

- резолвинг импортов;
- извлечение типов;
- разбор Markdown AST.

Рассмотрим каждый из них поподробнее.

### Резолвинг импортов

Первый шаг разбора Markdown AST — загрузка файлов, подключаемых с помощью
команды `Import`. Данную операцию необходимо сделать до того, как происходят
следующие шаги, потому что в подключаемых файлах могут быть определены
именованные типы данных, используемые в других файлах.

За резолвинг импортов отвечает функция `resolveImports` из файла
[BlueprintParser.js](../parsers/BlueprintParser.js), которая производит
рекурсивный обход Markdown AST, находит заголовки, содержащие текст вида
`/^[Ii]mport\s+(.+)$/`, читает подключаемый файл и заменяет заголовок его
содержимым. Во время работы функция проверяет импорты на отсутствие циклов: если
в файле A.apib написано `# Import B.apib`, а в файле B.apib написано
`# Import A.apib`, будет сгенерирована ошибка.

### Извлечение типов

Рассмотрим пример документации:

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

В данном примере при описании ответа на запрос `GET /users` используется
именованный тип `User`, определенный выше. При разборе ответа будет
сгенерирована JSON Schema и пример ответа (Body), поэтому к моменту разбора
секции `Response` именованный тип `User` должен быть разобран и сохранен в
некотором хранилище. Если секция `Data Structures` находится в документации
выше, чем `Response`, то никаких проблем не возникает. Однако описанный выше
пример можно модифицировать следующим образом:

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

Этот вариант написания документации тоже корректный с точки зрения спецификации
API Blueprint, но, в отличие от предыдущего, секция `Response` расположена выше
описания именованного типа `User`, поэтому сформировать JSON Schema не
представляется возможным в процессе последовательного разбора документации, так
как на момент разбора ответа информации об именованном типе еще нет.

Чтобы решить данную проблему, в Crafter реализовано предварительное извлечение
именованных типов, также известное как препроцессинг типов. У
[BlueprintParser](../parsers/BlueprintParser.js), который всегда начинает разбор
Markdown AST, имеется метод
[preprocessNestedSections](../parsers/BlueprintParser.js#132), в котором и
реализовано извлечение именованных типов. Оно проходит в два этапа:

- извлечение названий типов и их базовых типов;
- извлечение содержимого типов.

Почему нельзя извлечь тип сразу с содержимым?

Определим два понятия:

- родительский тип — тип, от которого наследуется текущий;
- базовый тип — корневой тип цепочки наследования (object, array, enum, string,
  number, boolean).

В зависимости от базового типа для текущего обрабатываемого типа содержимое
интерпретируется и заполняется по-разному. Например:

```markdown
# Data Structures

## Type1 (array)

+ foo

## Type2 (object)

+ foo
```

Для типа `Type1` строка `+ foo` означает, что массив может содержать элементы
строкового типа и пример такого элемента — строка `foo`. Для типа `Type2` строка
`+ foo` означает, что объект может содержать строковое поле `foo` без примера.

Иногда определить базовый тип легко. Например, при таком описании:

```markdown
# Data Structures

## User

+ name: `John Smith` (string, required)
+ email: `admin@localhost` (string, required)
```

очевидно, что базовый тип для типа `User` — объект (согласно спецификации API
Blueprint если не указан родительский тип для именованного типа, считается, что
он — объект). Но так как API Blueprint поддерживает возможность наследования, то
понять, какой базовый тип у текущего типа, можно далеко не всегда. Например, при
таком описании:

```markdown
# Data Structures

## Admin (User)

+ permissions

## User

+ name: `John Smith` (string, required)
+ email: `admin@localhost` (string, required)
```

невозможно определить базовый тип для типа `Admin` до тех пор, пока не будет
разобран родительский тип `User`. Для решения этой проблемы в Crafter
выставляется переменная `context.typeExtractingInProgress` и запускается
[частичный обход Markdown AST](../parsers/BlueprintParser.js#154-179)
(разбираются не все секции, а только `Data Structures` и `Schema Structures`).
При этом для именованных типов извлекаются названия и базовые типы, которые
помещаются в `context` с помощью функции `context.addType`.

После этого переменная `context.typeExtractingInProgress` устанавливается в
`false` и происходит
[повторный частичный обход Markdown AST](../parsers/BlueprintParser.js#183-191),
в процессе которого уже разбирается содержимое именованных типов.

После того, как типы извлечены, происходит проверка корректности (функция
[context.typeResolver.resolveRegisteredTypes()](../TypeResolver.js#16)), которая
включает:

- проверку что все используемые типы определены. Например, если тип `A`
  наследуется от типа `B`, то проверяется, что тип `B` определен;
- проверку корректности циклических зависимостей. В некоторых случаях
  циклические зависимости недопустимы.

### Разбор Markdown AST

Основной код Crafter — это набор объектов-парсеров, расположенных в директории
[parsers](../parsers). Типичный парсер имеет главный метод
`parse(node, context)`, который принимает на вход узел Markdown AST и контекст с
вспомогательными данными и возвращает массив из двух элементов: следующий узел,
который необходимо разработать, и результат обработки.

Так как метод `parse` достаточно общий, чаще всего парсеры наследуются от
объекта [AbstractParser](../parsers/AbstractParser.js) и переопределяют ряд
более специфичных методов. Типичная APIB-секция (Request, Response, Attributes и
т.п.) состоит из следующих элементов:

- signature — первая строка, которая определяет начало секции и может содержать
  дополнительную информацию;
- description — опциональный блок текстового описания;
- nestedSections — вложенные секции.

Рассмотрим пример:

```markdown
+ Response 200 (application/json)
  Типичный ответ сервера

  + Attributes
    + status: `ok` (required, fixed)
    + users (array)
```

Здесь для блока `Response`:

- `+ Respons 200 (application/json)` — signature;
- `Типичный ответ сервера` — description;
- все остальные строки — nestedSections.

При этом внутри nestedSections есть секция `Attributes`, для которой:

- `+ Attributes` — signature;
- остальные строки — nestedSections.

Алгоритм работы метода `parse` (см.
[AbstractParser.parse](../parsers/AbstractParser.js#7)) следующий:

- разобрать signature с помощью метода `processSignature`;
- разобрать description с помощью метода `processDescription`;
- разобрать nestedSections с помощью метода `processNestedSection`:
  - определить, является ли следующий узел nestedSection, с помощью метода
    `nestedSectionType`;
  - если следующий узел является nestedSection, то обработать его с помощью
    метода `processNestedSection` (внутри этого метода обычно задействуются
    другие парсеры, например см.
    [ResponseParser.processNestedSection](../parsers/ResponseParser.js#95));
- вызвать метод `finalize` для действий, которые нужно выполнить после обработки
  секции, например для `ResponseParser` метод
  [finalize](../parsers/ResponseParser.js#117) производит генерацию JSON Schema
  и примера ответа.

### Генерация JSON Schema

Одним из этапов разбора Markdown AST является генерация JSON Schema для секций
Request и Response, если выполняются два условия:

- указан `content-type: application/json`, например так:
  `+ Response 200 (application/json)`;
- JSON Schema не объявлена вручную с помощью секции Schema.

Для генерации JSON Schema в методе `finalize` парсеров
[RequestParser](../parsers/RequestParser.js) и
[ResponseParser](../parsers/ResponseParser.js) вызывается метод `getSchema` у
элементов типа [RequestElement](../parsers/elements/RequestElement.js) и
[ResponseElement](../parsers/elements/ResponseElement.js) соответственно. Данный
метод рекурсивно вызывает одноименные методы у дочерних элементов и формирует
итоговую JSON Schema. Для обеспечения поддержки рекурсивных структур данных
метод `getSchema` возвращает массив из двух элементов:

- результата построения JSON Schema;
- списка используемых именованных типов, которые должны попасть в секцию
  `definitions`. Построение секции `definitions` происходит в
  [AttributesElement](../parsers/AttributesElement.js).

### Генерация Body (примера запроса/ответа)

Одним из этапов разбора Markdown AST является генерация Body для секций Request
и Response, если выполняются два условия:

- указан `content-type: application/json`, например так:
  `+ Response 200 (application/json)`;
- пример не объявлен вручную с помощью секции Body.

Для генерации Body в методе `finalize` парсеров
[RequestParser](../parsers/RequestParser.js) и
[ResponseParser](../parsers/ResponseParser.js) вызывается метод `getBody` у
элемента типа [RequestElement](../parsers/elements/RequestElement.js) и
[ResponseElement](../parsers/elements/ResponseElement.js) соответственно. Данный
метод рекурсивно вызывает одноименные методы у дочерних элементов и формирует
итоговую секцию Body.
