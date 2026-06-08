# yii-datatable

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Приклади використання та опис функціональних можливостей

```markdown
# Universal DataTable (Vue 3 + PrimeVue)

Потужний універсальний компонент таблиці з підтримкою lazy loading, розширеними фільтрами, кастомними скролбарами та збереженням стану користувача.

## Основні можливості

- Серверна пагінація, сортування та фільтрація (lazy)
- Збереження стану таблиці в `localStorage` (колонки, фільтри, пагінація, сортування)
- Верхній і нижній кастомний горизонтальний скролбар з повною синхронізацією
- Підтримка **computed** колонок (об’єднання кількох полів)
- Кастомний рендеринг комірок через функцію `value()`
- Експорт даних в Excel
- Гнучке налаштування через JavaScript-конфіг
- Динамічне оновлення конфігурації

---

## Приклад використання

```php
<?php App\Assets\DataTablePrimeVueAssets::register($this); ?>

<h1>Квартальна звітність політичних партій</h1>
<div id="datatable"></div>

<script>
const eyeIcon = '<svg ...></svg>';
const clipIcon = '<svg ...></svg>';

const columns = [ /* див. нижче */ ];
const filters = [ /* див. нижче */ ];

const config = {
    requestUrl: '/api/v1/quarter-reports/list',
    storageKey: 'party_quarter_reports',
    columns: columns,
    filters: filters,
    order: { signed_date: 'desc' },
    showDownload: true,
    filtersExpanded: false,
    rowsPerPageOptions: [10, 25, 50, 100],
    scrollable: true
};

window.datatableConfig = config;
document.dispatchEvent(new CustomEvent('datatable:setConfig', { detail: config }));
</script>
```

---

## Типи колонок

### 1. Звичайна колонка

```js
{
    name: 'party_name',
    title: 'Назва політичної партії',
    visible: true,
    sortable: true,
    width: '300px'
}
```

### 2. Computed колонка (дуже рекомендовано для ПІБ)

```js
{
    name: 'full_name',                    // довільне ім'я
    title: 'ПІБ Керівника',
    type: 'computed',
    fields: ['last_name', 'first_name', 'middle_name'],
    visible: true,
    sortable: false
}
```

**Результат у таблиці:** `Шевченко Тарас Григорович`

#### Інші приклади computed колонок:

```js
// Повна адреса
{
    name: 'full_address',
    title: 'Адреса',
    type: 'computed',
    fields: ['region', 'city', 'street', 'building_number'],
    visible: true
}

// ПІБ + посада
{
    name: 'contact_person',
    title: 'Контактна особа',
    type: 'computed',
    fields: ['person_name', 'person_position'],
    visible: true
}

// Назва + код
{
    name: 'party_info',
    title: 'Партія',
    type: 'computed',
    fields: ['party_name', 'party_code'],
    visible: true
}
```

> Компонент автоматично фільтрує `null`, `undefined` та порожні значення.

### 3. Колонка з кастомним рендерингом (`value`)

```js
{
    name: 'status',
    title: 'Статус',
    visible: true,
    value: (data) => {
        if (data.status === 'approved') return `<span class="success">✅ Затверджено</span>`;
        if (data.status === 'rejected') return `<span class="failed">❌ Відхилено</span>`;
        return data.status || '—';
    }
}
```

### 4. Колонка дій (Actions)

```js
{
    name: 'actions',
    title: 'Дії',
    visible: true,
    width: '120px',
    value: (data) => {
        let html = `<a href="/reports/${data.id}/view" class="mr-3" title="Переглянути">${eyeIcon}</a>`;
        
        if (data.has_conclusion) {
            html += `<a href="/reports/${data.id}/conclusion" title="Висновок">${clipIcon}</a>`;
        }
        return html;
    },
    attributes: { class: 'actions-column' }
}
```

### 5. Повна структура колонки

```js
{
    name: string,           // ключ у даних з бекенду
    title: string,          // заголовок у таблиці
    visible: boolean,       // видно за замовчуванням
    sortable: boolean,
    width: string,          // '150px' або '15%'
    type: 'computed',       // тільки для computed
    fields: string[],       // масив полів для type: 'computed'
    value: (data) => string, // кастомний HTML
    attributes: {           // атрибути для <td>
        class: 'text-right font-medium'
    }
}
```

---

## Конфігурація компонента

| Параметр               | Тип           | Опис |
|------------------------|---------------|------|
| `requestUrl`           | `string`      | API ендпоінт (POST) |
| `storageKey`           | `string`      | Ключ для localStorage |
| `columns`              | `array`       | Масив колонок |
| `filters`              | `array`       | Масив фільтрів |
| `order`                | `object`      | Початкове сортування `{field: 'desc'}` |
| `showDownload`         | `boolean`     | Кнопка "Завантажити" |
| `filtersExpanded`      | `boolean`     | Розгорнути фільтри за замовчуванням |
| `rowsPerPageOptions`   | `array`       | Варіанти записів на сторінку |
| `scrollable`           | `boolean`     | Увімкнути кастомні скролбари |

---

## Кастомні скролбари

- Верхній скролбар — прилипає зверху (`position: sticky`)
- Нижній скролбар — можна зробити прилипаючим до низу
- Повна синхронізація між верхнім, нижнім та таблицею
- Перемикається чекбоксом «Верхній/нижній скрол» у налаштуваннях колонок
