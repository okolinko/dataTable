<template>
  <div class="universal-dt-container">

    <Toolbar class="mb-4 bg-light-gray">
      <template #start>
        <div v-if="effectiveToolbarStart" v-html="effectiveToolbarStart"></div>
        <!-- Фільтри з inToolbar: true -->
        <div v-for="filter in toolbarFilters" :key="filter.name" class="inline-toolbar-filter mr-4">
          <label :for="'toolbar-' + filter.name" class="text-sm text-muted mr-2">{{ filter.title }}:</label>
          <Select
              :inputId="'toolbar-' + filter.name"
              v-model="activeFilters[filter.name]"
              :options="normalizeFilterOptions(filter.options, filter.optionLabel, filter.optionValue)"
              optionLabel="label"
              optionValue="value"
              @change="onFilterClear"
              class="toolbar-select"
              :style="{ minWidth: filter.minWidth || '380px' }"
          />
        </div>
      </template>
      <template #end>
        <div class="flex gap-2 align-items-center">

          <Button
              v-if="showDownloadBtn"
              class="p-button-outlined p-button-secondary custom-svg-btn"
              :loading="downloadLoading"
              @click="exportData"
          >
            <span v-html="downloadIcon" class="svg-icon-wrapper"></span>
            <span class="p-button-label">Завантажити</span>
          </Button>

          <div class="p-segmented-button-group flex">
            <Button
                class="p-button-outlined p-button-secondary custom-svg-btn"
                @click="toggleFiltersPanel"
            >
              <span v-html="filterIcon" class="svg-icon-wrapper"></span>
              <span class="p-button-label">Фільтри</span>
            </Button>
            <Button
                class="p-button-outlined p-button-secondary border-left-0 custom-svg-btn px-3"
                @click="toggleFiltersPopover"
                v-tooltip.top="'Налаштування видимих фільтрів'"
            >
              <span v-html="cogIcon" class="svg-icon-wrapper no-margin"></span>
            </Button>
          </div>

          <Popover ref="filtersPopover">
            <div class="flex flex-column gap-2 p-1 max-h-popover">
              <div
                  v-for="filter in filtersState.filter(f => !f.inToolbar)"
                  :key="filter.name"
                  class="flex align-items-center m-2"
              >
                <Checkbox
                    v-model="filter.visible"
                    :binary="true"
                    :inputId="'filter-pop-' + filter.name"
                    @change="saveStateToStorage"
                />
                <label :for="'filter-pop-' + filter.name" class="ml-2 cursor-pointer select-none">
                  {{ filter.title }}
                </label>
              </div>
            </div>
          </Popover>

          <Button
              v-if="effectiveShowColumnsButton"
              type="button"
              class="p-button-outlined p-button-secondary custom-svg-btn"
              @click="toggleColumnsPopover"
          >
            <span v-html="columnsIcon" class="svg-icon-wrapper"></span>
            <span class="p-button-label">Колонки</span>
          </Button>

          <Popover ref="columnsPopover">
            <div class="flex flex-column gap-2 p-1 max-h-popover">
              <div class="flex align-items-center m-2 pb-2 border-bottom-1 surface-border">
                <Checkbox
                    v-model="isScrollEnabled"
                    :binary="true"
                    inputId="toggle-top-scroll"
                    @change="handleScrollToggle"
                />
                <label for="toggle-top-scroll" class="ml-2 font-bold cursor-pointer select-none text-primary">
                  Верхній скрол
                </label>
              </div>
              <div v-for="col in columnsState" :key="col.name || col.title" class="flex align-items-center m-2">
                <Checkbox
                    v-model="col.visible"
                    :binary="true"
                    :inputId="'col-' + col.name"
                    :disabled="col.name === 'actions'"
                    @change="onColumnVisibilityChange"
                />
                <label :for="'col-' + col.name" class="ml-2 cursor-pointer select-none">{{ col.title }}</label>
              </div>
            </div>
          </Popover>

        </div>
      </template>
    </Toolbar>

    <!-- ===== ПАНЕЛЬ ФІЛЬТРІВ ===== -->
    <div v-show="isFiltersPanelOpen" class="filters-panel mb-4">

      <!-- Глобальний пошук — показується тільки в клієнтському режимі -->
      <div v-if="isClientMode" class="global-search-wrapper mb-3">
        <label class="global-search-label">Пошук по таблиці</label>
        <div class="global-search-input-wrap">
          <span v-html="searchIcon" class="global-search-icon"></span>
          <InputText
              v-model="globalSearch"
              placeholder="Введіть для пошуку по всіх колонках..."
              class="global-search-input"
          />
          <button
              v-if="globalSearch"
              class="global-search-clear"
              @click="globalSearch = ''"
              type="button"
          >x</button>
        </div>
      </div>

      <div v-if="hasVisibleFilters">
        <div class="filters-grid mb-3">
          <div
              v-for="filter in filtersState.filter(f => f.visible && !f.inToolbar)"
              :key="filter.name"
              class="filter-field"
              :class="{
          'filter-col-span-2': filter.colSpan === 2,
          'filter-col-span-3': filter.colSpan === 3,
          'range-filter-wrapper': filter.type === 'range'
        }"
          >

            <label :for="'field-' + filter.name">{{ filter.title }}</label>

            <Select
                v-if="filter.type === 'select'"
                :key="'select-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                :options="normalizeFilterOptions(filter.options, filter.optionLabel, filter.optionValue)"
                optionLabel="label"
                optionValue="value"
                showClear
                @change="onFilterClear"
                :placeholder="filter.placeholder || 'Оберіть...'"
            />

            <MultiSelect
                v-else-if="filter.type === 'multiselect'"
                :key="'multi-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                :options="normalizeFilterOptions(filter.options, filter.optionLabel, filter.optionValue)"
                optionLabel="label"
                optionValue="value"
                display="chip"
                showClear
                :placeholder="filter.placeholder || 'Оберіть...'"
                @change="onFilterClear"
                :maxSelectedLabels="3"
            />

            <div v-else-if="filter.type === 'range'" class="range-filter-field">
              <div class="range-inputs">
                <InputNumber
                    :inputId="'field-' + filter.name + '_from'"
                    v-model="activeFilters[filter.name].from"
                    :placeholder="filter.placeholderFrom || 'Від'"
                    :useGrouping="false"
                    showClear
                    @input="(e) => onRangeFilterInput(e, filter.name, 'from')"
                    @clear="() => onRangeFilterClear(filter.name, 'from')"
                />
                <span class="range-separator">—</span>
                <InputNumber
                    :inputId="'field-' + filter.name + '_to'"
                    v-model="activeFilters[filter.name].to"
                    :placeholder="filter.placeholderTo || 'До'"
                    :useGrouping="false"
                    showClear
                    @input="(e) => onRangeFilterInput(e, filter.name, 'to')"
                    @clear="() => onRangeFilterClear(filter.name, 'to')"
                />
              </div>
            </div>

            <div
                v-else-if="filter.type === 'select-with-other'"
                class="filter-field"
            >
              <div class="select-with-other-wrapper">
                <!-- Селект стандартної ширини -->
                <Select
                    :inputId="'field-' + filter.name"
                    v-model="activeFilters[filter.name + '_select']"
                    :options="normalizeFilterOptions(filter.options, filter.optionLabel, filter.optionValue)"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="filter.placeholder || 'Оберіть...'"
                    showClear
                    @change="onSelectWithOtherChange(filter.name)"
                    class="w-full"
                />

                <!-- Вспливаюче поле "Інше" -->
                <Transition name="slide-down">
                  <InputText
                      v-if="isOtherSelected(filter.name)"
                      :id="'field-' + filter.name + '-other'"
                      v-model="activeFilters[filter.name + '_other']"
                      :placeholder="filter.otherPlaceholder || 'Вкажіть значення...'"
                      class="mt-2 w-full"
                      @input="() => onOtherTextInput(filter.name)"
                  />
                </Transition>
              </div>
            </div>

            <DatePicker
                v-else-if="filter.type === 'date'"
                :key="'date-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                showClear
                @update:modelValue="onFilterDateUpdate"
                @clear="onFilterClear"
                :placeholder="filter.placeholder || 'РРРР-ММ-ДД'"
            />

            <DatePicker
                v-else-if="filter.type === 'date_range'"
                :key="'date-range-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                selectionMode="range"
                dateFormat="dd.mm.yy"
                showIcon
                iconDisplay="input"
                showClear
                :manualInput="true"
                :hideOnRangeSelection="false"
                @update:modelValue="onDateRangeUpdate(filter.name, $event)"
                @clear="onFilterClear"
                :placeholder="filter.placeholder || 'ДД.ММ.РРРР - ДД.ММ.РРРР'"
            />

            <InputNumber
                v-else-if="filter.type === 'integer'"
                :key="'int-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                :useGrouping="false"
                showClear
                @input="(e) => onIntegerFilterInput(e, filter.name)"
                @clear="onFilterClear"
                :placeholder="filter.placeholder || 'Введіть число...'"
            />

            <DatePicker
                v-else-if="filter.type === 'year'"
                :key="'year-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                view="year"
                dateFormat="yy"
                showIcon
                iconDisplay="input"
                showClear
                @update:modelValue="onFilterDateUpdate"
                @clear="onFilterClear"
                :placeholder="filter.placeholder || 'РРРР'"
            />

            <InputText
                v-else-if="['text', 'string', 'varchar'].includes(filter.type) || !filter.type"
                :key="'text-' + filter.name"
                :id="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                @input="(event) => onTextFilterInput(event, filter.name)"
                @change="(event) => onTextFilterInput(event, filter.name)"
                :placeholder="filter.placeholder || 'Введіть значення...'"
            />
          </div>
        </div>



      </div>

      <!-- Якщо фільтри приховані, але є глобальний пошук — не показуємо повідомлення -->
      <div v-else-if="!isClientMode" class="text-muted text-center py-2">
        Всі фільтри приховані. Увімкніть потрібні через налаштування поруч із кнопкою "Фільтри".
      </div>
      <div v-else-if="isClientMode && !hasVisibleFilters" class="text-muted text-center py-2">
        Всі фільтри приховані. Увімкніть потрібні через налаштування поруч із кнопкою "Фільтри".
      </div>
    </div>

    <!-- ===== БЛОК ЗАСТОСОВАНИХ ФІЛЬТРІВ ===== -->
    <div v-if="hasActiveFilters" class="applied-filters-bar">
      <div class="applied-filters-content">

        <!-- Ліва частина: чіпи -->
        <div class="applied-filters-left">
          <span class="applied-filters-label">Застосовані фільтри:</span>

          <span
              v-for="(filter, name) in activeFilterChips"
              :key="name"
              class="applied-filter-chip"
          >
            <strong>{{ filter.title }}:</strong>
            {{ filter.value }}
            <span
                class="chip-remove"
                @click.stop="removeSingleFilter(name)"
            >×</span>
          </span>
        </div>

        <!-- Права частина: кнопка -->
        <div class="applied-filters-right">
          <Button
              class="p-button-outlined p-button-secondary p-button-sm"
              @click="clearAllFilters"
          >
            <span v-html="resetFilterIcon" class="svg-icon-wrapper me-1"></span>
            Скинути всі
          </Button>
        </div>

      </div>
    </div>

    <!-- Верхній кастомний скрол -->
    <div
        v-if="isScrollEnabled"
        ref="topScrollContainer"
        class="top-scrollbar-container"
        @scroll="syncTopToTable"
    >
      <div :style="{ width: tableInnerWidth + 'px' }" class="top-scrollbar-filler"></div>
    </div>

    <div ref="dtWrapper" class="dt-responsive-wrapper">

      <!-- ===== КЛІЄНТСЬКИЙ РЕЖИМ (paginationMode: 'client') ===== -->
      <DataTable
          v-if="isClientMode"
          :value="clientFilteredItems"
          paginator
          :rows="clientRows"
          :loading="loading"
          :first="clientFirst"
          @page="onClientPage"
          @sort="onClientSort"
          :sortField="clientSortField"
          :sortOrder="clientSortOrder"
          paginatorTemplate="CurrentPageReport RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          :rowsPerPageOptions="effectiveRowsPerPageOptions"
          currentPageReportTemplate="Показано з {first} по {last} із {totalRecords} записів"
      >
        <template v-for="col in columnsState" :key="col.name || col.title">
          <Column
              v-if="col.visible"
              :field="col.name"
              :header="col.title"
              :sortable="col.sortable || false"
              :class="col.bodyClass || col.class || ''"
              :headerClass="col.headerClass || ''"
              :bodyClass="col.bodyClass || col.class || ''"
              :footerClass="col.footerClass || ''"
              :style="{ width: col.width || 'auto' }"
          >
            <template #body="slotProps">
              <template v-if="typeof col.value === 'function'">
                <span v-html="col.value(slotProps.data)"></span>
              </template>
              <template v-else-if="col.type === 'computed' && col.fields && Array.isArray(col.fields)">
                {{ col.fields.map(f => slotProps.data[f]).filter(Boolean).join(' ') }}
              </template>
              <template v-else>
                {{ slotProps.data[col.name] }}
              </template>
            </template>
          </Column>
        </template>
      </DataTable>

      <!-- ===== СЕРВЕРНИЙ РЕЖИМ (paginationMode: 'server' або за замовч.) ===== -->
      <DataTable
          v-else
          :value="items"
          lazy
          paginator
          :rows="lazyParams.rows"
          :totalRecords="totalRecords"
          :loading="loading"
          :first="dtFirstOffset"
          @page="onPage"
          @sort="onSort"
          :sortField="lazyParams.sortField"
          :sortOrder="lazyParams.sortOrder === 'desc' ? -1 : 1"
          paginatorTemplate="CurrentPageReport RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          :rowsPerPageOptions="effectiveRowsPerPageOptions"
          currentPageReportTemplate="Показано з {first} по {last} із {totalRecords} записів"
      >
        <template v-for="col in columnsState" :key="col.name || col.title">
          <Column
              v-if="col.visible"
              :field="col.name"
              :header="col.title"
              :sortable="col.sortable || false"
              :class="col.bodyClass || col.class || ''"
              :headerClass="col.headerClass || ''"
              :bodyClass="col.bodyClass || col.class || ''"
              :footerClass="col.footerClass || ''"
              :style="{ width: col.width || 'auto' }"
          >
            <template #body="slotProps">
              <template v-if="typeof col.value === 'function'">
                <span v-html="col.value(slotProps.data)"></span>
              </template>
              <template v-else-if="col.type === 'computed' && col.fields && Array.isArray(col.fields)">
                {{ col.fields.map(f => slotProps.data[f]).filter(Boolean).join(' ') }}
              </template>
              <template v-else>
                {{ slotProps.data[col.name] }}
              </template>
            </template>
          </Column>
        </template>
      </DataTable>

    </div>

    <!-- Нижній кастомний скрол -->
    <div
        ref="bottomScrollContainer"
        class="bottom-scrollbar-container"
        @scroll="syncBottomToTable"
    >
      <div :style="{ width: tableInnerWidth + 'px' }" class="bottom-scrollbar-filler"></div>
    </div>

  </div>
