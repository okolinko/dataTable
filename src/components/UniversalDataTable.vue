<template>
  <div class="universal-dt-container">

    <Toolbar class="mb-4 bg-light-gray">
      <template #start>
        <div v-if="effectiveToolbarStart" v-html="effectiveToolbarStart"></div>
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
              <div v-for="filter in filtersState" :key="filter.name" class="flex align-items-center m-2">
                <Checkbox
                    v-model="filter.visible"
                    :binary="true"
                    :inputId="'filter-pop-' + filter.name"
                    @change="saveStateToStorage"
                />
                <label :for="'filter-pop-' + filter.name" class="ml-2 cursor-pointer select-none">{{ filter.title }}</label>
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
              v-for="filter in filtersState.filter(f => f.visible)"
              :key="filter.name"
              class="filter-field"
              :class="{ 'range-filter-wrapper': filter.type === 'range' }"
          >
            <label :for="'field-' + filter.name">{{ filter.title }}</label>

            <Select
                v-if="filter.type === 'select'"
                :key="'select-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                :options="filter.options"
                showClear
                @change="onFilterClear"
                :placeholder="filter.placeholder || 'Оберіть...'"
            />

            <MultiSelect
                v-else-if="filter.type === 'multiselect'"
                :key="'multi-' + filter.name"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                :options="filter.options"
                :optionLabel="filter.optionLabel || 'label'"
                :optionValue="filter.optionValue || 'value'"
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
                :key="'date-range-' + filter.name + '-' + (activeFilters[filter.name] ? activeFilters[filter.name].map(d => d?.getTime()).join('-') : 'empty')"
                :inputId="'field-' + filter.name"
                v-model="activeFilters[filter.name]"
                selectionMode="range"
                dateFormat="dd.mm.yy"
                showIcon
                iconDisplay="input"
                showClear
                :manualInput="false"
                @date-select="onFilterDateUpdate"
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
                :placeholder="filter.placeholder || 'Введіть значення...'"
            />
          </div>
        </div>

        <div class="flex justify-content-end border-top-1 surface-border pt-3">
          <Button
              class="p-button-outlined p-button-secondary p-button-sm"
              @click="clearAllFilters"
          >
            <span v-html="resetFilterIcon" class="svg-icon-wrapper"></span>
            <span class="p-button-label">Скинути всі фільтри</span>
          </Button>
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
          removableSort
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
          removableSort
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

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive, computed, watch, nextTick } from 'vue';
import * as XLSX from 'xlsx';

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

// ====================== INTERFACES ======================

interface ColumnConfig {
  name: string;
  title?: string;
  visible?: boolean;
  sortable?: boolean;
  width?: string;
  type?: 'computed';
  fields?: string[];
  value?: (data: any) => string;
  class?: string;
  headerClass?: string;
  bodyClass?: string;
  footerClass?: string;
  attributes?: { class?: string };
}

interface FilterConfig {
  name: string;
  type: 'string' | 'text' | 'varchar' | 'integer' | 'select' | 'multiselect' | 'date' | 'date_range' | 'year' | 'range';
  visible?: boolean;
  options?: any[];
  optionLabel?: string;
  optionValue?: string;
  placeholder?: string;
  placeholderFrom?: string;
  placeholderTo?: string;
}

