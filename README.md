# UniversalDataTable

Універсальний компонент таблиці даних на базі Vue 3 + PrimeVue. Підтримує два режими роботи (серверний та клієнтський), фільтрацію, сортування, керування видимістю колонок, збереження стану у `localStorage` та клієнтський експорт у форматах `xlsx` / `csv`.

---

## Ключові можливості

- Два режими роботи: **серверний** (пагінація на сервері) та **клієнтський** (всі дані на клієнті)
- Кастомні горизонтальні скролбари (верхній + нижній) з синхронізацією
- Гнучка система фільтрів (text, select, multiselect, date, date_range, year, range, integer)
- Підтримка обчислюваних колонок (`computed`) та кастомних рендерерів (`value`)
- Повне збереження стану таблиці в `localStorage`
- Клієнтський експорт у **XLSX** та **CSV** (з підтримкою кирилиці)
- Кастомний контент у тулбарі (`toolbarStart`)
- Підтримка кастомних CSS-класів для колонок
- Українська локалізація та кастомні теми PrimeVue

---

## Режими роботи таблиці

Компонент підтримує два режими роботи, які визначаються параметром `paginationMode`:

### 1. Серверний режим (`paginationMode: 'server'`) — за замовчуванням

**Принцип роботи:**
- При кожній зміні сторінки, сортуванні або фільтрі виконується запит до сервера
- Сервер повертає ТІЛЬКИ дані для поточної сторінки
- Підходить для великих таблиць (>5000 рядків)

**Переваги:**
- Мінімальне використання пам'яті браузера
- Швидке початкове завантаження
- Фільтрація на стороні сервера (можна використовувати індекси БД)

**Недоліки:**
- Затримка при кожній зміні сторінки/фільтра
- Більше навантаження на сервер

### 2. Клієнтський режим (`paginationMode: 'client'`)

**Принцип роботи:**
- При ініціалізації виконується ОДИН запит до сервера
- Сервер повертає ВСІ дані (без пагінації)
- Вся подальша фільтрація, сортування та пагінація відбуваються на клієнті

**Переваги:**
- Миттєва реакція на зміну фільтрів та сортування
- Відсутність затримок мережі
- Глобальний пошук по всіх колонках (доступний тільки в цьому режимі)
- Зменшення навантаження на сервер

**Недоліки:**
- Більше використання пам'яті браузера
- Повільніше початкове завантаження при великій кількості даних
- Не підходить для таблиць з >2000 рядків

**Особливості клієнтського режиму:**
- Глобальний пошук з'являється над панеллю фільтрів
- Фільтри застосовуються миттєво (без debounce)
- Панель фільтрів та глобальний пошук працюють разом
- При скиданні фільтрів сторінка скидається на першу

### Коли використовувати клієнтський режим?

✅ **Доцільно використовувати:**
- Таблиці з <2000 рядків
- Часта зміна фільтрів/пошуку
- Важлива швидкість взаємодії
- Дані рідко оновлюються на сервері

❌ **Не рекомендується:**
- Таблиці з >2000 рядків
- Обмеження пам'яті на клієнті
- Дані часто оновлюються на сервері
- Складні фільтри на стороні БД

---

## Встановлення

```sh
npm install vue primevue @primevue/themes primeicons xlsx
```

### Компіляція компоненту версія розробки

```sh
npm run dev
```

### Компіляція компоненту продакшен білд (мініфікований)

```sh
npm run build
```

---

## Зміст