</template>

<script setup lang="ts" generic="TRow extends Record<string, unknown> = Record<string, unknown>">
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import Popover from 'primevue/popover';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import MultiSelect from 'primevue/multiselect';

import type {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  LazyParams,
  PaginationMode,
  DownloadFormat,
  DataTablePageEvent,
  DataTableSortEvent,
  RangeFilterValue,
} from './types';

import {
  columnsIcon,
  filterIcon,
  downloadIcon,
  cogIcon,
  resetFilterIcon,
  searchIcon,
} from './constants/icons';

import { useScrollSync } from './composables/useScrollSync';
import { useTableStorage } from './composables/useTableStorage';
import { useTableData } from './composables/useTableData';
import { useClientFilters } from './composables/useClientFilters';
import { useExport } from './composables/useExport';
import { getEmptyFilterValue, normalizeFilterOptions } from './utils/filters';

// ====================== PROPS ======================

const props = defineProps<{
  requestUrl?: string
  storageKey?: string
  columnsConfig: ColumnConfig<TRow>[]
  filtersConfig?: FilterConfig[]
  defaultOrder?: Record<string, 'asc' | 'desc'>
  showDownload?: boolean
  showColumnsButton?: boolean
  filtersExpanded?: boolean
  rowsPerPageOptions?: number[]
  scrollable?: boolean
  toolbarStart?: string
  downloadFilename?: string
  downloadFormat?: DownloadFormat
  paginationMode?: PaginationMode
  requestParams?: Record<string, unknown>
  maxRowsPerFile?: number
}>()