interface LazyParams {
  page: number;
  rows: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

interface ClientExportColumn {
  key: string;
  header: string;
  width?: number;
}

interface ClientExportResponse {
  columns: ClientExportColumn[];
  rows: Record<string, any>[];
  filename?: string;
}

type DownloadFormat = 'xlsx' | 'csv';

// 'server' — lazy-режим (запити на кожну сторінку/фільтр/сортування)
// 'client' — всі дані завантажуються один раз, далі пагінація/фільтрація/сортування на клієнті
type PaginationMode = 'server' | 'client';

interface TableConfig {
  requestUrl: string;
  storageKey: string;
  columns: ColumnConfig[];
  filters?: FilterConfig[];
  order?: Record<string, 'asc' | 'desc'>;
  showDownload?: boolean;
  showColumnsButton?: boolean;
  filtersExpanded?: boolean;
  rowsPerPageOptions?: number[];
  scrollable?: boolean;
  toolbarStart?: string;
  downloadFilename?: string;
  downloadFormat?: DownloadFormat;
  paginationMode?: PaginationMode;
  requestParams?: Record<string, any>;
}

interface ApiResponse {
  results?: {
    list: any[];
    count: number;
  };
}

// ====================== PROPS ======================

const props = defineProps<{
  requestUrl?: string;
  storageKey?: string;
  columnsConfig: ColumnConfig[];
  filtersConfig?: FilterConfig[];
  defaultOrder?: Record<string, 'asc' | 'desc'>;
  showDownload?: boolean;
  showColumnsButton?: boolean;
  filtersExpanded?: boolean;
  rowsPerPageOptions?: number[];
  scrollable?: boolean;
  toolbarStart?: string;
  downloadFilename?: string;
  downloadFormat?: DownloadFormat;
  paginationMode?: PaginationMode;
  requestParams?: Record<string, any>;
}>();

// ====================== CONSTANTS (SVG) ======================

const columnsIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M29 12.256h-1.88c-0.198-0.585-0.405-1.072-0.643-1.541l0.031 0.067 1.338-1.324c0.35-0.3 0.57-0.742 0.57-1.236 0-0.406-0.149-0.778-0.396-1.063l0.002 0.002-3.178-3.178c-0.283-0.246-0.654-0.395-1.061-0.395-0.494 0-0.937 0.221-1.234 0.57l-0.002 0.002-1.332 1.33c-0.402-0.206-0.888-0.413-1.39-0.586l-0.082-0.025 0.009-1.88c0.003-0.040 0.005-0.086 0.005-0.133 0-0.854-0.66-1.554-1.498-1.617l-0.005-0h-4.496c-0.844 0.063-1.505 0.763-1.505 1.617 0 0.047 0.002 0.093 0.006 0.139l-0 -0.006v1.879c-0.585 0.198-1.071 0.404-1.54 0.641l0.067-0.031-1.324-1.336c-0.299-0.352-0.742-0.573-1.236-0.573-0.407 0-0.778 0.15-1.063 0.397l0.002-0.002-3.179 3.179c-0.246 0.283-0.396 0.655-0.396 1.061 0 0.494 0.221 0.937 0.57 1.234l0.002 0.002 1.329 1.329c-0.207 0.403-0.414 0.891-0.587 1.395l-0.024 0.082-1.88-0.009c-0.040-0.003-0.086-0.005-0.133-0.005-0.854 0-1.554 0.661-1.617 1.499l-0 0.005v4.495c0.062 0.844 0.763 1.505 1.617 1.505 0.047 0 0.093-0.002 0.139-0.006l-0.006 0h1.88c0.198 0.585 0.404 1.072 0.642 1.541l-0.030-0.066-1.335 1.32c-0.351 0.3-0.572 0.744-0.572 1.239 0 0.407 0.149 0.779 0.396 1.064l-0.002-0.002 3.179 3.178c0.249 0.246 0.591 0.399 0.97 0.399 0.007 0 0.014-0 0.021-0h-0.001c0.515-0.013 0.977-0.231 1.308-0.576l0.001-0.001 1.33-1.33c0.403 0.207 0.891 0.414 1.395 0.587l0.082 0.025-0.009 1.878c-0.003 0.040-0.005 0.086-0.005 0.132 0 0.854 0.661 1.555 1.499 1.617l0.005 0h4.496c0.843-0.064 1.503-0.763 1.503-1.617 0-0.047-0.002-0.093-0.006-0.139l0 0.006v-1.881c0.585-0.198 1.073-0.405 1.543-0.643l-0.067 0.031 1.321 1.333c0.332 0.344 0.793 0.562 1.304 0.574l0.002 0h0.002c0.006 0 0.013 0 0.019 0 0.378 0 0.72-0.151 0.971-0.395l3.177-3.177c0.244-0.249 0.395-0.591 0.395-0.968 0-0.009-0-0.017-0-0.026l0 0.001c-0.012-0.513-0.229-0.973-0.572-1.304l-0.001-0.001-1.331-1.332c0.206-0.401 0.412-0.887 0.586-1.389l0.025-0.083 1.879 0.009c0.040 0.003 0.086 0.005 0.132 0.005 0.855 0 1.555-0.661 1.617-1.5l0-0.005v-4.495c-0.063-0.844-0.763-1.504-1.618-1.504-0.047 0-0.093 0.002-0.138 0.006l0.006-0zM29.004 18.25l-2.416-0.012c-0.020 0-0.037 0.010-0.056 0.011-0.198 0.024-0.372 0.115-0.501 0.249l-0 0c-0.055 0.072-0.103 0.153-0.141 0.24l-0.003 0.008c-0.005 0.014-0.016 0.024-0.020 0.039-0.24 0.844-0.553 1.579-0.944 2.264l0.026-0.049c-0.054 0.1-0.086 0.218-0.086 0.344 0 0.001 0 0.003 0 0.004v-0c-0 0.016 0.003 0.028 0.004 0.045 0.006 0.187 0.080 0.355 0.199 0.481l-0-0 0.009 0.023 1.707 1.709c0.109 0.109 0.137 0.215 0.176 0.176l-3.102 3.133c-0.099-0.013-0.186-0.061-0.248-0.13l-0-0-1.697-1.713c-0.008-0.009-0.022-0.005-0.030-0.013-0.121-0.112-0.28-0.183-0.456-0.193l-0.002-0c-0.020-0.003-0.044-0.005-0.068-0.006l-0.001-0c-0.125 0-0.243 0.032-0.345 0.088l0.004-0.002c-0.636 0.362-1.373 0.676-2.146 0.903l-0.074 0.019c-0.015 0.004-0.025 0.015-0.039 0.020-0.096 0.042-0.179 0.092-0.255 0.149l0.003-0.002c-0.035 0.034-0.066 0.071-0.093 0.11l-0.002 0.002c-0.027 0.033-0.053 0.070-0.075 0.11l-0.002 0.004c-0.033 0.081-0.059 0.175-0.073 0.274l-0.001 0.007c-0.001 0.016-0.010 0.031-0.010 0.047v2.412c0 0.15-0.055 0.248 0 0.25l-4.41 0.023c-0.052-0.067-0.084-0.153-0.084-0.246 0-0.008 0-0.016 0.001-0.024l-0 0.001 0.012-2.412c0-0.017-0.008-0.032-0.010-0.048-0.005-0.053-0.015-0.102-0.030-0.149l0.001 0.005c-0.012-0.053-0.028-0.1-0.048-0.145l0.002 0.005c-0.052-0.086-0.109-0.16-0.173-0.227l0 0c-0.029-0.024-0.062-0.046-0.096-0.066l-0.004-0.002c-0.044-0.030-0.093-0.056-0.146-0.076l-0.005-0.002c-0.014-0.005-0.024-0.016-0.039-0.020-0.847-0.241-1.585-0.554-2.272-0.944l0.051 0.026c-0.099-0.054-0.216-0.086-0.341-0.086h-0c-0.022-0.001-0.040 0.004-0.062 0.005-0.18 0.008-0.342 0.080-0.465 0.193l0.001-0c-0.008 0.008-0.021 0.004-0.029 0.012l-1.705 1.705c-0.107 0.107-0.216 0.139-0.178 0.178l-3.134-3.101c0.012-0.1 0.060-0.187 0.13-0.25l0-0 1.714-1.695 0.011-0.026c0.115-0.123 0.189-0.286 0.197-0.466l0-0.002c0.001-0.021 0.005-0.037 0.005-0.058 0-0.001 0-0.002 0-0.003 0-0.126-0.032-0.245-0.088-0.348l0.002 0.004c-0.365-0.636-0.679-1.371-0.903-2.145l-0.018-0.072c-0.004-0.015-0.016-0.026-0.021-0.041-0.042-0.094-0.090-0.176-0.146-0.25l0.002 0.003c-0.065-0.061-0.136-0.117-0.212-0.165l-0.006-0.003c-0.051-0.025-0.109-0.045-0.171-0.057l-0.005-0.001c-0.029-0.009-0.065-0.016-0.102-0.021l-0.004-0c-0.020-0.002-0.037-0.012-0.058-0.012h-2.412c-0.152 0.002-0.248-0.055-0.25-0.002l-0.022-4.409c0.067-0.052 0.151-0.084 0.244-0.084 0.009 0 0.017 0 0.026 0.001l-0.001-0 2.416 0.012c0.152-0.004 0.292-0.054 0.407-0.136l-0.002 0.002c0.024-0.014 0.044-0.028 0.064-0.043l-0.002 0.001c0.109-0.088 0.191-0.206 0.235-0.341l0.001-0.005c0.003-0.010 0.014-0.014 0.017-0.025 0.242-0.847 0.555-1.583 0.946-2.27l-0.026 0.050c0.054-0.1 0.086-0.218 0.086-0.344 0-0.001 0-0.001 0-0.002v0c0.001-0.019-0.003-0.033-0.004-0.052-0.007-0.184-0.080-0.35-0.197-0.475l0 0-0.010-0.024-1.705-1.705c-0.108-0.11-0.142-0.221-0.176-0.178l3.102-3.134c0.101 0.008 0.189 0.058 0.248 0.131l0.001 0.001 1.697 1.713c0.018 0.018 0.046 0.011 0.065 0.027 0.125 0.121 0.295 0.196 0.483 0.196 0.13 0 0.251-0.036 0.355-0.098l-0.003 0.002c0.636-0.364 1.372-0.677 2.145-0.902l0.072-0.018c0.014-0.004 0.024-0.015 0.038-0.019 0.057-0.021 0.105-0.047 0.151-0.077l-0.003 0.002c0.163-0.090 0.281-0.244 0.321-0.427l0.001-0.004c0.014-0.043 0.025-0.093 0.030-0.145l0-0.003c0.001-0.016 0.009-0.030 0.009-0.046v-2.412c0-0.151 0.056-0.249 0.001-0.25l4.41-0.023c0.052 0.067 0.083 0.152 0.083 0.245 0 0.009-0 0.017-0.001 0.026l0-0.001-0.012 2.412c-0 0.016 0.008 0.030 0.009 0.047 0.005 0.055 0.015 0.106 0.031 0.155l-0.001-0.005c0.071 0.234 0.243 0.419 0.464 0.506l0.005 0.002c0.014 0.005 0.025 0.016 0.039 0.020 0.845 0.242 1.58 0.555 2.265 0.945l-0.050-0.026c0.105 0.060 0.231 0.096 0.366 0.096 0 0 0.001 0 0.001 0h-0c0.183-0.008 0.347-0.082 0.471-0.198l-0 0c0.017-0.015 0.043-0.008 0.059-0.024l1.709-1.705c0.105-0.106 0.213-0.137 0.176-0.176l3.133 3.102c-0.012 0.1-0.059 0.186-0.129 0.249l-0 0-1.715 1.697-0.011 0.026c-0.116 0.123-0.19 0.287-0.198 0.468l-0 0.002c-0.001 0.020-0.005 0.036-0.005 0.056 0 0.001 0 0.002 0 0.003 0 0.126 0.032 0.245 0.088 0.348l-0.002-0.004c0.365 0.636 0.679 1.371 0.902 2.144l0.018 0.071c0.003 0.012 0.016 0.017 0.019 0.028 0.046 0.137 0.127 0.253 0.232 0.339l0.001 0.001c0.019 0.015 0.041 0.030 0.063 0.043l0.003 0.002c0.112 0.080 0.252 0.13 0.402 0.134l0.001 0h2.412c0.152-0.001 0.248 0.057 0.25 0.001l0.021 4.409c-0.065 0.053-0.149 0.085-0.24 0.085-0.010 0-0.019-0-0.029-0.001l0.001 0zM16 11.25c-2.623 0-4.75 2.127-4.75 4.75s2.127 4.75 4.75 4.75c2.623 0 4.75-2.127 4.75-4.75v0c-0.003-2.622-2.128-4.747-4.75-4.75h-0zM16 19.25c-1.795 0-3.25-1.455-3.25-3.25s1.455-3.25 3.25-3.25c1.795 0 3.25 1.455 3.25 3.25v0c-0.002 1.794-1.456 3.248-3.25 3.25h-0z"></path></svg>`;
const filterIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M30.646 1.62c-0.133-0.223-0.372-0.37-0.646-0.37h-22c-0.414 0-0.75 0.336-0.75 0.75 0 0.134 0.035 0.259 0.096 0.368l-0.002-0.004 7.763 13.973v4.52c0 0.292 0.167 0.545 0.411 0.668l0.004 0.002 6.284 3.143c0.096 0.050 0.211 0.080 0.332 0.080 0.002 0 0.003 0 0.005 0h-0c0.001 0 0.001 0 0.002 0 0.413 0 0.748-0.335 0.748-0.748 0-0.001 0-0.001 0-0.002v0-7.663l7.764-13.973c0.059-0.105 0.094-0.23 0.094-0.363 0-0.14-0.039-0.272-0.106-0.384l0.002 0.003zM21.486 15.778c-0.059 0.105-0.093 0.231-0.094 0.364v6.645l-4.785-2.393v-4.252c0-0 0-0.001 0-0.001 0-0.133-0.035-0.258-0.097-0.367l0.002 0.004-7.238-13.028h19.45zM14.214 23.25c-0.414 0-0.75 0.336-0.75 0.75v0 4.787l-3.928-1.965v-3.607c0-0 0-0 0-0.001 0-0.133-0.035-0.258-0.097-0.366l0.002 0.004-6.167-11.102h6.17c0.414 0 0.75-0.336 0.75-0.75s-0.336-0.75-0.75-0.75v0h-7.444c-0.414 0-0.75 0.336-0.75 0.75 0 0.134 0.035 0.259 0.096 0.368l-0.002-0.004 6.691 12.046v3.875c0 0.292 0.167 0.544 0.41 0.668l0.004 0.002 5.428 2.715c0.097 0.050 0.211 0.080 0.333 0.080 0.001 0 0.002 0 0.003 0h-0c0.001 0 0.001 0 0.002 0 0.413 0 0.748-0.335 0.748-0.748 0-0.001 0-0.001 0-0.002v0-6c-0-0.414-0.336-0.75-0.75-0.75v0z"></path></svg>`;
const downloadIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M30 21.25c-0.414 0-0.75 0.336-0.75 0.75v0 7.25h-26.5v-7.25c0-0.414-0.336-0.75-0.75-0.75s-0.75 0.336-0.75 0.75v0 8c0 0.414 0.336 0.75 0.75 0.75h28c0.414-0 0.75-0.336 0.75-0.75v0-8c-0-0.414-0.336-0.75-0.75-0.75v0zM15.47 24.531c0.026 0.026 0.065 0.017 0.093 0.038 0.052 0.040 0.088 0.098 0.15 0.124 0.085 0.035 0.184 0.056 0.287 0.057h0c0.207 0 0.394-0.084 0.53-0.219l5.001-5c0.136-0.136 0.22-0.324 0.22-0.531 0-0.415-0.336-0.751-0.751-0.751-0.207 0-0.395 0.084-0.531 0.22l-3.719 3.721v-20.189c0-0.414-0.336-0.75-0.75-0.75s-0.75 0.336-0.75 0.75v0 20.188l-3.72-3.72c-0.136-0.134-0.322-0.218-0.528-0.218-0.415 0-0.751 0.336-0.751 0.751 0 0.207 0.083 0.394 0.219 0.529l-0-0z"></path></svg>`;
const cogIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M29.18 13.92l-2.45-.41a8.91 8.91 0 00-.65-1.57l1.45-2.02a0.75 0.75 0 00-.08-.94l-2.12-2.12a0.75 0.75 0 00-.94-.08l-2.02 1.45a8.91 8.91 0 00-1.57-.65l-.41-2.45A0.75 0.75 0 0019.64 4h-3a0.75 0.75 0 00-.74.63l-.41 2.45a8.91 8.91 0 00-1.57.65L11.9 6.28a0.75 0.75 0 00-.94.08L8.84 8.48a0.75 0.75 0 00-.08.94l1.45 2.02a8.91 8.91 0 00-.65 1.57l-2.45.41A0.75 0.75 0 006.5 14.66v3a0.75 0.75 0 00.63.74l2.45 0.41c.15.55.37 1.08.65 1.57l-1.45 2.02a0.75 0.75 0 00.08.94l2.12 2.12a0.75 0.75 0 00.94.08l2.02-1.45c.49.28 1.02.5 1.57.65l.41 2.45a0.75 0.75 0 00.74.63h3a0.75 0.75 0 00.74-.63l.41-2.45c.55-.15 1.08-.37 1.57-.65l2.02 1.45a0.75 0.75 0 00.94-.08l2.12-2.12a0.75 0.75 0 00.08-.94l-1.45-2.02c.28-.49.5-1.02.65-1.57l2.45-.41a0.75 0.75 0 00.63-.74v-3a0.75 0.75 0 00-.63-.74zM17.84 21.5a5.5 5.5 0 115.5-5.5 5.5 5.5 0 01-5.5 5.5z"></path></svg>`;
const resetFilterIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M28.71 5.29A1 1 0 0 0 28 5H4a1 1 0 0 0-.71 1.71L12 15.42V26a1 1 0 0 0 .45.83l4 2.67A1 1 0 0 0 18 28.67V15.42l6-6V8h2a1 1 0 0 0 0-2h-3.33M27.71 19.29a1 1 0 0 0-1.42 0L24 21.59l-2.29-2.3a1 1 0 0 0-1.42 1.42l2.3 2.29-2.3 2.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l2.29-2.3 2.29 2.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L25.41 23l2.3-2.29a1 1 0 0 0 0-1.42z"/></svg>`;
const searchIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M29 27.586l-7.552-7.552A11.018 11.018 0 1 0 3 13a11.018 11.018 0 0 0 17.034 9.448L27.586 29zM5 13a9 9 0 1 1 9 9 9.01 9.01 0 0 1-9-9z"/></svg>`;

// ====================== COMPUTED ======================

const externalConfig = ref<TableConfig | null>(null);

const effectiveRequestUrl         = computed(() => externalConfig.value?.requestUrl         || props.requestUrl);
const effectiveStorageKey         = computed(() => externalConfig.value?.storageKey         || props.storageKey);
const effectiveColumns            = computed(() => externalConfig.value?.columns            || props.columnsConfig);
const effectiveFilters            = computed(() => externalConfig.value?.filters            || props.filtersConfig  || []);
const effectiveOrder              = computed(() => externalConfig.value?.order              || props.defaultOrder   || {});
const effectiveShowDownload       = computed(() => externalConfig.value?.showDownload       ?? props.showDownload   ?? false);
const effectiveFiltersExpanded    = computed(() => externalConfig.value?.filtersExpanded    ?? props.filtersExpanded ?? true);
const effectiveRowsPerPageOptions = computed(() => externalConfig.value?.rowsPerPageOptions || props.rowsPerPageOptions || [10, 25, 50]);
const effectiveScrollable         = computed(() => externalConfig.value?.scrollable         ?? props.scrollable     ?? true);
const effectiveToolbarStart       = computed(() => externalConfig.value?.toolbarStart       || props.toolbarStart   || '');
const effectiveDownloadFilename   = computed(() => externalConfig.value?.downloadFilename   || props.downloadFilename || 'report');
const effectiveDownloadFormat     = computed<DownloadFormat>(() => externalConfig.value?.downloadFormat || props.downloadFormat || 'xlsx');
const effectiveShowColumnsButton = computed(() =>
    externalConfig.value?.showColumnsButton ?? props.showColumnsButton ?? true
);

// Режим пагінації: 'server' (за замовч.) або 'client'
const effectivePaginationMode = computed<PaginationMode>(() =>
    externalConfig.value?.paginationMode || props.paginationMode || 'server'
);

const effectiveRequestParams = computed<Record<string, any>>(() => {
  const params = externalConfig.value?.requestParams || props.requestParams || {};
  return params;
});

// Чи увімкнений клієнтський режим
const isClientMode = computed(() => effectivePaginationMode.value === 'client');

const dtFirstOffset = computed(() => (lazyParams.value.page - 1) * lazyParams.value.rows);
const STORAGE_KEY   = computed(() => `udt_state_${effectiveStorageKey.value}`);

// ====================== REACTIVE STATE ======================

const items           = ref<any[]>([]);  // всі дані (для client-mode — весь масив)
const allClientItems  = ref<any[]>([]);  // незмінний оригінал для клієнтської фільтрації
const totalRecords    = ref<number>(0);
const loading         = ref<boolean>(true);
const downloadLoading = ref<boolean>(false);

// --- Клієнтський режим ---
const globalSearch   = ref<string>('');   // рядок глобального пошуку
const clientRows     = ref<number>(10);   // рядків на сторінці
const clientFirst    = ref<number>(0);    // зміщення першого рядка
const clientSortField = ref<string | null>(null);
const clientSortOrder = ref<number>(1);   // 1 = asc, -1 = desc

const columnsPopover = ref<InstanceType<typeof Popover> | null>(null);
const filtersPopover = ref<InstanceType<typeof Popover> | null>(null);

const isFiltersPanelOpen = ref<boolean>(true);
const columnsState       = ref<ColumnConfig[]>([]);
const filtersState       = ref<FilterConfig[]>([]);
const activeFilters      = reactive<Record<string, any>>({});
const lazyParams         = ref<LazyParams>({ page: 1, rows: 10, sortField: 'id', sortOrder: 'desc' });

const isScrollEnabled       = ref<boolean>(true);
const topScrollContainer    = ref<HTMLElement | null>(null);
const bottomScrollContainer = ref<HTMLElement | null>(null);
const dtWrapper             = ref<HTMLElement | null>(null);
const tableInnerWidth       = ref<number>(0);

let tableScrollElement: HTMLElement | null = null;
let resizeObserver: ResizeObserver | null  = null;
let isInitializing = false;
let filterTimeout: ReturnType<typeof setTimeout> | null = null;

let isSyncingTop    = false;
let isSyncingBottom = false;
let isSyncingTable  = false;

// ====================== CLIENT-MODE: ФІЛЬТРАЦІЯ ======================

/**
 * Повертає текстове значення комірки для порівняння.
 * Підтримує функцію value, computed-поля та звичайні поля.
 */
const getCellText = (row: any, col: ColumnConfig): string => {
  let rawValue: string;

  if (typeof col.value === 'function') {
    const html = col.value(row);
    // Якщо значення - це масив (як у вашому випадку з actions)
    if (Array.isArray(html)) {
      rawValue = html.join(' ');
    } else {
      rawValue = html;
    }
  } else if (col.type === 'computed' && Array.isArray(col.fields)) {
    rawValue = col.fields.map(f => row[f] ?? '').join(' ');
  } else {
    rawValue = row[col.name] ?? '';
  }

  // Очищаємо HTML теги для пошуку
  const div = document.createElement('div');
  div.innerHTML = String(rawValue);
  return (div.textContent || div.innerText || '').toLowerCase();
};

/**
 * Застосовує клієнтські фільтри (панель фільтрів) до рядка.
 * Логіка відповідає типам фільтрів: text, select, multiselect, range, integer, date, date_range, year.
 */
const applyClientFilters = (row: any): boolean => {
  for (const f of filtersState.value) {
    if (!f.visible) {
      continue;
    }
    const val = activeFilters[f.name];
    if (f.type === 'range') {
      const rowVal = Number(row[f.name]);
      if (val?.from !== null && val?.from !== undefined && rowVal < val.from) {
        return false;
      }
      if (val?.to   !== null && val?.to   !== undefined && rowVal > val.to)   {
        return false;
      }
      continue;
    }

    if (f.type === 'multiselect') {

      if (!Array.isArray(val) || val.length === 0) {
        continue;
      }

      const optValue = f.optionValue || 'value';
      const rowRaw = row[f.name];
      const match = val.some(selectedValue => {
        if (typeof selectedValue === 'object' && selectedValue !== null) {
          return String(rowRaw) === String(selectedValue[optValue]);
        }

        return String(rowRaw) === String(selectedValue);
      });

      if (!match) {
        return false;
      }
      continue;
    }

    if (f.type === 'select') {
      if (val === null || val === undefined || val === '') {
        continue;
      }
      if (String(row[f.name]) !== String(val)) {
        return false;
      }
      continue;
    }

    if (f.type === 'integer') {
      if (val === null || val === undefined || val === '') {
        continue;
      }
      if (Number(row[f.name]) !== Number(val)) {
        return false;
      }
      continue;
    }

    if (f.type === 'date') {
      if (!(val instanceof Date) || isNaN(val.getTime())) {
        continue;
      }
      const offset    = val.getTimezoneOffset();
      const corrected = new Date(val.getTime() - offset * 60 * 1000);
      const filterStr = corrected.toISOString().split('T')[0];
      if (String(row[f.name]) !== filterStr) {
        return false;
      }
      continue;
    }

    if (f.type === 'year') {
      if (!(val instanceof Date) || isNaN(val.getTime())) {
        continue;
      }
      if (String(row[f.name]) !== String(val.getFullYear())) {
        return false;
      }
      continue;
    }

    if (f.type === 'date_range') {
      if (!Array.isArray(val) || !val[0] || !val[1]) {
        continue;
      }
      const [start, end] = val as [Date, Date];
      const rowDate = new Date(row[f.name]);
      if (isNaN(rowDate.getTime())) {
        return false;
      }
      if (rowDate < start || rowDate > end) {
        return false;
      }
      continue;
    }

    // text / string / varchar - очищаємо HTML для коректного пошуку
    if (val === '' || val === null || val === undefined) continue;

    // Отримуємо чисте значення без HTML
    let cleanRowValue = row[f.name];
    if (typeof cleanRowValue === 'string') {
      cleanRowValue = cleanRowValue.replace(/<[^>]*>/g, '');
    }

    if (!String(cleanRowValue ?? '').toLowerCase().includes(String(val).toLowerCase())) {
      return false;
    }
  }
  return true;
};

/**
 * Фінальний масив рядків для клієнтської DataTable.
 * Застосовує: глобальний пошук + фільтри панелі.
 */
const clientFilteredItems = computed<any[]>(() => {
  let result = allClientItems.value;

  // Глобальний пошук по всіх видимих колонках
  const search = globalSearch.value.trim().toLowerCase();
  if (search) {
    result = result.filter(row =>
        columnsState.value
            .filter(c => c.visible && c.name !== 'actions')
            .some(col => getCellText(row, col).includes(search))
    );
  }

  // Фільтри панелі
  result = result.filter(row => applyClientFilters(row));

  return result;
});

// Скидати clientFirst при зміні фільтрів чи пошуку
watch(clientFilteredItems, () => { clientFirst.value = 0; });

// ====================== FILTER HANDLERS ======================

const onIntegerFilterInput = (event: any, filterName: string) => {
  activeFilters[filterName] = event.value !== undefined && event.value !== null ? Number(event.value) : null;
  if (isClientMode.value) {
    return;
  }
  debounceFilter();
};

const onRangeFilterInput = (event: any, filterName: string, field: 'from' | 'to') => {
  if (!activeFilters[filterName]) {
    activeFilters[filterName] = { from: null, to: null };
  }
  activeFilters[filterName][field] = event.value !== undefined && event.value !== null ? Number(event.value) : null;
  if (isClientMode.value) {
    return;
  }
  debounceFilter();
};

const onRangeFilterClear = (filterName: string, field: 'from' | 'to') => {
  if (activeFilters[filterName]) {
    activeFilters[filterName][field] = null;
  }
  if (isClientMode.value) {
    return;
  }
  triggerFilterApply();
};

const debounceFilter = () => {
  if (filterTimeout) {
    clearTimeout(filterTimeout);
  }
  filterTimeout = setTimeout(() => triggerFilterApply(), 500);
};

// ====================== LOCAL STORAGE ======================

const loadStateFromStorage = (): any => {
  if (!effectiveStorageKey.value || effectiveStorageKey.value === 'undefined') {
    return null;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY.value);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Помилка читання localStorage:', e);
    return null;
  }
};

