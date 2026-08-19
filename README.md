# UniversalDataTable

Універсальний компонент таблиці даних на базі **Vue 3 + PrimeVue**. Працює як окремий бандл для Yii2 / Laravel / звичайного HTML (подія `datatable:setConfig`) і як бібліотека для React (`mountUniversalTable`).

Підтримує серверну та клієнтську пагінацію, фільтрацію, сортування, керування видимістю колонок, збереження стану в `localStorage` і клієнтський експорт у **xlsx / csv** (з розбиттям на ZIP).

---

## Ключові можливості

- Два режими: серверний (`paginationMode: 'server'`) і клієнтський (`paginationMode: 'client'`)
- Фільтри: `text` / `string` / `varchar`, `integer`, `select`, `multiselect`, `select-with-other`, `date`, `date_range`, `year`, `range`
- Панель застосованих фільтрів (чіпи з можливістю зняти один або всі)
- Фільтри в тулбарі (`inToolbar`) і ширина комірки фільтра (`colSpan`)
- Обчислювані колонки (`type: 'computed'`) і кастомний HTML-рендер (`value`)
- Верхній і нижній кастомні скролбари з синхронізацією
- Повне збереження стану таблиці в `localStorage`
- Експорт у XLSX / CSV (UTF-8 BOM) з пагінацією `limit` / `offset` і ZIP при великому обсязі
- Додаткові параметри запиту (`requestParams`) — мерджаться у `filters`
- Програмне керування: `datatable:setConfig`, `datatable:setFilter`, `datatable:dataLoaded`
- Авторизація: Bearer з `localStorage.authKey` і CSRF з `<meta name="csrf-token">`
- Українська локалізація PrimeVue і кастомна тема Aura
- Збірка для Vue (IIFE) і для React (ES + UMD)
- TypeScript-дженерики (`TRow`) для колонок і рядків

---

## Зміст