// ====================== EXTERNAL CONFIG ======================

const externalConfig = ref<TableConfig<TRow> | null>(null);

const effectiveRequestUrl = computed(
    () => externalConfig.value?.requestUrl || props.requestUrl
);
const effectiveStorageKey = computed(
    () => externalConfig.value?.storageKey || props.storageKey
);
const effectiveColumns = computed(
    () => externalConfig.value?.columns || props.columnsConfig
);
const effectiveFilters = computed(
    () => externalConfig.value?.filters || props.filtersConfig || []
);
const effectiveOrder = computed(
    () => externalConfig.value?.order || props.defaultOrder || {}
);
const effectiveShowDownload = computed(
    () => externalConfig.value?.showDownload ?? props.showDownload ?? false
);
const effectiveFiltersExpanded = computed(
    () => externalConfig.value?.filtersExpanded ?? props.filtersExpanded ?? true
);
const effectiveRowsPerPageOptions = computed(
    () =>
        externalConfig.value?.rowsPerPageOptions ||
        props.rowsPerPageOptions || [10, 25, 50]
);
const effectiveScrollable = computed(
    () => externalConfig.value?.scrollable ?? props.scrollable ?? true
);
const effectiveToolbarStart = computed(
    () => externalConfig.value?.toolbarStart || props.toolbarStart || ''
);
const effectiveDownloadFilename = computed(
    () =>
        externalConfig.value?.downloadFilename ||
        props.downloadFilename ||
        'report'
);
const effectiveDownloadFormat = computed<DownloadFormat>(
    () => externalConfig.value?.downloadFormat || props.downloadFormat || 'xlsx'
);
const effectiveShowColumnsButton = computed(
    () =>
        externalConfig.value?.showColumnsButton ??
        props.showColumnsButton ??
        true
);
const effectivePaginationMode = computed<PaginationMode>(
    () =>
        externalConfig.value?.paginationMode ||
        props.paginationMode ||
        'server'
);
const effectiveRequestParams = computed(
    () => externalConfig.value?.requestParams || props.requestParams || {}
);
const effectiveMaxRowsPerFile = computed(
    () => externalConfig.value?.maxRowsPerFile ?? props.maxRowsPerFile ?? 30000
);