const formatDateToLocalString = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();

  return `${day}.${month}.${year}`;
};

const initState = () => {
  isInitializing = true;
  const savedState  = loadStateFromStorage();
  const defaultRows = effectiveRowsPerPageOptions.value[0] || 10;

  isFiltersPanelOpen.value = savedState?.isFiltersPanelOpen ?? effectiveFiltersExpanded.value;
  isScrollEnabled.value    = externalConfig.value?.scrollable ?? savedState?.isScrollEnabled ?? effectiveScrollable.value;

  columnsState.value = effectiveColumns.value.map((col: ColumnConfig) => {
    if (col.type === 'computed') {
      return { ...col, visible: true };
    }
    const savedCol = savedState?.columns?.find((c: any) => c.name === col.name);
    return {
      ...col,
      visible:   savedCol?.visible ?? (col.visible !== false),
      class:     col.class || col.attributes?.class,
      bodyClass: col.bodyClass || col.class,
    };
  });

  filtersState.value = effectiveFilters.value.map((f: FilterConfig) => {
    const savedFilter = savedState?.filtersVisibility?.find((sf: any) => sf.name === f.name);
    return { ...f, visible: savedFilter?.visible ?? (f.visible !== false) };
  });

  Object.keys(activeFilters).forEach(key => delete activeFilters[key]);

  effectiveFilters.value.forEach((f: FilterConfig) => {
    const savedValue = savedState?.activeFilters?.[f.name];

    if ((f.type === 'date' || f.type === 'year') && savedValue) {
      activeFilters[f.name] = new Date(savedValue);
    }
    else if (f.type === 'date_range' && Array.isArray(savedValue)) {
      // ВАЖЛИВО: переконуємось, що обидва елементи - це Date або null
      activeFilters[f.name] = savedValue.map((d: string | null) => {
        if (!d) {
          return null;
        }
        const date = new Date(d);
        // Перевіряємо, чи дата валідна
        return isNaN(date.getTime()) ? null : date;
      });
    }
    else if (f.type === 'range') {
      activeFilters[f.name] = {
        from: savedValue?.from ?? null,
        to: savedValue?.to ?? null
      };
    }
    else if (f.type === 'multiselect') {
      activeFilters[f.name] = Array.isArray(savedValue) ? savedValue : [];
    }
    else {
      activeFilters[f.name] = savedValue !== undefined ? savedValue : '';
    }
  });

  lazyParams.value = {
    page:      savedState?.lazyParams?.page      || 1,
    rows:      savedState?.lazyParams?.rows      || defaultRows,
    sortField: savedState?.lazyParams?.sortField || Object.keys(effectiveOrder.value)[0] || 'id',
    sortOrder: savedState?.lazyParams?.sortOrder || 'desc'
  };

  // Відновлюємо clientRows з lazyParams
  clientRows.value  = lazyParams.value.rows;
  clientFirst.value = 0;

  nextTick(() => {
    isInitializing = false;
    setupScrollSync();
    forceUpdateDatePickers();
  });
};
const forceUpdateDatePickers = () => {
  nextTick(() => {
    effectiveFilters.value.forEach((f: FilterConfig) => {
      if (f.type === 'date_range' && activeFilters[f.name]) {
        const currentValue = [...activeFilters[f.name]];
        activeFilters[f.name] = null;
        nextTick(() => {
          activeFilters[f.name] = currentValue;
        });
      }
    });
  });
};

