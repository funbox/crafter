# @funbox/crafter

## Мотивация

В нашей компании разрабатывается большое количество JSON API, которые необходимо согласовывать,
описывать, отслеживать изменения и показывать удобную документацию большому кругу лиц. Поэтому
возникает необходимость удобных формата и средства для работы с документацией. Исторически в
компании происходил выбор между [API Blueprint](https://apiblueprint.org/) и
[Swagger](https://swagger.io/). Предпочтение было отдано первому по нескольким причинам. Во-первых,
исходный код документации, описанной с помощью API Blueprint, проще воспринимается человеком.
Во-вторых, на момент исследования в Swagger не хватало ряда важных возможностей (например, One Of).

API Blueprint состоит из двух частей: парсер формата apib
[Drafter](https://github.com/apiaryio/drafter) и рендерер HTML-версии документации —
[aglio](https://github.com/danielgtaylor/aglio).

Drafter — это библиотека, которая получает на вход текст в формате apib и возвращает распарсенное
дерево в формате [API Elements](http://api-elements.readthedocs.io/en/latest/) в виде YAML/JSON.
Drafter реализован на языке программирования C++. Код библиотеки достаточно сложный и грязный,
содержит много багов и легаси. Разобраться, как работает тот или иной блок, очень сложно. Если
исправление багов разработчики принимают охотно, то при попытке добавить новую фичу можно сильно
забуксовать и потратить очень большое количество времени на обсуждение (и в итоге фичу так и не
примут). В нашей компании практически нет проектов на C++, поэтому разработчиков, которые могут
поддерживать Drafter, очень мало, при этом необходимость в новых фичах возникает регулярно.

## Описание

Библиотека **Crafter** — это замена Drafter, написанная на JavaScript, благодаря чему её легче
поддерживать. Библиотека устраняет описанные выше недостатки оригинала и реализует все необходимые
возможности:

* Resource Prototypes — возможность задать общие ответы для разных ресурсов в одном месте и
    переиспользовать их во всей документации;
* Подключение внешних apib-файлов, чтобы документация была модульной и более простой в
    использовании;
* Отключение fixed-type для массивов (в API Blueprint исторически сложилось, что описание типа как
    `array[SomeType]` значит, что в массиве могут быть элементы типа SomeType, а могут и не быть;
    более удобно, если такое описание значило бы, что в массиве должны быть только элементы типа
    SomeType);
* Возможность использовать массивы в GET-параметрах;
* Описание некоторых типов данных напрямую в JSON Schema;
* Валидации (длина строки, соответствие регулярному выражению).

## Установка

Глобально:
```
npm install -g @funbox/crafter
```

Локально в проект:
```
npm install --save @funbox/crafter
```

## Использование

```javascript
const crafter = require('@funbox/crafter');
const ast = Crafter.parseFileSync(file, {}).toRefract();
```

Для парсинга из файла документации doc.apib требуется выполнить следующую команду:

```
crafter [options] doc.apib
```

Доступные команды можно посмотреть через ```crafter -h```.


## Запуск тестов

```
npm test
```

## Использование через Docker

Для использования @funbox/crafter в Docker-контейнере нужно выполнить следующую команду в директории
с вашей apib-документацией:

```
docker run \
  --rm \
  -v $(pwd):/app \
  funbox/crafter -f json файл-с-документацией.apib
```

При запуске контейнера необходимо примонтировать хост-директорию с документацией в некоторую
директорию в контейнере,
и затем указать путь к apib-файлу относительно созданного в контейнере пути.

По умолчанию рабочей директорией образа задана директория `/app`, поэтому удобнее всего смонтировать
хост-директорию непосредственно
в `/app`. Тогда в качестве параметра можно передать просто название файла
`файл-с-документацией.apib`.

### Использование Docker-контейнера в Windows

При запуске контейнера в Windows нужно добавлять слэш (`/`) перед вызовом `pwd`. Таким образом,
команда будет выглядеть так:

```
docker run \
  --rm \
  -v /$(pwd):/app/doc \
  funbox/crafter -f json doc/файл-с-документацией.apib
```

Кроме того, примонтированная директория может быть пустой. Если это так, то убедитесь, что в
настройках Docker Desktop for Windows,
в разделе Shared Drives включен шаринг нужного диска (стоит галка).
Если диск не расшарен, необходимо отметить его как shared, применить изменения и перезапустить
Docker Desktop.