const isClientMode = computed(
    () => effectivePaginationMode.value === 'client'
);

// ====================== UI STATE ======================

const columnsPopover = ref<InstanceType<typeof Popover> | null>(null);
const filtersPopover = ref<InstanceType<typeof Popover> | null>(null);
const isFiltersPanelOpen = ref(true);
const columnsState = ref<ColumnConfig<TRow>[]>([]);
const filtersState = ref<FilterConfig[]>([]);
const activeFilters = reactive<Record<string, unknown>>({});
const lazyParams = ref<LazyParams>({
  page: 1,
  rows: 10,
  sortField: 'id',
  sortOrder: 'desc',
});

const globalSearch = ref('');
const clientRows = ref(10);
const clientFirst = ref(0);
const clientSortField = ref<string | null>(null);
const clientSortOrder = ref(1);

const isScrollEnabled = ref(true);
const dtWrapper = ref<HTMLElement | null>(null);
const downloadLoading = ref(false);

let isInitializing = false;
let filterTimeout: ReturnType<typeof setTimeout> | null = null;

// ====================== COMPOSABLES ======================

const { loadStateFromStorage, saveStateToStorage: persistState } =
    useTableStorage(effectiveStorageKey);

const {
  topScrollContainer,
  bottomScrollContainer,
  tableInnerWidth,
  updateScrollDimensions,
  syncTopToTable,
  syncBottomToTable,
  setupScrollSync,
  destroyScrollSync,
} = useScrollSync(isScrollEnabled, dtWrapper);

const { items, allClientItems, totalRecords, loading, loadData } =
    useTableData<TRow>({
      requestUrl: effectiveRequestUrl,
      storageKey: effectiveStorageKey,
      requestParams: effectiveRequestParams,
      filtersState,
      activeFilters,
      lazyParams,
      isClientMode,
      onAfterLoad: () => {
        nextTick(() => updateScrollDimensions());
      },
    });