const saveStateToStorage = () => {
  if (isInitializing || !effectiveStorageKey.value || effectiveStorageKey.value === 'undefined')
    return;

  const cleanedActiveFilters: Record<string, any> = {};

  Object.keys(activeFilters).forEach(key => {
    const val = activeFilters[key];

    if (val instanceof Date) {
      cleanedActiveFilters[key] = val.toISOString();
    }
    else if (Array.isArray(val)) {
      cleanedActiveFilters[key] = val.map(item => {
        if (item instanceof Date && !isNaN(item.getTime())) {
          return item.toISOString();
        }
        return item;
      });
    }
    else if (val && typeof val === 'object' && 'from' in val && 'to' in val) {
      cleanedActiveFilters[key] = {
        from: val.from,
        to: val.to
      };
    }
    else {
      cleanedActiveFilters[key] = val;
    }
  });

  try {
    localStorage.setItem(STORAGE_KEY.value, JSON.stringify({
      isFiltersPanelOpen: isFiltersPanelOpen.value,
      isScrollEnabled:    isScrollEnabled.value,
      lazyParams:         { ...lazyParams.value },
      columns:            columnsState.value.map(c => ({ name: c.name, visible: c.visible })),
      filtersVisibility:  filtersState.value.map(f => ({ name: f.name, visible: f.visible })),
      activeFilters:      cleanedActiveFilters
    }));
  } catch (e) {
    console.error('Не вдалося зберегти стан:', e);
  }
};