- [Режими роботи таблиці](#режими-роботи-таблиці)
- [Встановлення та збірка](#встановлення-та-збірка)
- [Структура файлів](#структура-файлів)
- [Підключення](#підключення)
- [Конфігурація](#конфігурація)
- [Колонки](#колонки)
- [Фільтри](#фільтри)
- [Типи колонок з прикладами](#типи-колонок-з-прикладами)
- [Типи фільтрів з прикладами](#типи-фільтрів-з-прикладами)
- [Події](#події)
- [API сервера](#api-сервера)
- [Експорт](#експорт)
- [Повний приклад ініціалізації](#повний-приклад-ініціалізації)
- [Збереження стану](#збереження-стану)
- [Авторизація запитів](#авторизація-запитів)
- [Кастомна тема](#кастомна-тема)
- [CSS-класи](#css-класи)
- [Важливі особливості та обмеження](#важливі-особливості-та-обмеження)

---

## Режими роботи таблиці

Режим задається параметром `paginationMode`.

### 1. Серверний режим (`paginationMode: 'server'`) — за замовчуванням

При кожній зміні сторінки, сортування або фільтра виконується `POST` на `requestUrl`. Сервер повертає лише поточну сторінку.

Підходить для великих таблиць (тисячі рядків і більше). Текстові та числові фільтри мають debounce **500 мс**.

### 2. Клієнтський режим (`paginationMode: 'client'`)

При ініціалізації виконується один запит без `pager`. Далі фільтрація, глобальний пошук, сортування і пагінація працюють на клієнті.

**Особливості:**

- Над панеллю фільтрів з’являється глобальний пошук по видимих колонках (колонка `actions` ігнорується)
- Фільтри застосовуються миттєво, без debounce
- При зміні фільтрів або глобального пошуку пагінатор скидається на першу сторінку
- Експорт завжди йде на сервер (`{requestUrl}-export`) з поточними фільтрами — це **не** клієнтський дамп уже завантажених рядків

**Коли доцільно:** таблиці приблизно до 2000 рядків, часта зміна фільтрів, дані рідко оновлюються на сервері.

---

## Встановлення та збірка

Потрібен **Node.js** `^20.19.0` або `>=22.12.0`.

```bash
npm install
```

Залежності рантайму: `vue`, `primevue`, `@primevue/themes`, `primeicons`, `xlsx`, `jszip`.

| Скрипт | Що робить |
|--------|-----------|
| `npm run dev` | Збірка Vue-бандла без мініфікації, із sourcemap |
| `npm run build` / `npm run build:vue` | Мініфікований Vue-бандл (`dist/js/prime-datatable.js`, `dist/css/prime-datatable.css`) |
| `npm run build:react` | React-бібліотека ES + UMD (`dist/js/prime-datatable-react.es.js`, `prime-datatable-react.umd.js`, `dist/css/prime-datatable-react.css`) |
| `npm run build:all` | Спочатку Vue (чистить `dist`), потім React (не затирає Vue-артефакти) |
| `npm run lint` / `npm run lint:fix` | ESLint |

> Vue-збірка чистить `dist` (`emptyOutDir: true`). React-збірка — ні. Тому `build:all` треба запускати саме в такому порядку.

---

## Структура файлів

```text
src/
  main.js                      # Vue-бандл: слухає datatable:setConfig і монтує #datatable
  entry-react.ts               # React-бандл: mountUniversalTable / unmountUniversalTable
  components/
    UniversalDataTable.vue     # UI таблиці
    types.ts                   # ColumnConfig, FilterConfig, TableConfig, …
    index.ts                   # реекспорт компонента і типів
    composables/
      useTableData.ts          # завантаження рядків
      useClientFilters.ts      # клієнтська фільтрація, чіпи
      useExport.ts             # xlsx / csv / zip
      useTableStorage.ts       # localStorage
      useScrollSync.ts         # синхронізація скролбарів
    utils/
      filters.ts               # normalizeFilterOptions, getCleanedFilters
      auth.ts                  # Bearer + CSRF
      cell.ts                  # stripHtml, getCellText
      date.ts                  # форматування дат
    constants/
      icons.ts
```

У HTML для Vue-бандла потрібен контейнер:

```html
<div id="datatable"></div>
```

---

## Підключення

### Vue / Yii2 / Laravel / звичайний JS

Компонент ініціалізується подією `datatable:setConfig`. Точка входу — `src/main.js`: вона створює Vue-додаток, підключає PrimeVue (українська локаль + кастомна Aura) і монтує таблицю в `#datatable`.

```js
document.addEventListener('DOMContentLoaded', () => {
  document.dispatchEvent(new CustomEvent('datatable:setConfig', {
    detail: {
      requestUrl: '/api/v1/users/list',
      storageKey: 'users_list',
      columns,
      filters,
      order: { id: 'desc' },
      showDownload: true,
      showColumnsButton: true,
      filtersExpanded: true,
      rowsPerPageOptions: [10, 25, 50, 100],
      scrollable: true,
      downloadFilename: 'users_export',
      downloadFormat: 'xlsx',
      paginationMode: 'server', // або 'client'
      requestParams: {},
      maxRowsPerFile: 30000,
    },
  }));
});
```

Можна також покласти конфіг у `window.datatableConfig` до монтування — компонент підхопить його в `onMounted`.

### React

Точка входу — `src/entry-react.ts`. Експортуються:

| Функція | Опис |
|---------|------|
| `mountUniversalTable(container, config)` | Монтує таблицю в DOM-елемент або CSS-селектор, повертає `instanceId` |
| `unmountUniversalTable(instanceId)` | Розмонтовує один інстанс |
| `unmountAllUniversalTables()` | Розмонтовує всі інстанси |

Повторний `mount` у той самий контейнер спочатку знімає попередній інстанс.

```js
import {
  mountUniversalTable,
  unmountUniversalTable,
} from './prime-datatable-react.es.js';

const instanceId = mountUniversalTable('#datatable', {
  requestUrl: '/api/v1/registry/parties/api/list',
  storageKey: 'my-test-table',
  columns: [
    { name: 'edrpou_code', title: 'Код ЄДРПОУ', visible: true, sortable: true },
    { name: 'name_edr', title: 'Назва ЮО', visible: true, sortable: true },
  ],
  filters: [
    { name: 'edrpou_code', type: 'string', title: 'Код ЄДРПОУ', visible: true },
    { name: 'name_edr', type: 'string', title: 'Назва ЮО', visible: true },
  ],
  showDownload: true,
  scrollable: true,
  filtersExpanded: false,
  downloadFormat: 'csv',
  downloadFilename: 'party_registry_export',
  maxRowsPerFile: 30000,
});
```

Приклад обгортки в Next.js / React:

```tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  mountUniversalTable,
  unmountUniversalTable,
} from 'yii-datatable/prime-datatable-react.es.js';

export default function PartiesTable() {
  const rootRef = useRef(null);
  const instanceIdRef = useRef('');

  const config = useMemo(() => ({
    requestUrl: '/api/v1/registry/parties/api/list',
    storageKey: 'my-test-table',
    columns: [
      { name: 'edrpou_code', title: 'Код ЄДРПОУ', sortable: true },
      { name: 'name_edr', title: 'Назва ЮО (ЄДР ЮО)', sortable: true },
    ],
    filters: [
      { name: 'edrpou_code', type: 'string', title: 'Код ЄДРПОУ' },
      { name: 'name_edr', type: 'string', title: 'Назва ЮО (ЄДР ЮО)' },
    ],
    paginationMode: 'server',
    showDownload: false,
    scrollable: true,
    filtersExpanded: false,
  }), []);

  useEffect(() => {
    if (!rootRef.current) return;
    instanceIdRef.current = mountUniversalTable(rootRef.current, config);
    return () => {
      if (instanceIdRef.current) {
        unmountUniversalTable(instanceIdRef.current);
      }
    };
  }, [config]);

  return <div ref={rootRef} />;
}
```

---

## Конфігурація

Об’єкт `detail` події `datatable:setConfig` (тип `TableConfig`):

| Параметр | Тип | За замовч. | Опис |
|----------|-----|------------|------|
| `requestUrl` | `string` | — | URL для POST даних таблиці |
| `storageKey` | `string` | — | Унікальний ключ стану в localStorage (`udt_state_{storageKey}`) |
| `columns` | `ColumnConfig[]` | — | Колонки |
| `filters` | `FilterConfig[]` | `[]` | Фільтри |
| `order` | `Record<string, 'asc' \| 'desc'>` | `{}` | Сортування за замовчуванням (береться перший ключ) |
| `showDownload` | `boolean` | `false` | Кнопка «Завантажити» |
| `showColumnsButton` | `boolean` | `true` | Кнопка «Колонки» |
| `filtersExpanded` | `boolean` | `true` | Панель фільтрів розгорнута |
| `rowsPerPageOptions` | `number[]` | `[10, 25, 50, 100]`* | Варіанти кількості рядків. Перший елемент — стартове значення |
| `scrollable` | `boolean` | `true` | Верхній кастомний скролбар (нижній є завжди) |
| `toolbarStart` | `string` | `''` | HTML у лівій частині тулбара |
| `downloadFilename` | `string` | `'export'` | Ім’я файлу без розширення |
| `downloadFormat` | `'xlsx' \| 'csv'` | `'xlsx'` | Формат експорту |
| `paginationMode` | `'server' \| 'client'` | `'server'` | Режим пагінації |
| `requestParams` | `Record<string, unknown>` | `{}` | Додаткові поля, які мерджаться в `filters` кожного запиту (дані й експорт) |
| `maxRowsPerFile` | `number` | `30000` | Ліміт рядків на один файл експорту; при перевищенні — ZIP |

\* У самому компоненті fallback — `[10, 25, 50]`. Обгортки `main.js` / `entry-react.ts` підставляють `[10, 25, 50, 100]`.

`requestParams` зручні для постійних умов, яких немає у UI (наприклад `{ registry_id: 42 }`). Вони йдуть у тіло як частина `filters` і перекриваються значеннями з панелі фільтрів при однаковому ключі.

---

## Колонки

Тип `ColumnConfig`:

| Поле | Тип | Обов’язк. | Опис |
|------|-----|-----------|------|
| `name` | `string` | Так | Ключ поля в рядку даних |
| `title` | `string` | Ні | Заголовок. Без нього колонка все одно рендериться |
| `visible` | `boolean` | Ні | Видима за замовчуванням (`true`) |
| `sortable` | `boolean` | Ні | Дозволити сортування |
| `width` | `string` | Ні | CSS-ширина (`'150px'`, `'10%'`) |
| `type` | `'computed'` | Ні | Склеювання кількох полів |
| `fields` | `string[]` | Ні | Поля для `type: 'computed'` |
| `value` | `(data) => string \| string[]` | Ні | Рендерер; результат вставляється через `v-html` |
| `class` | `string` | Ні | CSS-клас комірок тіла |
| `headerClass` | `string` | Ні | CSS-клас заголовка |
| `bodyClass` | `string` | Ні | CSS-клас тіла (має пріоритет над `class`) |
| `footerClass` | `string` | Ні | CSS-клас футера |
| `attributes.class` | `string` | Ні | Alias до `class`, якщо `class` не задано |

Колонка з `name: 'actions'` не вимикається в попапі «Колонки» (чекбокс `disabled`). Колонки `type: 'computed'` завжди видимі.

---

## Фільтри

Тип `FilterConfig`:

| Поле | Тип | Обов’язк. | Опис |
|------|-----|-----------|------|
| `name` | `string` | Так | Ключ фільтра (йде на сервер) |
| `title` | `string` | Так | Підпис |
| `type` | `FilterType` | Так | Див. типи нижче |
| `visible` | `boolean` | Ні | Видимий за замовч. (`true`) |
| `inToolbar` | `boolean` | Ні | Рендерить фільтр у тулбарі як Select, а не в панелі. Завжди видимий, не потрапляє в шестерню |
| `defaultValue` | `unknown` | Ні | Стартове значення, якщо в localStorage порожньо. Застосовується для `inToolbar` |
| `placeholder` | `string` | Ні | Підказка в полі |
| `options` | `array` | Ні | Опції для `select` / `multiselect` / `select-with-other` / toolbar-select |
| `optionLabel` | `string` | Ні | Поле підпису об’єкта-опції (за замовч. `label`) |
| `optionValue` | `string` | Ні | Поле значення об’єкта-опції (за замовч. `value`) |
| `placeholderFrom` / `placeholderTo` | `string` | Ні | Підказки «від» / «до» для `range` |
| `otherPlaceholder` | `string` | Ні | Підказка текстового поля в `select-with-other` |
| `otherLabel` | `string` | Ні | Підпис опції «Інше» (за замовч. `'Інше'`). Також спрацьовує значення `'other'` |
| `colSpan` | `2 \| 3` | Ні | Скільки колонок гріда зайняти |
| `minWidth` | `string` | Ні | Мінімальна ширина toolbar-select (за замовч. `380px`) |

`options` нормалізуються в `{ label, value }`. Підтримуються:

- `['Активний', 'Неактивний']`
- `[{ label: 'Київська', value: 1 }]`
- `[{ name: 'Категорія A', id: 'A' }]` разом з `optionLabel: 'name'`, `optionValue: 'id'`

Приховані фільтри (`visible: false`) не потрапляють у запит і в чіпи. Увімкнути їх можна шестернею біля кнопки «Фільтри».

---

## Типи колонок з прикладами

### Звичайна колонка

```js
{ name: 'id', title: 'ID', sortable: true, width: '80px' }
```

### Колонка з вирівнюванням

```js
{
  name: 'status',
  title: 'Статус',
  sortable: true,
  bodyClass: 'text-center',
  headerClass: 'text-center',
}
```

Доступні утилітні класи: `text-center`, `text-left`, `text-right`.

### Кастомний рендер (`value`, HTML)

Результат рендериться як `v-html`. **Не вставляйте невідфільтрований користувацький контент.**

```js
{
  name: 'full_name',
  title: 'ПІБ',
  sortable: true,
  value: (row) => `<a href="/users/${row.id}" class="text-primary">${row.full_name}</a>`,
}

{
  name: 'is_active',
  title: 'Статус',
  value: (row) => row.is_active
    ? '<span class="success">Активний</span>'
    : '<span class="failed">Неактивний</span>',
}
```

### Обчислювана колонка

Склеює `fields` через пробіл. Завжди видима.

```js
{
  name: 'full_name',
  title: 'ПІБ',
  type: 'computed',
  fields: ['last_name', 'first_name', 'middle_name'],
}
```

### Прихована за замовчуванням

```js
{ name: 'created_at', title: 'Дата створення', visible: false, sortable: true }
```

---

## Типи фільтрів з прикладами

### `text` / `string` / `varchar`

Одне текстове поле (`InputText`). У серверному режимі запит відкладається на 500 мс. Значення перед відправкою обрізається (`trim`).

```js
{ name: 'name', title: 'Назва', type: 'text', placeholder: 'Введіть назву...' }
```

### `integer`

```js
{ name: 'members_count', title: 'Кількість членів', type: 'integer' }
```

На сервер: `{ "members_count": 12 }`.

### `select`

Одиночний вибір. `options` — рядки або об’єкти.

```js
{
  name: 'status',
  title: 'Статус',
  type: 'select',
  placeholder: 'Оберіть статус...',
  options: ['Активний', 'Неактивний', 'Заблокований'],
}

{
  name: 'status_id',
  title: 'Статус',
  type: 'select',
  optionLabel: 'label',
  optionValue: 'value',
  options: [
    { label: 'Активний', value: 1 },
    { label: 'Неактивний', value: 0 },
  ],
}
```

### `multiselect`

Чіпи, максимум 3 підписи одночасно (`maxSelectedLabels`).

```js
{
  name: 'regions',
  title: 'Регіони',
  type: 'multiselect',
  placeholder: 'Оберіть регіони...',
  optionLabel: 'label',
  optionValue: 'value',
  options: [
    { label: 'Київська', value: 1 },
    { label: 'Харківська', value: 2 },
    { label: 'Одеська', value: 3 },
  ],
}
```

На сервер: `{ "regions": [1, 3] }`.

### `select-with-other`

Селект + текстове поле, яке з’являється, якщо обрано «Інше».

```js
{
  name: 'source',
  title: 'Джерело',
  type: 'select-with-other',
  placeholder: 'Оберіть...',
  otherLabel: 'Інше',
  otherPlaceholder: 'Вкажіть джерело...',
  options: ['Реєстр', 'Заява', 'Інше'],
}
```

- Якщо обрано звичайну опцію — на сервер іде її значення (`{ "source": "Реєстр" }`).
- Якщо обрано «Інше» / `other` / `otherLabel` — на сервер іде текст з додаткового поля.
- У внутрішньому стані живуть ще ключі `{name}_select` і `{name}_other` (у запит не потрапляють як окремі фільтри, окрім основного `name`).

### `date`

Календар. У UI формат **ДД-ММ-РРРР** (`dateFormat="dd-mm-yy"`). На сервер іде **YYYY-MM-DD** (з корекцією таймзони).

```js
{ name: 'created_at', title: 'Дата створення', type: 'date' }
```

```json
{ "created_at": "2024-03-15" }
```

### `date_range`

Діапазон дат. Ручний ввід увімкнений. Запит іде лише коли заповнені **обидві** дати.

На сервер: рядок `ДД.ММ.РРРР-ДД.ММ.РРРР`.

```js
{
  name: 'registration_date',
  title: 'Дата реєстрації',
  type: 'date_range',
  placeholder: 'ДД.ММ.РРРР - ДД.ММ.РРРР',
}
```

```json
{ "registration_date": "01.01.2024-31.03.2024" }
```

### `year`

Календар у режимі року. На сервер — число.

```js
{ name: 'report_year', title: 'Рік звітності', type: 'year' }
```

```json
{ "report_year": 2024 }
```

### `range`

Два числові поля «від» / «до». За замовчуванням займає 2 колонки гріда.

```js
{
  name: 'amount',
  title: 'Сума',
  type: 'range',
  placeholderFrom: 'Від',
  placeholderTo: 'До',
}
```

На сервер ідуть суфікси `_from` / `_to`. Порожнє поле не відправляється:

```json
{ "amount_from": 1000, "amount_to": 50000 }
```

### Фільтр у тулбарі

```js
{
  name: 'registry_id',
  title: 'Реєстр',
  type: 'select',
  inToolbar: true,
  defaultValue: 1,
  minWidth: '280px',
  options: [
    { label: 'Основний', value: 1 },
    { label: 'Архів', value: 2 },
  ],
}
```

Рендериться як `Select` ліворуч у тулбарі (поряд з `toolbarStart`). Не показується в панелі фільтрів і в шестерні.

### Ширина у гріді

```js
{ name: 'comment', title: 'Коментар', type: 'text', colSpan: 2 }
```

`colSpan: 2` або `3`. Тип `range` і так розтягується на 2 колонки.

---

## Події

Усі події — `CustomEvent` на `document`.

### `datatable:setConfig`

Ініціалізація або повна заміна конфігурації. `event.detail` — об’єкт `TableConfig` (див. таблицю вище).

Після події компонент переініціалізує стан (з урахуванням `localStorage`) і завантажує дані.

### `datatable:setFilter`

Програмно виставити значення одного фільтра:

```js
document.dispatchEvent(new CustomEvent('datatable:setFilter', {
  detail: { name: 'status', value: 'Активний' },
}));
```

Для `date_range` передавайте масив дат. У серверному режимі після зміни одразу йде запит (сторінка скидається на 1).

### `datatable:dataLoaded`

Викидається після успішного `POST` на `requestUrl`, якщо у відповіді є `results`. `event.detail` — повна відповідь API.

```js
document.addEventListener('datatable:dataLoaded', (e) => {
  console.log(e.detail.results.count);
});
```

---

## API сервера

Запити йдуть через `fetch` з `method: 'POST'`, `credentials: 'include'` і заголовками з авторизації (див. [Авторизація запитів](#авторизація-запитів)).

### Запит даних (серверний режим)

URL: `POST {requestUrl}`

```json
{
  "pager": {
    "page": 1,
    "size": 25
  },
  "order": {
    "created_at": "desc"
  },
  "filters": {
    "name": "Тест",
    "status": "Активний",
    "region_id": [1, 3],
    "registration_date": "01.01.2023-31.12.2023",
    "members_count_from": 10,
    "members_count_to": 500,
    "report_year": 2024,
    "founded_date": "2020-06-15",
    "registry_id": 42
  }
}
```

`filters` = `{ ...requestParams, ...очищені значення з UI }`. Порожні значення не відправляються. Невидимі фільтри теж пропускаються.

`pager.page` — 1-based. `order` — один ключ: поточне `sortField` / `sortOrder`.

### Запит даних (клієнтський режим)

Той самий URL і тіло, але **без** `pager`. `order` і `filters` (включно з `requestParams`) все одно відправляються.

Сервер має повернути повний набір рядків для подальшої клієнтської фільтрації / пагінації. Після першого завантаження зміни фільтрів на сервер більше не ходять — вони застосовуються локально.

### Відповідь даних (обидва режими)

```json
{
  "results": {
    "list": [
      {
        "id": 1,
        "name": "Організація 1",
        "edrpou_code": "12345678",
        "status": "Активний"
      }
    ],
    "count": 142
  }
}
```

| Поле | Тип | Опис |
|------|-----|------|
| `results.list` | `object[]` | Рядки: у серверному режимі — поточна сторінка, у клієнтському — увесь набір |
| `results.count` | `number` | Загальна кількість (для пагінатора в серверному режимі). У клієнтському режимі береться `list.length` |

Якщо `results` немає — таблиця не оновлюється.

---

## Експорт

Кнопка «Завантажити» (`showDownload: true`) **завжди** ходить на сервер, в обох режимах пагінації.

URL: `POST {requestUrl}-export`

Приклад: `requestUrl = '/api/v1/users/list'` → `/api/v1/users/list-export`.

### Алгоритм на клієнті

1. Службовий запит з `limit: 1`, щоб дізнатися `total`.
2. Якщо `total === 0` — alert «Немає даних для вивантаження.»
3. Якщо `total <= maxRowsPerFile` — один файл з `limit` / `offset: 0`.
4. Якщо більше — цикл з `offset = i * maxRowsPerFile`, файли пакуються в ZIP (JSZip) і скачується `{downloadFilename}.zip`.

### Тіло запиту

```json
{
  "filters": {
    "status": "Активний",
    "region_id": [1, 2]
  },
  "order": {
    "name": "asc"
  },
  "limit": 30000,
  "offset": 0
}
```

`filters` знову = `{ ...requestParams, ...UI-фільтри }`. Поля `limit` і `offset` додаються клієнтом.

### Відповідь

Перший (лічильний) запит має повернути хоча б:

```json
{ "total": 85420 }
```

Повні відповіді з даними:

```json
{
  "columns": [
    { "key": "id", "header": "ID", "width": 8 },
    { "key": "name", "header": "Назва", "width": 40 },
    { "key": "edrpou_code", "header": "ЄДРПОУ", "width": 15 }
  ],
  "rows": [
    { "id": 1, "name": "Організація 1", "edrpou_code": "12345678" }
  ],
  "filename": "organizations_2024",
  "total": 85420
}
```

| Поле | Тип | Обов’язк. | Опис |
|------|-----|-----------|------|
| `columns` | `array` | Так* | Колонки файлу |
| `columns[].key` | `string` | Так | Ключ у `rows` |
| `columns[].header` | `string` | Так | Заголовок у файлі |
| `columns[].width` | `number` | Ні | Ширина в символах (за замовч. 40) |
| `rows` | `array` | Так* | Рядки порції |
| `filename` | `string` | Ні | Перевизначає ім’я файлу (без розширення) |
| `total` | `number` | Так для count-запиту | Загальна кількість рядків експорту |

\* Якщо `columns` / `rows` немає, XLSX отримає аркуш «Немає даних», CSV — порожній файл.

HTML у комірках очищується перед записом. CSV пишеться з UTF-8 BOM.

Якщо `filename` з відповіді й `downloadFilename` порожні або дорівнюють `'export'`, клієнт підставляє ім’я `party_summary_info`. Для ZIP ім’я архіву — `downloadFilename`, а частини всередині — `{baseName}_part1.xlsx` тощо.

---

## Повний приклад ініціалізації

```js
const columns = [
  { name: 'id', title: 'ID', sortable: true, width: '70px' },
  { name: 'full_name', title: 'ПІБ', type: 'computed', fields: ['last_name', 'first_name'] },
  { name: 'edrpou_code', title: 'ЄДРПОУ', sortable: true },
  { name: 'email', title: 'Email', sortable: true },
  {
    name: 'status',
    title: 'Статус',
    value: (row) => row.is_active
      ? '<span class="success">Активний</span>'
      : '<span class="failed">Неактивний</span>',
  },
  { name: 'created_at', title: 'Дата реєстрації', sortable: true, visible: false },
  {
    name: 'actions',
    title: 'Дії',
    bodyClass: 'actions-column',
    value: (row) => `<a href="/users/${row.id}/edit">Редагувати</a>`,
  },
];

const filters = [
  { name: 'search', title: 'Пошук', type: 'text', placeholder: 'Назва або ЄДРПОУ...' },
  { name: 'status', title: 'Статус', type: 'select', options: ['Активний', 'Неактивний'] },
  {
    name: 'region_id',
    title: 'Регіони',
    type: 'multiselect',
    optionLabel: 'label',
    optionValue: 'value',
    options: [
      { label: 'Київська', value: 1 },
      { label: 'Львівська', value: 2 },
    ],
  },
  {
    name: 'source',
    title: 'Джерело',
    type: 'select-with-other',
    options: ['Реєстр', 'Заява', 'Інше'],
    otherPlaceholder: 'Вкажіть джерело...',
  },
  { name: 'created_date', title: 'Дата реєстр.', type: 'date_range' },
  { name: 'year', title: 'Рік', type: 'year' },
  { name: 'amount', title: 'Сума', type: 'range', placeholderFrom: 'Від', placeholderTo: 'До' },
  {
    name: 'registry_id',
    title: 'Реєстр',
    type: 'select',
    inToolbar: true,
    defaultValue: 1,
    options: [
      { label: 'Основний', value: 1 },
      { label: 'Архів', value: 2 },
    ],
  },
];

document.addEventListener('DOMContentLoaded', () => {
  document.dispatchEvent(new CustomEvent('datatable:setConfig', {
    detail: {
      requestUrl: '/api/v1/registry/parties/api/list',
      storageKey: 'party_registry_list',
      columns,
      filters,
      order: { edrpou_code: 'asc' },
      showDownload: true,
      showColumnsButton: true,
      filtersExpanded: false,
      rowsPerPageOptions: [10, 25, 50, 100],
      scrollable: true,
      downloadFilename: 'party_registry_export',
      downloadFormat: 'xlsx',
      paginationMode: 'server',
      requestParams: { context: 'admin' },
      maxRowsPerFile: 30000,
      toolbarStart: `
        <div class="flex gap-2">
          <a href="/parties/create" class="p-button p-button-secondary p-button-sm">
            Додати вручну
          </a>
        </div>
      `,
    },
  }));
});
```

---

## Збереження стану

Ключ: `udt_state_{storageKey}`.

| Поле | Опис |
|------|------|
| `isFiltersPanelOpen` | Панель фільтрів відкрита / закрита |
| `isScrollEnabled` | Верхній скролбар увімкнений |
| `lazyParams` | Сторінка, кількість рядків, поле і напрям сортування |
| `columns` | Видимість кожної колонки (`name` + `visible`) |
| `filtersVisibility` | Видимість кожного фільтра |
| `activeFilters` | Поточні значення фільтрів (дати серіалізуються в ISO) |

Скинути стан:

```js
localStorage.removeItem('udt_state_party_registry_list');
```

Якщо `storageKey` порожній або рядок `'undefined'` — ні читання, ні запис, ні завантаження даних не виконуються.

---

## Авторизація запитів

Кожен `fetch` (дані й експорт) додає:

| Заголовок | Звідки |
|-----------|--------|
| `Content-Type: application/json` | завжди |
| `Accept: application/json` | завжди |
| `Authorization: Bearer …` | `localStorage.getItem('authKey')`, якщо є |
| `X-CSRF-Token` | `<meta name="csrf-token" content="…">`, якщо є |

Також `credentials: 'include'` (куки сесії).

---

## Кастомна тема

Тема задається в `src/main.js` і `src/entry-react.ts` через `definePreset` на базі Aura. Темна тема вимкнена (`darkModeSelector: 'none'`).

```js
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

const MyTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0f9ff',
      500: '#0369a1',
      600: '#0284c7',
      950: '#032f4c',
    },
    highlight: {
      background: '#e0f2fe',
      focusBackground: '#bae6fd',
      color: '#0369a1',
      focusColor: '#0c4a6e',
    },
  },
});
```

Доступні базові пресети PrimeVue 4: **Aura**, **Lara**, **Nora**.

---

## CSS-класи

У `value()` можна використовувати вбудовані класи:

```css
.success { color: #0a570a; font-weight: 600; }
.failed  { color: #bb0e4a; font-weight: 600; }
.actions-column { width: max-content; }
.text-center { text-align: center; }
.text-left   { text-align: left; }
.text-right  { text-align: right; }
```

Над таблицею, коли є активні фільтри, показується бар **«Застосовані фільтри»** з чіпами. Хрестик на чіпі скидає один фільтр, кнопка «Скинути всі» очищає фільтри й глобальний пошук.

---

## Важливі особливості та обмеження

- Нижній скролбар завжди присутній; верхній вмикається опцією «Верхній скрол» у попапі колонок (залежить від `scrollable` / збереженого стану).
- Нативний горизонтальний скрол таблиці сховано — використовуються кастомні бари.
- `value()` йде в `v-html` — XSS на совісті того, хто формує HTML.
- Колонки `computed` завжди видимі. Колонка `actions` не вимикається з UI.
- У клієнтському режимі глобальний пошук дивиться лише на видимі колонки і ігнорує `actions`. HTML у комірках перед пошуком знімається.
- Експорт не бере рядки з DOM: завжди `POST {requestUrl}-export` з поточними фільтрами, навіть у `paginationMode: 'client'`.
- Debounce 500 мс працює лише в серверному режимі.
- `date_range` відправляється, лише коли обрані обидві дати.
- При зміні `paginationMode` потрібна повторна ініціалізація (`datatable:setConfig` або перезавантаження сторінки).
- Пагінатор: ліворуч — «Показано з {first} по {last} із {totalRecords} записів», по центру — сторінки, праворуч — вибір кількості рядків (на вузьких екранах — у колонку).
- React-збірка реєструє директиву `v-tooltip` (підказка на шестерні фільтрів).