const { clientFilteredItems, activeFilterChips, hasActiveFilters } =
    useClientFilters<TRow>({
      allClientItems,
      columnsState,
      filtersState,
      activeFilters,
      globalSearch,
    });

const { exportData } = useExport<TRow>({
  requestUrl: effectiveRequestUrl,
  requestParams: effectiveRequestParams,
  filtersState,
  activeFilters,
  lazyParams,
  downloadFilename: effectiveDownloadFilename,
  downloadFormat: effectiveDownloadFormat,
  maxRowsPerFile: effectiveMaxRowsPerFile,
  downloadLoading,
});

// ====================== COMPUTED ======================

const dtFirstOffset = computed(
    () => (lazyParams.value.page - 1) * lazyParams.value.rows
);

const toolbarFilters = computed(() =>
    filtersState.value.filter((f) => f.inToolbar === true)
);

const hasVisibleFilters = computed(() =>
    filtersState.value.some((f) => f.visible)
);

const showDownloadBtn = computed(() => effectiveShowDownload.value);

// ====================== STORAGE HELPERS ======================

const saveStateToStorage = () => {
  persistState({
    isFiltersPanelOpen: isFiltersPanelOpen.value,
    isScrollEnabled: isScrollEnabled.value,
    lazyParams: lazyParams.value,
    // storage зберігає лише name/visible — приводимо тип
    columns: columnsState.value as ColumnConfig[],
    filters: filtersState.value,
    activeFilters,
    isInitializing,
  });
};

const forceUpdateDatePickers = () => {
  nextTick(() => {
    effectiveFilters.value.forEach((f) => {
      if (f.type === 'date_range' && activeFilters[f.name]) {
        const currentValue = [...(activeFilters[f.name] as unknown[])];
        activeFilters[f.name] = null;
        nextTick(() => {
          activeFilters[f.name] = currentValue;
        });
      }
    });
  });
};

const initState = () => {
  isInitializing = true;
  const savedState = loadStateFromStorage();
  const defaultRows = effectiveRowsPerPageOptions.value[0] || 10;

  isFiltersPanelOpen.value =
      savedState?.isFiltersPanelOpen ?? effectiveFiltersExpanded.value;
  isScrollEnabled.value =
      externalConfig.value?.scrollable ??
      savedState?.isScrollEnabled ??
      effectiveScrollable.value;

  columnsState.value = effectiveColumns.value.map((col) => {
    if (col.type === 'computed') {
      return { ...col, visible: true };
    }
    const savedCol = savedState?.columns?.find((c) => c.name === col.name);
    return {
      ...col,
      visible: savedCol?.visible ?? col.visible !== false,
      class: col.class || col.attributes?.class,
      bodyClass: col.bodyClass || col.class,
    };
  });

  filtersState.value = effectiveFilters.value.map((f) => {
    const savedFilter = savedState?.filtersVisibility?.find(
        (sf) => sf.name === f.name
    );
    return {
      ...f,
      visible: f.inToolbar
          ? true
          : (savedFilter?.visible ?? f.visible !== false),
    };
  });

  Object.keys(activeFilters).forEach((key) => delete activeFilters[key]);

  effectiveFilters.value.forEach((f) => {
    const savedValue = savedState?.activeFilters?.[f.name];

    if ((f.type === 'date' || f.type === 'year') && savedValue) {
      activeFilters[f.name] = new Date(String(savedValue));
    } else if (f.type === 'date_range' && Array.isArray(savedValue)) {
      activeFilters[f.name] = savedValue.map((d) => {
        if (!d) return null;
        const date = new Date(String(d));
        return isNaN(date.getTime()) ? null : date;
      });
    } else if (f.type === 'range') {
      const range = savedValue as RangeFilterValue | undefined;
      activeFilters[f.name] = {
        from: range?.from ?? null,
        to: range?.to ?? null,
      };
    } else if (f.type === 'multiselect') {
      activeFilters[f.name] = Array.isArray(savedValue) ? savedValue : [];
    } else {
      activeFilters[f.name] = savedValue !== undefined ? savedValue : '';
    }

    if (f.type === 'select-with-other') {
      if (activeFilters[f.name + '_select'] === undefined) {
        activeFilters[f.name + '_select'] = null;
      }
      if (activeFilters[f.name + '_other'] === undefined) {
        activeFilters[f.name + '_other'] = '';
      }
    }

    if (
        f.inToolbar === true &&
        f.defaultValue !== undefined &&
        (activeFilters[f.name] === '' ||
            activeFilters[f.name] === null ||
            activeFilters[f.name] === undefined)
    ) {
      activeFilters[f.name] = f.defaultValue;
    }
  });

  lazyParams.value = {
    page: savedState?.lazyParams?.page || 1,
    rows: savedState?.lazyParams?.rows || defaultRows,
    sortField:
        savedState?.lazyParams?.sortField ||
        Object.keys(effectiveOrder.value)[0] ||
        'id',
    sortOrder: savedState?.lazyParams?.sortOrder || 'desc',
  };

  clientRows.value = lazyParams.value.rows;
  clientFirst.value = 0;

  nextTick(() => {
    isInitializing = false;
    setupScrollSync();
    forceUpdateDatePickers();
  });
};

// ====================== FILTER HANDLERS ======================