// ====================== FILTERS & DATA ======================

const getCleanedFilters = () => {
  const cleaned: Record<string, any> = {};
  filtersState.value.forEach(f => {
    if (!f.visible) {
      return;
    }
    const val = activeFilters[f.name];
    if (f.type === 'date' && val instanceof Date) {
      if (!isNaN(val.getTime())) {
        const offset   = val.getTimezoneOffset();
        const corrected = new Date(val.getTime() - offset * 60 * 1000);
        cleaned[f.name] = corrected.toISOString().split('T')[0];
      }
    } else if (f.type === 'year' && val instanceof Date) {
      cleaned[f.name] = val.getFullYear();
    } else if (f.type === 'date_range' && Array.isArray(val)) {
      const [start, end] = val;
      if (start && end) {
        cleaned[f.name] = `${formatDateToLocalString(start)}-${formatDateToLocalString(end)}`;
      }
    } else if (f.type === 'multiselect' && Array.isArray(val) && val.length > 0) {
      cleaned[f.name] = val;
    } else if (f.type === 'range') {
      if (val?.from !== null && val?.from !== undefined) {
        cleaned[`${f.name}_from`] = val.from;
      }
      if (val?.to   !== null && val?.to   !== undefined) {
        cleaned[`${f.name}_to`]   = val.to;
      }
    } else if (f.type !== 'range' && val !== '' && val !== null && val !== undefined) {
      cleaned[f.name] = val;
    }
  });
  return cleaned;
};

