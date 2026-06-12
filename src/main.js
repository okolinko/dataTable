import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

import UniversalDataTable from './components/UniversalDataTable.vue';

import 'primeicons/primeicons.css';

// ==================== УКРАЇНСЬКА ЛОКАЛІЗАЦІЯ ====================
const ukrainianLocale = {
    firstDayOfWeek: 1,
    dayNames: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'],
    dayNamesShort: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    dayNamesMin: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    monthNames: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
    monthNamesShort: ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Вер', 'Жовт', 'Лист', 'Груд'],
    today: 'Сьогодні',
    clear: 'Очистити',
    dateFormat: 'dd.mm.yy',
    weekHeader: 'Тиж',
    chooseDate: 'Оберіть дату',
    prevMonth: 'Попередній місяць',
    nextMonth: 'Наступний місяць',
    month: 'Місяць',
    week: 'Тиждень',
    day: 'День',
    allDayText: 'Весь день',
    startDate: 'Дата початку',
    endDate: 'Дата закінчення'
};

// Кастомна тема
const MyCustomTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0369a1',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            950: '#032f4c'
        },
        highlight: {
            background: '#e0f2fe',
            focusBackground: '#bae6fd',
            color: '#0369a1',
            focusColor: '#0c4a6e'
        }
    }
});

document.addEventListener('datatable:setConfig', (event) => {
    const config = event.detail;

    const app = createApp(UniversalDataTable, {
        requestUrl: config.requestUrl,
        storageKey: config.storageKey,
        columnsConfig: config.columns,
        filtersConfig: config.filters || [],
        defaultOrder: config.order || {},
        showDownload: config.showDownload ?? false,
        showColumnsButton: config.showColumnsButton ?? true,
        filtersExpanded: config.filtersExpanded ?? true,
        rowsPerPageOptions: config.rowsPerPageOptions || [10, 25, 50, 100],
        scrollable: config.scrollable ?? true,
        toolbarStart: config.toolbarStart || '',
        downloadFilename: config.downloadFilename || 'export',
    });

    app.use(PrimeVue, {
        locale: ukrainianLocale,
        theme: {
            preset: MyCustomTheme,
            options: {
                darkModeSelector: 'none',
            }
        }
    });

    app.mount('#datatable');
});