const debounceFilter = () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => triggerFilterApply(), 500);
};

const triggerFilterApply = () => {
  lazyParams.value.page = 1;
  saveStateToStorage();
  loadData();
};

const onIntegerFilterInput = (
    event: { value?: number | null },
    filterName: string
) => {
  activeFilters[filterName] =
      event.value !== undefined && event.value !== null
          ? Number(event.value)
          : null;
  if (!isClientMode.value) debounceFilter();
};

const onRangeFilterInput = (
    event: { value?: number | null },
    filterName: string,
    field: 'from' | 'to'
) => {
  if (!activeFilters[filterName]) {
    activeFilters[filterName] = { from: null, to: null };
  }
  const range = activeFilters[filterName] as RangeFilterValue;
  range[field] =
      event.value !== undefined && event.value !== null
          ? Number(event.value)
          : null;
  if (!isClientMode.value) debounceFilter();
};

const onRangeFilterClear = (filterName: string, field: 'from' | 'to') => {
  if (activeFilters[filterName]) {
    (activeFilters[filterName] as RangeFilterValue)[field] = null;
  }
  if (!isClientMode.value) triggerFilterApply();
};

const onTextFilterInput = (event: Event, filterName: string) => {
  const rawValue = (event.target as HTMLInputElement | null)?.value || '';
  const trimmedValue = rawValue.trim();
  if (activeFilters[filterName] !== trimmedValue) {
    activeFilters[filterName] = trimmedValue;
  }
  if (!isClientMode.value) debounceFilter();
};

const onFilterClear = () => {
  if (!isClientMode.value) {
    triggerFilterApply();
    return;
  }
  clientFirst.value = 0;
};

const onFilterDateUpdate = () => {
  if (!isClientMode.value) triggerFilterApply();
};

const onDateRangeUpdate = (filterName: string, value: unknown) => {
  if (!Array.isArray(value)) {
    activeFilters[filterName] = value;
    return;
  }
  activeFilters[filterName] = value;
  const [start, end] = value as [Date, Date];
  if (start && end && !isClientMode.value) {
    triggerFilterApply();
  }
};

const isOtherSelected = (filterName: string) => {
  const selectVal = activeFilters[filterName + '_select'];
  if (!selectVal) return false;
  const filter = filtersState.value.find((f) => f.name === filterName);
  const otherLabel = filter?.otherLabel || 'Інше';
  return (
      selectVal === 'Інше' ||
      selectVal === 'other' ||
      selectVal === otherLabel
  );
};

const onSelectWithOtherChange = (filterName: string) => {
  const selectVal = activeFilters[filterName + '_select'];
  const filter = filtersState.value.find((f) => f.name === filterName);
  const otherLabel = filter?.otherLabel || 'Інше';

  if (
      selectVal === 'Інше' ||
      selectVal === 'other' ||
      selectVal === otherLabel
  ) {
    activeFilters[filterName] = null;
  } else {
    activeFilters[filterName] = selectVal;
    activeFilters[filterName + '_other'] = '';
  }

  if (!isClientMode.value) triggerFilterApply();
};

const onOtherTextInput = (filterName: string) => {
  const otherValue = String(
      activeFilters[filterName + '_other'] ?? ''
  ).trim();
  activeFilters[filterName] = otherValue || null;
  if (!isClientMode.value) debounceFilter();
};

const removeSingleFilter = (filterName: string) => {
  const filter = filtersState.value.find((f) => f.name === filterName);
  if (!filter) return;

  activeFilters[filterName] = getEmptyFilterValue(filter.type);

  if (filter.type === 'select-with-other') {
    activeFilters[filterName + '_select'] = null;
    activeFilters[filterName + '_other'] = '';
  }

  if (!isClientMode.value) triggerFilterApply();
};

const clearAllFilters = async () => {
  if (filterTimeout) {
    clearTimeout(filterTimeout);
    filterTimeout = null;
  }

  globalSearch.value = '';

  effectiveFilters.value.forEach((f) => {
    activeFilters[f.name] = getEmptyFilterValue(f.type);
    if (f.type === 'select-with-other') {
      activeFilters[f.name + '_select'] = null;
      activeFilters[f.name + '_other'] = '';
    }
  });

  lazyParams.value.page = 1;
  clientFirst.value = 0;

  await nextTick();
  saveStateToStorage();

  if (!isClientMode.value) {
    await loadData();
  }
};

// ====================== TABLE HANDLERS ======================

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.rows = event.rows;
  saveStateToStorage();
  loadData();
};