/**
 * loadData — для серверного режиму: робить POST з pager/order/filters.
 * Для клієнтського режиму: робить POST БЕЗ pager (отримує всі дані одразу).
 */
const loadData = async () => {
  if (!effectiveRequestUrl.value) return;
  loading.value = true;

  try {
    const cleanedFilters = getCleanedFilters();
    const requestParams = { ...effectiveRequestParams.value };
    const mergedFilters = { ...requestParams, ...cleanedFilters };
    const requestBody: any = {
      order: { [lazyParams.value.sortField]: lazyParams.value.sortOrder }
    };
    if (isClientMode.value) {
      requestBody.filters = mergedFilters;
    } else {
      requestBody.pager = {
        page: lazyParams.value.page,
        size: lazyParams.value.rows
      };
      requestBody.filters = mergedFilters;
    }

    const response = await fetch(effectiveRequestUrl.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify(requestBody)
    });

    const data: ApiResponse = await response.json();
    if (data.results) {
      const list = data.results.list || [];
      if (isClientMode.value) {
        allClientItems.value = list;
        totalRecords.value = list.length;
      } else {
        items.value = list;
        totalRecords.value = data.results.count || 0;
      }
      nextTick(() => updateScrollDimensions());
    }
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
  } finally {
    loading.value = false;
  }
};

