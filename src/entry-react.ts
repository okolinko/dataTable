import { createApp, App } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import UniversalDataTable from './components/UniversalDataTable.vue';

import 'primeicons/primeicons.css';

// ===== локалізація =====
const ukrainianLocale = {
    firstDayOfWeek: 1,
    dayNames: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'],
    dayNamesShort: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    dayNamesMin: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    monthNames: [
        'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ],
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

// ===== тема =====
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

const apps = new Map<string, App>();

function generateInstanceId(): string {
    return `udt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Формує payload у форматі, який очікує externalConfig у UniversalDataTable
 */
function buildExternalConfig(config: any) {
    return {
        requestUrl: config.requestUrl,
        storageKey: config.storageKey,
        columns: config.columns,
        filters: config.filters || [],
        order: config.order || {},
        showDownload: config.showDownload ?? false,
        showColumnsButton: config.showColumnsButton ?? true,
        filtersExpanded: config.filtersExpanded ?? true,
        rowsPerPageOptions: config.rowsPerPageOptions || [10, 25, 50, 100],
        scrollable: config.scrollable ?? true,
        toolbarStart: config.toolbarStart || '',
        downloadFilename: config.downloadFilename || 'export',
        downloadFormat: config.downloadFormat || 'xlsx',
        paginationMode: config.paginationMode || 'server',
        requestParams: config.requestParams || {},
        maxRowsPerFile: config.maxRowsPerFile ?? 30000,
    };
}

export function mountUniversalTable(container: HTMLElement | string, config: any): string {
    const target = typeof container === 'string'
        ? document.querySelector(container) as HTMLElement | null
        : container;

    if (!target) {
        console.error('[UniversalDataTable] Container not found');
        return '';
    }

    const existingId = target.dataset.udtInstanceId;
    if (existingId && apps.has(existingId)) {
        unmountUniversalTable(existingId);
    }

    const instanceId = generateInstanceId();
    target.dataset.udtInstanceId = instanceId;

    const externalConfigPayload = buildExternalConfig(config);
    (window as any).datatableConfig = externalConfigPayload;

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
        downloadFormat: config.downloadFormat || 'xlsx',
        paginationMode: config.paginationMode || 'server',
        requestParams: config.requestParams || {},
        maxRowsPerFile: config.maxRowsPerFile ?? 30000,
    });

    app.use(PrimeVue, {
        locale: ukrainianLocale,
        theme: {
            preset: MyCustomTheme,
            options: { darkModeSelector: 'none' }
        }
    });

    app.mount(target);
    apps.set(instanceId, app);

    setTimeout(() => {
        document.dispatchEvent(
            new CustomEvent('datatable:setConfig', {
                detail: externalConfigPayload,
            })
        );
    }, 0);

    return instanceId;
}

export function unmountUniversalTable(instanceId: string): void {
    const app = apps.get(instanceId);
    if (!app) return;

    app.unmount();
    apps.delete(instanceId);

    const el = document.querySelector(`[data-udt-instance-id="${instanceId}"]`) as HTMLElement | null;
    if (el) delete el.dataset.udtInstanceId;
}

export function unmountAllUniversalTables(): void {
    for (const [id] of apps) {
        unmountUniversalTable(id);
    }
}