const onSort = (event: DataTableSortEvent) => {
  if (!event.sortField) return;
  lazyParams.value.sortField = String(event.sortField);

  if (event.sortOrder !== null && event.sortOrder !== undefined) {
    lazyParams.value.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
  } else {
    lazyParams.value.sortOrder =
        lazyParams.value.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  lazyParams.value.page = 1;
  saveStateToStorage();
  loadData();
};

const onClientPage = (event: DataTablePageEvent) => {
  clientRows.value = event.rows;
  clientFirst.value = event.first;
  lazyParams.value.rows = event.rows;
  saveStateToStorage();
};

const onClientSort = (event: DataTableSortEvent) => {
  if (!event.sortField) return;
  clientSortField.value = String(event.sortField);
  if (
      clientSortField.value === event.sortField &&
      event.sortOrder === null
  ) {
    clientSortOrder.value = clientSortOrder.value === 1 ? -1 : 1;
  } else {
    clientSortOrder.value = event.sortOrder ?? 1;
  }
};

const toggleFiltersPanel = () => {
  isFiltersPanelOpen.value = !isFiltersPanelOpen.value;
  saveStateToStorage();
};

const toggleColumnsPopover = (event: Event) => {
  columnsPopover.value?.toggle(event);
};

const toggleFiltersPopover = (event: Event) => {
  filtersPopover.value?.toggle(event);
};

const handleScrollToggle = () => {
  saveStateToStorage();
  if (isScrollEnabled.value) setupScrollSync();
  else destroyScrollSync();
};

const onColumnVisibilityChange = () => {
  saveStateToStorage();
  setTimeout(() => updateScrollDimensions(), 50);
};

// ====================== LIFECYCLE ======================

watch(clientFilteredItems, () => {
  clientFirst.value = 0;
});

watch(
    () => effectiveStorageKey.value,
    (newKey) => {
      if (newKey && newKey !== 'undefined') {
        initState();
        loadData();
      }
    },
    { immediate: true }
);

watch(
    activeFilters,
    () => {
      saveStateToStorage();
      if (!isClientMode.value && !isInitializing) {
        debounceFilter();
      }
    },
    { deep: true }
);

onMounted(() => {
  const handleConfig = (config: TableConfig<TRow> | null) => {
    externalConfig.value = config ? { ...config } : null;
    nextTick(() => {
      initState();
      loadData();
    });
  };

  document.addEventListener('datatable:setConfig', ((e: CustomEvent) => {
    handleConfig(e.detail as TableConfig<TRow>);
  }) as EventListener);

  const win = window as Window & { datatableConfig?: TableConfig<TRow> };
  if (win.datatableConfig) {
    handleConfig(win.datatableConfig);
  }

  document.addEventListener('datatable:setFilter', ((e: CustomEvent) => {
    const { name, value } = (e.detail ?? {}) as {
      name?: string;
      value?: unknown;
    };
    if (!name || value === undefined) return;

    const filterConfig = filtersState.value.find((f) => f.name === name);
    if (filterConfig?.type === 'date_range' && Array.isArray(value)) {
      activeFilters[name] = value;
    } else {
      activeFilters[name] = value;
    }

    if (!isClientMode.value) triggerFilterApply();
  }) as EventListener);
});

onBeforeUnmount(() => {
  destroyScrollSync();
});
</script>

<style scoped>
/* ====================== ЗАГАЛЬНІ УТИЛІТИ ====================== */
.universal-dt-container { font-family: sans-serif; }
.mb-4 { margin-bottom: 1.5rem; }
.mb-3 { margin-bottom: 1rem; }
.ml-2 { margin-left: 0.5rem; }
.pb-2 { padding-bottom: 0.5rem; }
.flex { display: flex; }
.flex-column { flex-direction: column; }
.align-items-center { align-items: center; }
.justify-content-end { justify-content: flex-end; }
.m-2 { margin: 0.5rem; }
.gap-2 { gap: 0.5rem; }
.px-3 { padding-left: 1rem !important; padding-right: 1rem !important; }
.pt-3 { padding-top: 1rem; }
.border-top-1 { border-top: 1px solid #dee2e6; }
.border-bottom-1 { border-bottom: 1px solid #dee2e6; }
.cursor-pointer { cursor: pointer; }
.select-none { user-select: none; }
.font-bold { font-weight: bold; }
.text-center { text-align: center; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }

/* ====================== КОЛЬОРИ ====================== */
.text-primary { color: #21cc51 !important; }
.text-muted { color: #6c757d; font-size: 14px; }

/* ====================== ТУЛБАР ====================== */
.bg-light-gray {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  border-radius: 6px;
}

/* ====================== SVG-КНОПКИ ====================== */
.custom-svg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.svg-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: #555555;
  transition: color 0.15s ease-in-out;
}

.p-button-warning .svg-icon-wrapper { color: #212529; }
.p-button-warning:hover .svg-icon-wrapper { color: #000000; }
.p-button-outlined:hover .svg-icon-wrapper { color: #3b82f6; }
.p-button-secondary.p-button-outlined:hover .svg-icon-wrapper { color: #4b5563; }

/* ====================== КНОПКИ (ПРИМЕВЮ OVERRIDES) ====================== */
.p-button-outlined.p-button-secondary:not(:disabled):hover {
  background: #e2e8f0;
  border: 1px solid #e2e8f0;
  color: #334155;
}

/* ====================== СЕГМЕНТОВАНА ГРУПА КНОПОК ====================== */
.border-left-0 {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  border-left: 0 !important;
}

.p-segmented-button-group .p-button:first-child {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

/* ====================== ПОПОВЕР ====================== */
.max-h-popover {
  max-height: 600px !important;
  overflow-y: auto;
}

/* ====================== ПАНЕЛЬ ФІЛЬТРІВ ====================== */
.filters-panel {
  background: #ffffff;
  border: 1px solid #dee2e6;
  padding: 20px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.filter-field {
  display: flex;
  flex-direction: column;
}

.filter-field label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
  min-height: 30px;
}

/* ====================== ФІЛЬТР ДІАПАЗОНУ (range) ====================== */
.range-filter-wrapper {
  grid-column: span 2;
  min-width: 250px;
}

.range-filter-field {
  display: flex;
  flex-direction: column;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
}

.range-inputs .p-inputnumber {
  flex: 1;
}

.range-separator {
  color: #6c757d;
  font-size: 1.3em;
  padding: 0 6px;
  align-self: center;
}

/* ====================== ГЛОБАЛЬНИЙ ПОШУК ====================== */
.global-search-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.global-search-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.global-search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.global-search-icon {
  position: absolute;
  left: 10px;
  display: inline-flex;
  align-items: center;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.global-search-input {
  width: 100%;
  padding-left: 34px !important;
  padding-right: 34px !important;
}

.global-search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.global-search-clear:hover {
  color: #374151;
  background: #e5e7eb;
}

/* ====================== ВЕРХНІЙ КАСТОМНИЙ СКРОЛБАР ====================== */
.top-scrollbar-container {
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 4px;
  height: 13px;
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
  display: block;
}

.top-scrollbar-container::-webkit-scrollbar { height: 9px; }
.top-scrollbar-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
.top-scrollbar-container::-webkit-scrollbar-thumb { background: #8b8b8b; border-radius: 4px; }
.top-scrollbar-container::-webkit-scrollbar-thumb:hover { background: #6c6b6b; }

.top-scrollbar-filler { height: 1px; }

/* ====================== НИЖНІЙ КАСТОМНИЙ СКРОЛБАР ====================== */
.bottom-scrollbar-container {
  overflow-x: auto;
  overflow-y: hidden;
  margin-top: 4px;
  height: 13px;
  position: sticky;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1;
  display: block;
  background: #ffffff;
}

.bottom-scrollbar-container::-webkit-scrollbar { height: 9px; }
.bottom-scrollbar-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
.bottom-scrollbar-container::-webkit-scrollbar-thumb { background: #8b8b8b; border-radius: 4px; }
.bottom-scrollbar-container::-webkit-scrollbar-thumb:hover { background: #6c6b6b; }

.bottom-scrollbar-filler { height: 1px; }

/* ====================== ОБГОРТКА ТАБЛИЦІ ====================== */
.dt-responsive-wrapper {
  width: 100%;
  overflow: hidden;
}

.p-datatable-tbody td.text-center {
  text-align: center !important;
}

.p-datatable-tbody td.text-right {
  text-align: right !important;
}

.p-datatable-tbody td.text-left {
  text-align: left !important;
}

/* ====================== DEEP: ТАБЛИЦЯ (PRIMEVUE OVERRIDES) ====================== */

/* Ховаємо нативний горизонтальний скрол таблиці — використовуємо кастомний */
:deep(.p-datatable-table-container)::-webkit-scrollbar { display: none; }
:deep(.p-datatable-table-container) {
  -ms-overflow-style: none; /* IE / Edge */
  scrollbar-width: none;    /* Firefox */
}

/* ВИПРАВЛЕНО: центрування тексту в комірках */
:deep(.p-datatable-tbody td.text-center) {
  text-align: center !important;
}

:deep(.p-datatable-tbody td.text-right) {
  text-align: right !important;
}

:deep(.p-datatable-tbody td.text-left) {
  text-align: left !important;
}

/* Статуси у колонках */
:deep(.success) {
  color: #0a570a;
  font-weight: 600;
}

:deep(.failed) {
  color: #bb0e4a;
  font-weight: 600;
}

/* Колонка дій */
:deep(.actions-column) {
  width: max-content;
}

:deep(.actions-column a svg) {
  fill: #244464;
  transition: fill 0.2s;
  margin-right: 5px;
}

:deep(.actions-column a svg:hover) {
  fill: #e8a51f;
}
:deep(.text-center) {
  text-align: center !important;
}

.applied-filters-bar {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.applied-filters-content {
  display: flex;
  align-items: flex-start;
  flex-wrap: nowrap;
  gap: 12px;
  width: 100%;
}

.applied-filters-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 auto;
}

.applied-filters-label {
  font-weight: 600;
  color: #6c757d;
  white-space: nowrap;
  margin-right: 4px;
  padding-top: 2px; /* невелике коригування */
}

.applied-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.95rem;
  white-space: nowrap;
  margin-bottom: 4px;
}

.chip-remove {
  font-size: 1.35em;
  line-height: 1;
  cursor: pointer;
  opacity: 0.85;
  padding: 0 4px;
}

.chip-remove:hover {
  opacity: 1;
}

.applied-filters-right {
  flex-shrink: 0;
  margin-left: auto;
  padding-top: 2px;
}


@media (max-width: 768px) {
  .applied-filters-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

/* Кастомні ширини */
.filter-col-span-2 {
  grid-column: span 2;
}

.filter-col-span-3 {
  grid-column: span 3;
}

/* Якщо потрібно ще більше контролю */
.filter-field {
  min-width: 0;
}

.inline-toolbar-filter {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.toolbar-select {
  min-width: 380px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 60px;
}
.select-with-other-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Примусово робимо Select стандартної ширини */
.select-with-other-wrapper :deep(.p-select) {
  width: 100% !important;
  max-width: 100% !important;
}
</style>
