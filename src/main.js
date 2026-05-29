import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import UniversalDataTable from './components/UniversalDataTable.vue';

import 'primeicons/primeicons.css';
// Створюємо кастомний пресет на основі Aura
const MyCustomTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0369a1', // Наш основний синій колір
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            950: '#032f4c'
        },
        highlight: {
            background: '#e0f2fe', // світло-синій фон для виділених рядків (sky-100)
            focusBackground: '#bae6fd',
            color: '#0369a1',      // колір тексту для виділених елементів
            focusColor: '#0c4a6e'
        }
    }
});
// Чекаємо на подію setConfig, яку згенерує твій Yii2 View
document.addEventListener('datatable:setConfig', (event) => {
    const config = event.detail;

    // Створюємо додаток відразу навколо універсального компонента
    const app = createApp(UniversalDataTable, {
        requestUrl: config.requestUrl,
        columnsConfig: config.columns,
        filtersConfig: config.filters,
        defaultOrder: config.order || {},
        showDownload: config.showDownload || false // Передаємо сюди!
    });


    app.use(PrimeVue, {
        theme: {
            preset: MyCustomTheme,
            options: {
                darkModeSelector: 'none',
            }
        }
    });

    // Монтуємо у ваш div
    app.mount('#datatable');
});