- [Залежності](#залежності)
- [Структура файлів](#структура-файлів)
- [Підключення](#підключення)
- [Конфігурація](#конфігурація)
  - [Загальні параметри](#загальні-параметри)
  - [Колонки](#колонки)
  - [Фільтри](#фільтри)
  - [Експорт](#експорт)
- [Всі типи колонок з прикладами](#всі-типи-колонок-з-прикладами)
- [Всі типи фільтрів з прикладами](#всі-типи-фільтрів-з-прикладами)
- [API сервера](#api-сервера)
  - [Запит даних (серверний режим)](#запит-даних-серверний-режим)
  - [Запит даних (клієнтський режим)](#запит-даних-клієнтський-режим)
  - [Відповідь даних](#відповідь-даних)
  - [Запит експорту](#запит-експорту)
  - [Відповідь експорту](#відповідь-експорту)
- [Повний приклад ініціалізації](#повний-приклад-ініціалізації)
- [Збереження стану](#збереження-стану)
- [Кастомна тема](#кастомна-тема)
- [CSS-класи для значень колонок](#css-класи-для-значень-колонок)
- [Важливі особливості та обмеження](#важливі-особливості-та-обмеження)

---

## Залежності

```bash
npm install vue primevue @primevue/themes primeicons xlsx
```

| Пакет | Призначення |
|---|---|
| `vue` | Vue 3 |
| `primevue` | UI-компоненти (DataTable, Button, Select тощо) |
| `@primevue/themes` | Теми (Aura, Lara тощо) |
| `primeicons` | Іконки |
| `xlsx` | Генерація XLSX / CSV на клієнті (SheetJS) |

---

## Структура файлів

```
src/
  components/
    UniversalDataTable.vue   # Сам компонент
  main.ts                    # Точка входу, ініціалізація Vue + PrimeVue
```

В HTML-сторінці обов'язково повинен бути контейнер з `id="datatable"`:

```html
<div id="datatable"></div>
```

---

## Підключення

Компонент ініціалізується через подію `datatable:setConfig`. Це дозволяє використовувати його з будь-якого місця — у Blade-шаблонах, PHP-в'юхах (Yii2, Laravel), або звичайному JS.

### `main.ts` — базовий вхідний файл

```typescript
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import UniversalDataTable from './components/UniversalDataTable.vue';
import 'primeicons/primeicons.css';

const ukrainianLocale = {
    firstDayOfWeek: 1,
    dayNames: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'],
    dayNamesShort: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    dayNamesMin: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    monthNames: ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],
    monthNamesShort: ['Січ','Лют','Бер','Квіт','Трав','Черв','Лип','Серп','Вер','Жовт','Лист','Груд'],
    today: 'Сьогодні',
    clear: 'Очистити',
    dateFormat: 'dd.mm.yy',
    weekHeader: 'Тиж',
};

const MyCustomTheme = definePreset(Aura, {
    semantic: {
        primary: {
            500: '#0369a1',
            600: '#0284c7',
            700: '#0369a1',
        }
    }
});

document.addEventListener('datatable:setConfig', (event: any) => {
    const config = event.detail;

    const app = createApp(UniversalDataTable, {
        requestUrl:         config.requestUrl,
        storageKey:         config.storageKey,
        columnsConfig:      config.columns,
        filtersConfig:      config.filters        || [],
        defaultOrder:       config.order          || {},
        showDownload:       config.showDownload   ?? false,
        filtersExpanded:    config.filtersExpanded ?? true,
        rowsPerPageOptions: config.rowsPerPageOptions || [10, 25, 50, 100],
        scrollable:         config.scrollable     ?? true,
        toolbarStart:       config.toolbarStart   || '',
        downloadFilename:   config.downloadFilename || 'export',
        downloadFormat:     config.downloadFormat  || 'xlsx',
        paginationMode:     config.paginationMode  || 'server',
    });

    app.use(PrimeVue, {
        locale: ukrainianLocale,
        theme: {
            preset: MyCustomTheme,
            options: { darkModeSelector: 'none' }
        }
    });

    app.mount('#datatable');
});
```

### Виклик у JavaScript / PHP-в'юсі

```javascript
const init = () => {
    document.dispatchEvent(new CustomEvent('datatable:setConfig', {
        detail: {
            requestUrl:         '/api/v1/users/list',
            storageKey:         'users_list',
            columns:            columns,
            filters:            filters,
            order:              { id: 'desc' },
            showDownload:       true,
            filtersExpanded:    true,
            rowsPerPageOptions: [10, 25, 50, 100],
            scrollable:         true,
            downloadFilename:   'users_export',
            downloadFormat:     'xlsx',
            paginationMode:     'server', // 'server' або 'client'
        }
    }));
};

document.addEventListener('DOMContentLoaded', init);
```

---

## Конфігурація

### Загальні параметри

| Параметр | Тип                             | За замовч.   | Опис                                                           |
|---|---------------------------------|--------------|----------------------------------------------------------------|
| `requestUrl` | `string`                        | —            | URL для POST-запиту даних таблиці                              |
| `storageKey` | `string`                        | —            | Унікальний ключ для збереження стану в `localStorage`          |
| `columns` | `ColumnConfig[]`                | —            | Масив конфігурацій колонок                                     |
| `filters` | `FilterConfig[]`                | `[]`         | Масив конфігурацій фільтрів                                    |
| `order` | `Record<string, 'asc'\|'desc'>` | `{}`         | Сортування за замовчуванням                                    |
| `showDownload` | `boolean`                       | `false`      | Показати кнопку "Завантажити"                                  |
| `filtersExpanded` | `boolean`                       | `true`       | Панель фільтрів розгорнута за замовчуванням                    |
| `rowsPerPageOptions` | `number[]`                      | `[10,25,50]` | Варіанти кількості рядків на сторінці                          |
| `scrollable` | `boolean`                       | `true`       | Увімкнути верхній/нижній скролбар                              |
| `toolbarStart` | `string`                        | `''`         | HTML-рядок для лівої частини тулбара                           |
| `downloadFilename` | `string`                        | `'export'`   | Назва файлу без розширення                                     |
| `downloadFormat` | `'xlsx'\|'csv'`                 | `'xlsx'`     | Формат файлу при завантаженні                                  |
| `paginationMode` | `'server'\|'client'`            | `'server'`   | Режим пагінації (див. [Режими роботи](#режими-роботи-таблиці)) |
| `showColumnsButton` |  `boolean`              | `'true'`     | Показати кнопку "Колонки"                                      |


---

### Колонки

Кожна колонка є об'єктом типу `ColumnConfig`:

| Поле | Тип | Обов'язк. | Опис |
|---|---|---|---|
| `name` | `string` | Так | Ключ поля у даних з сервера |
| `title` | `string` | Так | Заголовок колонки |
| `visible` | `boolean` | Ні | Видима за замовчуванням (за замовч. `true`) |
| `sortable` | `boolean` | Ні | Дозволити сортування |
| `width` | `string` | Ні | CSS-ширина (`'150px'`, `'10%'`) |
| `type` | `'computed'` | Ні | Тип колонки (тільки `'computed'`) |
| `fields` | `string[]` | Ні | Поля для склеювання (тільки для `type: 'computed'`) |
| `value` | `(data) => string` | Ні | Функція-рендерер (підтримує HTML) |
| `class` | `string` | Ні | CSS-клас для комірок тіла |
| `headerClass` | `string` | Ні | CSS-клас для заголовка |
| `bodyClass` | `string` | Ні | CSS-клас для тіла (alias до `class`) |
| `footerClass` | `string` | Ні | CSS-клас для футера |

---

### Фільтри

Кожен фільтр є об'єктом типу `FilterConfig`:

| Поле | Тип | Обов'язк. | Опис |
|---|---|---|---|
| `name` | `string` | Так | Ключ фільтра (передається на сервер) |
| `title` | `string` | Так | Підпис фільтра |
| `type` | `string` | Так | Тип фільтра (див. нижче) |
| `visible` | `boolean` | Ні | Видимий за замовч. (`true`) |
| `placeholder` | `string` | Ні | Підказка у полі |
| `options` | `any[]` | Ні | Список опцій (для `select`, `multiselect`) |
| `optionLabel` | `string` | Ні | Поле для відображення опції (для `multiselect`) |
| `optionValue` | `string` | Ні | Поле значення опції (для `multiselect`) |
| `placeholderFrom` | `string` | Ні | Підказка для поля "від" (для `range`) |
| `placeholderTo` | `string` | Ні | Підказка для поля "до" (для `range`) |

---

### Експорт

Компонент підтримує експорт даних у формати XLSX та CSV. При натисканні кнопки «Завантажити»:

1. Робиться POST-запит на `{requestUrl}-export`
2. Сервер повертає JSON з даними
3. Фронтенд генерує файл (xlsx або csv)

#### Формат відповіді сервера для експорту:

```json
{
  "columns": [
    { "key": "id",    "header": "ID",    "width": 8  },
    { "key": "name",  "header": "Назва", "width": 30 }
  ],
  "rows": [
    { "id": 1, "name": "Іван Іванов" },
    { "id": 2, "name": "Марія Петрова" }
  ],
  "filename": "my_custom_filename"
}
```

| Поле | Тип | Опис |
|---|---|---|
| `columns[].key` | `string` | Ключ поля у рядку `rows` |
| `columns[].header` | `string` | Заголовок колонки у файлі |
| `columns[].width` | `number` | Ширина колонки у символах |
| `rows` | `object[]` | Масив рядків даних |
| `filename` | `string` | Опціонально — перевизначає назву файлу |

> HTML-теги у значеннях рядків автоматично очищуються перед записом у файл.

> CSV-файл зберігається з UTF-8 BOM для коректного відкриття в Excel.

---

## Всі типи колонок з прикладами

### 1. Звичайна колонка (поле з даних)

```javascript
{
    name: 'id',
    title: 'ID',
    sortable: true,
    width: '80px',
}
```

---

### 2. Колонка із сортуванням та кастомним класом

```javascript
{
    name: 'status',
    title: 'Статус',
    sortable: true,
    bodyClass: 'text-center',
    headerClass: 'text-center',
}
```

---

### 3. Колонка з функцією-рендерером (підтримує HTML)

Якщо задана `value` — функція, її результат рендериться як `v-html`. Це дозволяє виводити посилання, значки, кнопки тощо.

```javascript
{
    name: 'full_name',
    title: 'ПІБ',
    sortable: true,
    value: (row) => {
        return `<a href="/users/${row.id}" class="text-primary">${row.full_name}</a>`;
    }
}
```

```javascript
{
    name: 'is_active',
    title: 'Статус',
    value: (row) => {
        return row.is_active
            ? '<span class="success">Активний</span>'
            : '<span class="failed">Неактивний</span>';
    }
}
```

```javascript
// Кнопки дій
{
    name: 'actions',
    title: 'Дії',
    bodyClass: 'actions-column',
    value: (row) => {
        return `
            <a href="/users/${row.id}/edit" title="Редагувати">
                <svg>...</svg>
            </a>
            <a href="/users/${row.id}/delete" title="Видалити">
                <svg>...</svg>
            </a>
        `;
    }
}
```

---

### 4. Обчислювана колонка (type: 'computed')

Склеює кілька полів через пробіл. Завжди видима (не можна приховати).

```javascript
{
    name: 'full_name',
    title: 'ПІБ',
    type: 'computed',
    fields: ['last_name', 'first_name', 'middle_name'],
}
```

```javascript
// Адреса з кількох полів
{
    name: 'address',
    title: 'Адреса',
    type: 'computed',
    fields: ['city', 'street', 'building'],
}
```

---

### 5. Прихована за замовчуванням колонка

Колонка є у списку, але не відображається. Користувач може увімкнути через "Колонки".

```javascript
{
    name: 'created_at',
    title: 'Дата створення',
    visible: false,
    sortable: true,
}
```

---

### 6. Колонка з фіксованою шириною

```javascript
{
    name: 'edrpou',
    title: 'ЄДРПОУ',
    width: '120px',
    sortable: true,
}
```

---

### Повний приклад масиву колонок

```javascript
const columns = [
    {
        name: 'id',
        title: 'ID',
        sortable: true,
        width: '70px',
    },
    {
        name: 'full_name',
        title: 'ПІБ',
        type: 'computed',
        fields: ['last_name', 'first_name', 'middle_name'],
    },
    {
        name: 'edrpou_code',
        title: 'ЄДРПОУ',
        sortable: true,
        width: '120px',
    },
    {
        name: 'status',
        title: 'Статус',
        value: (row) => {
            const map = {
                active:   '<span class="success">Активний</span>',
                inactive: '<span class="failed">Неактивний</span>',
                pending:  '<span style="color:#e8a51f">Очікує</span>',
            };
            return map[row.status] || row.status;
        }
    },
    {
        name: 'created_at',
        title: 'Дата створення',
        sortable: true,
        visible: false,
    },
    {
        name: 'actions',
        title: 'Дії',
        bodyClass: 'actions-column',
        value: (row) => `
            <a href="/parties/${row.id}" title="Переглянути">
                <svg fill="currentColor" width="16" height="16" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
            </a>
            <a href="/parties/${row.id}/edit" title="Редагувати">
                <svg fill="currentColor" width="16" height="16" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
            </a>
        `,
    },
];
```

---

## Всі типи фільтрів з прикладами

### 1. `text` / `string` / `varchar` — текстовий рядок

Використовується для пошуку по рядку. Запит відкладається на 500 мс після введення (тільки в серверному режимі).

```javascript
{
    name: 'name',
    title: 'Назва',
    type: 'text',
    placeholder: 'Введіть назву...',
}
```

```javascript
{
    name: 'edrpou_code',
    title: 'ЄДРПОУ',
    type: 'varchar',
}
```

> Всі три типи (`text`, `string`, `varchar`) поводяться однаково — рендерять `InputText`.

---

### 2. `integer` — ціле число

```javascript
{
    name: 'year',
    title: 'Рік',
    type: 'integer',
    placeholder: 'Введіть рік...',
}
```

```javascript
{
    name: 'members_count',
    title: 'Кількість членів',
    type: 'integer',
}
```

На сервер передається числове значення:
```json
{ "year": 2024 }
```

---

### 3. `select` — випадаючий список (одиночний вибір)

```javascript
{
    name: 'status',
    title: 'Статус',
    type: 'select',
    placeholder: 'Оберіть статус...',
    options: ['Активний', 'Неактивний', 'Заблокований'],
}
```

```javascript
// Якщо опції — рядки, на сервер передається обраний рядок
// { "status": "Активний" }
```

> `options` — просто масив рядків для `select`. Відображення і значення збігаються.

---

### 4. `multiselect` — список з множинним вибором

Відображає обрані значення як чіпи. Максимум 3 чіпи видно одночасно.

```javascript
{
    name: 'regions',
    title: 'Регіони',
    type: 'multiselect',
    placeholder: 'Оберіть регіони...',
    optionLabel: 'label',
    optionValue: 'value',
    options: [
        { label: 'Київська',    value: 1 },
        { label: 'Харківська',  value: 2 },
        { label: 'Одеська',     value: 3 },
        { label: 'Дніпровська', value: 4 },
        { label: 'Львівська',   value: 5 },
    ],
}
```

На сервер передається масив обраних значень:
```json
{ "regions": [1, 3, 5] }
```

```javascript
// Простий multiselect зі рядковими значеннями
{
    name: 'categories',
    title: 'Категорії',
    type: 'multiselect',
    optionLabel: 'name',
    optionValue: 'id',
    options: [
        { id: 'A', name: 'Категорія A' },
        { id: 'B', name: 'Категорія B' },
        { id: 'C', name: 'Категорія C' },
    ],
}
```

---

### 5. `date` — вибір конкретної дати

Формат що передається на сервер: `YYYY-MM-DD`.

```javascript
{
    name: 'created_at',
    title: 'Дата створення',
    type: 'date',
    placeholder: 'РРРР-ММ-ДД',
}
```

```javascript
{
    name: 'birth_date',
    title: 'Дата народження',
    type: 'date',
}
```

На сервер:
```json
{ "created_at": "2024-03-15" }
```

---

### 6. `date_range` — діапазон дат

Дозволяє обрати дві дати — початок і кінець. Ручний ввід вимкнений.

```javascript
{
    name: 'registration_date',
    title: 'Дата реєстрації',
    type: 'date_range',
    placeholder: 'ДД.ММ.РРРР - ДД.ММ.РРРР',
}
```

На сервер передається рядок формату `ДД.ММ.РРРР-ДД.ММ.РРРР`:
```json
{ "registration_date": "01.01.2024-31.03.2024" }
```

---

### 7. `year` — вибір року

Відображає календар у режимі вибору року.

```javascript
{
    name: 'report_year',
    title: 'Рік звітності',
    type: 'year',
    placeholder: 'РРРР',
}
```

На сервер передається число:
```json
{ "report_year": 2024 }
```

---

### 8. `range` — числовий діапазон (від / до)

Відображає два поля: "від" і "до". Займає подвійну ширину у гриді фільтрів.

```javascript
{
    name: 'amount',
    title: 'Сума',
    type: 'range',
    placeholderFrom: 'Від',
    placeholderTo: 'До',
}
```

```javascript
{
    name: 'members_count',
    title: 'Кількість членів',
    type: 'range',
    placeholderFrom: 'Мінімум',
    placeholderTo: 'Максимум',
}
```

На сервер передаються окремі ключи з суфіксами `_from` і `_to`:
```json
{
  "amount_from": 1000,
  "amount_to":   50000
}
```

> Якщо заповнено лише одне поле — передається лише воно.

---

### Прихований фільтр за замовчуванням

```javascript
{
    name: 'internal_code',
    title: 'Внутрішній код',
    type: 'text',
    visible: false,   // прихований, але доступний через шестерню
}
```

---

### Повний приклад масиву фільтрів

```javascript
const filters = [
    {
        name: 'name',
        title: 'Назва',
        type: 'text',
        placeholder: 'Введіть назву...',
    },
    {
        name: 'edrpou_code',
        title: 'ЄДРПОУ',
        type: 'varchar',
        placeholder: '12345678',
    },
    {
        name: 'status',
        title: 'Статус',
        type: 'select',
        options: ['Зареєстрований', 'Ліквідований', 'В стадії ліквідації'],
        placeholder: 'Оберіть статус...',
    },
    {
        name: 'region_id',
        title: 'Регіони',
        type: 'multiselect',
        optionLabel: 'label',
        optionValue: 'value',
        options: [
            { label: 'Київська',   value: 1 },
            { label: 'Львівська',  value: 2 },
            { label: 'Одеська',    value: 3 },
        ],
        placeholder: 'Оберіть регіони...',
    },
    {
        name: 'registration_date',
        title: 'Дата реєстрації',
        type: 'date_range',
    },
    {
        name: 'report_year',
        title: 'Рік звітності',
        type: 'year',
    },
    {
        name: 'founded_date',
        title: 'Дата заснування',
        type: 'date',
    },
    {
        name: 'members_count',
        title: 'Кількість членів',
        type: 'range',
        placeholderFrom: 'Від',
        placeholderTo: 'До',
    },
    {
        name: 'employee_count',
        title: 'Кількість працівників',
        type: 'integer',
    },
    {
        name: 'internal_note',
        title: 'Внутрішня позначка',
        type: 'text',
        visible: false,
    },
];
```

---

## API сервера

### Запит даних (серверний режим)

**URL:** `POST {requestUrl}`

**Тіло запиту:**

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
    "founded_date": "2020-06-15"
  }
}
```

### Запит даних (клієнтський режим)

**URL:** `POST {requestUrl}`

**Тіло запиту:** (без `pager`)

```json
{
  "order": {
    "created_at": "desc"
  }
}
```

> **Важливо:** У клієнтському режимі сервер ігнорує `pager` (якщо він є) і повертає ВСІ дані.

### Відповідь даних (обидва режими)

```json
{
  "results": {
    "list": [
      {
        "id": 1,
        "name": "Організація 1",
        "edrpou_code": "12345678",
        "status": "Активний
      }
    ],
    "count": 142
  }
}
```

| Поле | Тип | Опис |
|---|---|---|
| `results.list` | `object[]` | Масив рядків (для серверного режиму — поточна сторінка, для клієнтського — всі дані) |
| `results.count` | `number` | Загальна кількість записів (для пагінатора) |

---

### Запит експорту

**URL:** `POST {requestUrl}-export`

> Наприклад, якщо `requestUrl = '/api/v1/users/list'`, то запит піде на `/api/v1/users/list-export`.

**Тіло запиту:**

```json
{
  "filters": {
    "status": "Активний",
    "region_id": [1, 2]
  },
  "order": {
    "name": "asc"
  }
}
```

---

### Відповідь експорту

```json
{
  "columns": [
    { "key": "id",            "header": "ID",              "width": 8  },
    { "key": "name",          "header": "Назва",           "width": 40 },
    { "key": "edrpou_code",   "header": "ЄДРПОУ",         "width": 15 },
    { "key": "status",        "header": "Статус",          "width": 20 },
    { "key": "region",        "header": "Регіон",          "width": 25 },
    { "key": "created_at",    "header": "Дата створення",  "width": 20 }
  ],
  "rows": [
    {
      "id": 1,
      "name": "Організація 1",
      "edrpou_code": "12345678",
      "status": "Активний",
      "region": "Київська",
      "created_at": "2024-01-15"
    }
  ],
  "filename": "organizations_2024"
}
```

| Поле | Тип | Обов'язк. | Опис |
|---|---|---|---|
| `columns` | `array` | Так | Список колонок файлу |
| `columns[].key` | `string` | Так | Ключ поля у `rows` |
| `columns[].header` | `string` | Так | Заголовок у файлі |
| `columns[].width` | `number` | Ні | Ширина колонки у символах (за замовч. 20) |
| `rows` | `array` | Так | Рядки даних |
| `filename` | `string` | Ні | Перевизначає назву файлу (без розширення) |

---

## Повний приклад ініціалізації

```javascript
const columns = [
    { name: 'id',            title: 'ID',              sortable: true, width: '70px' },
    { name: 'full_name',     title: 'ПІБ',             type: 'computed', fields: ['last_name', 'first_name'] },
    { name: 'edrpou_code',   title: 'ЄДРПОУ',         sortable: true },
    { name: 'email',         title: 'Email',           sortable: true },
    { name: 'status',        title: 'Статус',          value: (row) => row.is_active ? '<span class="success">Активний</span>' : '<span class="failed">Неактивний</span>' },
    { name: 'created_at',    title: 'Дата реєстрації', sortable: true, visible: false },
    {
        name: 'actions',
        title: 'Дії',
        bodyClass: 'actions-column',
        value: (row) => `<a href="/users/${row.id}/edit">Редагувати</a>`,
    },
];

const filters = [
    { name: 'search',       title: 'Пошук',        type: 'text',        placeholder: 'Назва або ЄДРПОУ...' },
    { name: 'status',       title: 'Статус',        type: 'select',      options: ['Активний', 'Неактивний'] },
    { name: 'region_id',    title: 'Регіони',       type: 'multiselect', optionLabel: 'label', optionValue: 'value', options: [{ label: 'Київська', value: 1 }, { label: 'Львівська', value: 2 }] },
    { name: 'created_date', title: 'Дата реєстр.',  type: 'date_range' },
    { name: 'year',         title: 'Рік',           type: 'year' },
    { name: 'amount',       title: 'Сума',          type: 'range',       placeholderFrom: 'Від', placeholderTo: 'До' },
];

const init = () => {
    document.dispatchEvent(new CustomEvent('datatable:setConfig', {
        detail: {
            requestUrl:         '/api/v1/registry/parties/api/list',
            storageKey:         'party_registry_list',
            columns:            columns,
            filters:            filters,
            order:              { edrpou_code: 'asc' },
            showDownload:       true,
            filtersExpanded:    false,
            rowsPerPageOptions: [10, 25, 50, 100],
            scrollable:         true,
            downloadFilename:   'party_registry_export',
            downloadFormat:     'xlsx',
            paginationMode:     'server', // або 'client'
            toolbarStart: `
                <div class="flex gap-2">
                    <a href="/parties/create" class="p-button p-button-secondary p-button-sm">
                        Додати вручну
                    </a>
                </div>
            `,
        }
    }));
};

document.addEventListener('DOMContentLoaded', init);
```

---

## Збереження стану

Стан таблиці автоматично зберігається у `localStorage` за ключем `udt_state_{storageKey}`.

**Що зберігається:**

| Поле | Опис |
|---|---|
| `isFiltersPanelOpen` | Відкрита / закрита панель фільтрів |
| `isScrollEnabled` | Увімкнений / вимкнений кастомний скролбар |
| `lazyParams` | Поточна сторінка, кількість рядків, сортування |
| `columns` | Видимість кожної колонки |
| `filtersVisibility` | Видимість кожного фільтра |
| `activeFilters` | Поточні значення всіх фільтрів |

> Щоб скинути стан — видаліть ключ з `localStorage`:
> ```javascript
> localStorage.removeItem('udt_state_party_registry_list');
> ```

---

## Кастомна тема

Тему можна змінити через `definePreset` у `main.ts`. Нижче приклад зміни основного кольору:

```typescript
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

const MyTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50:  '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#16a34a',  // основний колір
            600: '#15803d',
            700: '#166534',
            800: '#14532d',
            900: '#052e16',
            950: '#021808',
        },
        highlight: {
            background:      '#dcfce7',
            focusBackground: '#bbf7d0',
            color:           '#16a34a',
            focusColor:      '#14532d',
        }
    }
});
```

Доступні базові теми: `Aura`, `Lara`, `Nora`.

---

## CSS-класи для значень колонок

У функції `value` можна використовувати вбудовані стилізовані класи:

```css
/* Зелений текст — успіх */
.success { color: #0a570a; font-weight: 600; }

/* Червоний текст — помилка */
.failed  { color: #bb0e4a; font-weight: 600; }

/* Колонка з кнопками дій */
.actions-column { width: max-content; }
```

```javascript
// Приклад використання
{
    name: 'payment_status',
    title: 'Статус оплати',
    value: (row) => {
        if (row.payment_status === 'paid')    return '<span class="success">Оплачено</span>';
        if (row.payment_status === 'failed')  return '<span class="failed">Помилка</span>';
        return row.payment_status;
    }
}
```

---

## Важливі особливості та обмеження

- **Нижній скролбар** завжди видимий (при необхідності).
- **Верхній скролбар** керується через налаштування колонок (опція `scrollable`).
- **`value()` функція** використовує `v-html` — не вставляйте невідфільтрований користувацький контент.
- **Колонки типу `computed`** завжди видимі (не можна приховати через UI).
- **Клієнтський режим** (`paginationMode: 'client'`) не підтримує фільтрацію на стороні сервера — всі фільтри застосовуються на клієнті.
- **Серверний режим** (`paginationMode: 'server'`) виконує окремий запит при кожній зміні сторінки, сортуванні або фільтрі.
- **Глобальний пошук** доступний **ТІЛЬКИ** в клієнтському режимі.
- При зміні режиму роботи (`server` ↔ `client`) необхідно оновити сторінку або переініціалізувати компонент.
- **Експорт даних** працює однаково в обох режимах, але в клієнтському режимі фільтри не передаються на сервер (експортуються всі дані).