// ====================== CLIENT-MODE: HANDLERS ПАГІНАЦІЇ/СОРТУВАННЯ ======================

const onClientPage = (event: any) => {
  clientRows.value  = event.rows;
  clientFirst.value = event.first;
  lazyParams.value.rows = event.rows; // синхронізуємо для збереження у storage
  saveStateToStorage();
};

const onClientSort = (event: any) => {
  clientSortField.value = event.sortField;
  clientSortOrder.value = event.sortOrder;
};

// ====================== EXPORT ======================

const stripHtml = (value: any): string => {
  if (typeof value !== 'string') {
    return String(value ?? '');
  }
  const div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent || div.innerText || '';
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const generateXlsx = (data: ClientExportResponse): void => {
  const { columns, rows, filename } = data;
  const headerRow = columns.map(col => col.header);
  const dataRows  = rows.map(row => columns.map(col => stripHtml(row[col.key])));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  ws['!cols'] = columns.map(col => ({ wch: col.width || 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Звіт');
  XLSX.writeFile(wb, `${filename || effectiveDownloadFilename.value}.xlsx`);
};

const generateCsv = (data: ClientExportResponse): void => {
  const { columns, rows, filename } = data;
  const headerRow = columns.map(col => col.header);
  const dataRows  = rows.map(row => columns.map(col => stripHtml(row[col.key])));
  const ws  = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename || effectiveDownloadFilename.value}.csv`);
};

const exportData = async (): Promise<void> => {
  downloadLoading.value = true;
  try {
    const cleanedFilters = getCleanedFilters();
    const requestParams = { ...effectiveRequestParams.value };
    // Об'єднуємо requestParams + cleanedFilters
    const mergedFilters = { ...requestParams, ...cleanedFilters };
    const response = await fetch(`${effectiveRequestUrl.value}-export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify({
        filters: mergedFilters,                    // ← Тут головне виправлення
        order: { [lazyParams.value.sortField]: lazyParams.value.sortOrder },
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: ClientExportResponse = await response.json();
    if (effectiveDownloadFormat.value === 'csv') {
      generateCsv(data);
    } else {
      generateXlsx(data);
    }
  } catch (error) {
    console.error('Помилка експорту:', error);
  } finally {
    downloadLoading.value = false;
  }
};

// ====================== SCROLL SYNC ======================

const updateScrollDimensions = () => {
  if (!isScrollEnabled.value || !dtWrapper.value) {
    return;
  }
  const innerTableContainer = dtWrapper.value.querySelector('.p-datatable-table-container') as HTMLElement;
  const tableEl             = dtWrapper.value.querySelector('.p-datatable-table') as HTMLElement;
  if (innerTableContainer && tableEl) {
    tableScrollElement    = innerTableContainer;
    tableInnerWidth.value = tableEl.offsetWidth;
    tableScrollElement.removeEventListener('scroll', syncTableToScrollbars);
    tableScrollElement.addEventListener('scroll', syncTableToScrollbars);
    nextTick(() => {
      const scrollLeft = tableScrollElement!.scrollLeft;
      if (topScrollContainer.value)    {
        topScrollContainer.value.scrollLeft    = scrollLeft;
      }
      if (bottomScrollContainer.value) {
        bottomScrollContainer.value.scrollLeft = scrollLeft;
      }
    });
  }
};

const syncTopToTable = () => {
  if (!tableScrollElement || isSyncingTable || isSyncingBottom) {
    return;
  }
  isSyncingTop = true;
  const pos = topScrollContainer.value!.scrollLeft;
  tableScrollElement.scrollLeft = pos;
  if (bottomScrollContainer.value) {
    bottomScrollContainer.value.scrollLeft = pos;
  }
  setTimeout(() => { isSyncingTop = false; }, 20);
};

const syncBottomToTable = () => {
  if (!tableScrollElement || isSyncingTable || isSyncingTop) {
    return;
  }
  isSyncingBottom = true;
  const pos = bottomScrollContainer.value!.scrollLeft;
  tableScrollElement.scrollLeft = pos;
  if (topScrollContainer.value) {
    topScrollContainer.value.scrollLeft = pos;
  }
  setTimeout(() => { isSyncingBottom = false; }, 20);
};

const syncTableToScrollbars = () => {
  if (isSyncingTop || isSyncingBottom) {
    return;
  }
  isSyncingTable = true;
  const pos = tableScrollElement!.scrollLeft;
  if (topScrollContainer.value)    {
    topScrollContainer.value.scrollLeft = pos;
  }
  if (bottomScrollContainer.value) {
    bottomScrollContainer.value.scrollLeft = pos;
  }
  setTimeout(() => { isSyncingTable = false; }, 20);
};

const setupScrollSync = () => {
  if (!isScrollEnabled.value) { destroyScrollSync(); return; }
  nextTick(() => {
    updateScrollDimensions();
    if (dtWrapper.value && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => updateScrollDimensions());
      resizeObserver.observe(dtWrapper.value);
    }
  });
};

const destroyScrollSync = () => {
  if (tableScrollElement) tableScrollElement.removeEventListener('scroll', syncTableToScrollbars);
  if (resizeObserver)     { resizeObserver.disconnect(); resizeObserver = null; }
};

const handleScrollToggle = () => {
  saveStateToStorage();
  isScrollEnabled.value ? setupScrollSync() : destroyScrollSync();
};

const onColumnVisibilityChange = () => {
  saveStateToStorage();
  setTimeout(() => updateScrollDimensions(), 50);
};

// ====================== OTHER HANDLERS ======================

const toggleFiltersPanel   = () => { isFiltersPanelOpen.value = !isFiltersPanelOpen.value; saveStateToStorage(); };
const toggleColumnsPopover = (event: Event) => columnsPopover.value?.toggle(event);
const toggleFiltersPopover = (event: Event) => filtersPopover.value?.toggle(event);

// Серверна пагінація
const onPage = (event: any) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.rows = event.rows;
  saveStateToStorage();
  loadData();
};

const onSort = (event: any) => {
  lazyParams.value.sortField = event.sortField || 'id';
  lazyParams.value.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
  saveStateToStorage();
  loadData();
};

const onFilterInput = (event: any, filterName?: string) => {

  if (filterName) {
    const value = event.target?.value || event.value;
    if (typeof value === 'string') {
      activeFilters[filterName] = value.trim();
    }
  }

  if (!isClientMode.value) debounceFilter();
};
const onTextFilterInput = (event: any, filterName: string) => {
  const rawValue = event.target?.value || '';
  const trimmedValue = rawValue.trim();

  if (activeFilters[filterName] !== trimmedValue) {
    activeFilters[filterName] = trimmedValue;
  }

  if (!isClientMode.value) debounceFilter();
};
const onFilterClear      = () => {
  if (!isClientMode.value) {
    triggerFilterApply();
  }
};
const onFilterDateUpdate = () => {
  if (!isClientMode.value) {
    triggerFilterApply();
  }
};

const clearAllFilters = async () => {
  if (filterTimeout) {
    clearTimeout(filterTimeout);
    filterTimeout = null;
  }

  // Скидаємо глобальний пошук
  globalSearch.value = '';

  // === Повне очищення активних фільтрів ===
  effectiveFilters.value.forEach((f: FilterConfig) => {
    if (f.type === 'range') {
      activeFilters[f.name] = { from: null, to: null };
    }
    else if (f.type === 'multiselect') {
      activeFilters[f.name] = [];
    }
    else if (f.type === 'date_range') {
      activeFilters[f.name] = undefined;
    }
    else {
      // date, year, integer, select, text і т.д.
      activeFilters[f.name] = null;
    }
  });

  // Примусово скидаємо сторінку
  lazyParams.value.page = 1;
  clientFirst.value = 0;

  await nextTick();

  saveStateToStorage();

  if (!isClientMode.value) {
    await loadData();
  }
};

const triggerFilterApply = () => {
  lazyParams.value.page = 1;
  saveStateToStorage();
  loadData();
};

// ====================== LIFECYCLE ======================

watch(() => effectiveStorageKey.value, (newKey) => {
  if (newKey && newKey !== 'undefined') {
    initState(); loadData();
  }
}, { immediate: true });

watch(activeFilters, () => { saveStateToStorage(); }, { deep: true });

const hasVisibleFilters = computed(() => filtersState.value.some(f => f.visible));
const showDownloadBtn   = computed(() => effectiveShowDownload.value);

onMounted(() => {
  const handleConfig = (config: any) => {
    externalConfig.value = config ? { ...config } : null;

    nextTick(() => {
      initState();
      loadData();
    });
  };

  document.addEventListener('datatable:setConfig', (e: any) => {
    handleConfig(e.detail);
  });

  if (window.datatableConfig) {
    handleConfig(window.datatableConfig);
  }
});

onBeforeUnmount(() => destroyScrollSync());
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

</style>
