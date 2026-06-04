<template>
  <div class="universal-dt-container">

    <Toolbar class="mb-4 bg-light-gray">
      <template #start></template>
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
              <div v-for="col in columnsState" :key="col.name" class="flex align-items-center m-2">
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

    <div v-show="isFiltersPanelOpen" class="filters-panel mb-4">
      <div v-if="hasVisibleFilters">
        <div class="filters-grid mb-3">
          <div
              v-for="filter in filtersState.filter(f => f.visible)"
              :key="filter.name"
              class="filter-field"
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

            <!-- ФІЧ: RANGE — виправлено хендлери @input та @clear -->
            <div v-else-if="filter.type === 'range'" class="flex gap-2">
              <InputNumber
                  :inputId="'field-' + filter.name + '_from'"
                  v-model="activeFilters[filter.name].from"
                  :placeholder="filter.placeholderFrom || 'Від'"
                  :useGrouping="false"
                  showClear
                  @input="(e) => onRangeFilterInput(e, filter.name, 'from')"
                  @clear="() => onRangeFilterClear(filter.name, 'from')"
              />
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
                @input="onFilterInput"
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
      <div v-else class="text-muted text-center py-2">
        Всі фільтри приховані. Увімкніть потрібні через налаштування поруч із кнопкою "Фільтри".
      </div>
    </div>

    <div
        v-if="isScrollEnabled"
        ref="topScrollContainer"
        class="top-scrollbar-container"
        @scroll="syncTopToTable"
    >
      <div :style="{ width: tableInnerWidth + 'px' }" class="top-scrollbar-filler"></div>
    </div>

    <div ref="dtWrapper" class="dt-responsive-wrapper">
      <DataTable
          :value="items"
          lazy
          paginator
          :rows="lazyParams.rows"
          :totalRecords="totalRecords"
          :loading="loading"
          :first="dtFirstOffset"
          @page="onPage($event)"
          @sort="onSort($event)"
          :sortField="lazyParams.sortField"
          :sortOrder="lazyParams.sortOrder === 'desc' ? -1 : 1"
          removableSort
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="effectiveRowsPerPageOptions"
          currentPageReportTemplate="Показано з {first} по {last} із {totalRecords} записів"
      >
        <template v-for="col in columnsState" :key="col.name">
          <Column
              v-if="col.visible"
              :field="col.name"
              :header="col.title"
              :sortable="col.sortable || false"
              :class="col.attributes?.class || ''"
          >
            <template #body="slotProps">
              <template v-if="typeof col.value === 'function'">
                <span v-html="col.value(slotProps.data)"></span>
              </template>
              <template v-else>
                {{ slotProps.data[col.name] }}
              </template>
            </template>
          </Column>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, computed, watch, nextTick } from 'vue';
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

const columnsIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M29 12.256h-1.88c-0.198-0.585-0.405-1.072-0.643-1.541l0.031 0.067 1.338-1.324c0.35-0.3 0.57-0.742 0.57-1.236 0-0.406-0.149-0.778-0.396-1.063l0.002 0.002-3.178-3.178c-0.283-0.246-0.654-0.395-1.061-0.395-0.494 0-0.937 0.221-1.234 0.57l-0.002 0.002-1.332 1.33c-0.402-0.206-0.888-0.413-1.39-0.586l-0.082-0.025 0.009-1.88c0.003-0.040 0.005-0.086 0.005-0.133 0-0.854-0.66-1.554-1.498-1.617l-0.005-0h-4.496c-0.844 0.063-1.505 0.763-1.505 1.617 0 0.047 0.002 0.093 0.006 0.139l-0 -0.006v1.879c-0.585 0.198-1.071 0.404-1.54 0.641l0.067-0.031-1.324-1.336c-0.299-0.352-0.742-0.573-1.236-0.573-0.407 0-0.778 0.15-1.063 0.397l0.002-0.002-3.179 3.179c-0.246 0.283-0.396 0.655-0.396 1.061 0 0.494 0.221 0.937 0.57 1.234l0.002 0.002 1.329 1.329c-0.207 0.403-0.414 0.891-0.587 1.395l-0.024 0.082-1.88-0.009c-0.040-0.003-0.086-0.005-0.133-0.005-0.854 0-1.554 0.661-1.617 1.499l-0 0.005v4.495c0.062 0.844 0.763 1.505 1.617 1.505 0.047 0 0.093-0.002 0.139-0.006l-0.006 0h1.88c0.198 0.585 0.404 1.072 0.642 1.541l-0.030-0.066-1.335 1.32c-0.351 0.3-0.572 0.744-0.572 1.239 0 0.407 0.149 0.779 0.396 1.064l-0.002-0.002 3.179 3.178c0.249 0.246 0.591 0.399 0.97 0.399 0.007 0 0.014-0 0.021-0h-0.001c0.515-0.013 0.977-0.231 1.308-0.576l0.001-0.001 1.33-1.33c0.403 0.207 0.891 0.414 1.395 0.587l0.082 0.025-0.009 1.878c-0.003 0.040-0.005 0.086-0.005 0.132 0 0.854 0.661 1.555 1.499 1.617l0.005 0h4.496c0.843-0.064 1.503-0.763 1.503-1.617 0-0.047-0.002-0.093-0.006-0.139l0 0.006v-1.881c0.585-0.198 1.073-0.405 1.543-0.643l-0.067 0.031 1.321 1.333c0.332 0.344 0.793 0.562 1.304 0.574l0.002 0h0.002c0.006 0 0.013 0 0.019 0 0.378 0 0.72-0.151 0.971-0.395l3.177-3.177c0.244-0.249 0.395-0.591 0.395-0.968 0-0.009-0-0.017-0-0.026l0 0.001c-0.012-0.513-0.229-0.973-0.572-1.304l-0.001-0.001-1.331-1.332c0.206-0.401 0.412-0.887 0.586-1.389l0.025-0.083 1.879 0.009c0.040 0.003 0.086 0.005 0.132 0.005 0.855 0 1.555-0.661 1.617-1.5l0-0.005v-4.495c-0.063-0.844-0.763-1.504-1.618-1.504-0.047 0-0.093 0.002-0.138 0.006l0.006-0zM16 11.25c-2.623 0-4.75 2.127-4.75 4.75s2.127 4.75 4.75 4.75c2.623 0 4.75-2.127 4.75-4.75v0c-0.003-2.622-2.128-4.747-4.75-4.75h-0zM16 19.25c-1.795 0-3.25-1.455-3.25-3.25s1.455-3.25 3.25-3.25c1.795 0 3.25 1.455 3.25 3.25v0c-0.002 1.794-1.456 3.248-3.25 3.25h-0z"></path></svg>`;
const filterIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M30.646 1.62c-0.133-0.223-0.372-0.37-0.646-0.37h-22c-0.414 0-0.75 0.336-0.75 0.75 0 0.134 0.035 0.259 0.096 0.368l-0.002-0.004 7.763 13.973v4.52c0 0.292 0.167 0.545 0.411 0.668l0.004 0.002 6.284 3.143c0.096 0.050 0.211 0.080 0.332 0.080 0.002 0 0.003 0 0.005 0h-0c0.001 0 0.001 0 0.002 0 0.413 0 0.748-0.335 0.748-0.748 0-0.001 0-0.001 0-0.002v0-7.663l7.764-13.973c0.059-0.105 0.094-0.23 0.094-0.363 0-0.14-0.039-0.272-0.106-0.384l0.002 0.003zM21.486 15.778c-0.059 0.105-0.093 0.231-0.094 0.364v6.645l-4.785-2.393v-4.252c0-0 0-0.001 0-0.001 0-0.133-0.035-0.258-0.097-0.367l0.002 0.004-7.238-13.028h19.45zM14.214 23.25c-0.414 0-0.75 0.336-0.75 0.75v0 4.787l-3.928-1.965v-3.607c0-0 0-0 0-0.001 0-0.133-0.035-0.258-0.097-0.366l0.002 0.004-6.167-11.102h6.17c0.414 0 0.75-0.336 0.75-0.75s-0.336-0.75-0.75-0.75v0h-7.444c-0.414 0-0.75 0.336-0.75 0.75 0 0.134 0.035 0.259 0.096 0.368l-0.002-0.004 6.691 12.046v3.875c0 0.292 0.167 0.544 0.41 0.668l0.004 0.002 5.428 2.715c0.097 0.050 0.211 0.080 0.333 0.080 0.001 0 0.002 0 0.003 0h-0c0.001 0 0.001 0 0.002 0 0.413 0 0.748-0.335 0.748-0.748 0-0.001 0-0.001 0-0.002v0-6c-0-0.414-0.336-0.75-0.75-0.75v0z"></path></svg>`;
const downloadIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M30 21.25c-0.414 0-0.75 0.336-0.75 0.75v0 7.25h-26.5v-7.25c0-0.414-0.336-0.75-0.75-0.75s-0.75 0.336-0.75 0.75v0 8c0 0.414 0.336 0.75 0.75 0.75h28c0.414-0 0.75-0.336 0.75-0.75v0-8c-0-0.414-0.336-0.75-0.75-0.75v0zM15.47 24.531c0.026 0.026 0.065 0.017 0.093 0.038 0.052 0.040 0.088 0.098 0.15 0.124 0.085 0.035 0.184 0.056 0.287 0.057h0c0.207 0 0.394-0.084 0.53-0.219l5.001-5c0.136-0.136 0.22-0.324 0.22-0.531 0-0.415-0.336-0.751-0.751-0.751-0.207 0-0.395 0.084-0.531 0.22l-3.719 3.721v-20.189c0-0.414-0.336-0.75-0.75-0.75s-0.75 0.336-0.75 0.75v0 20.188l-3.72-3.72c-0.136-0.134-0.322-0.218-0.528-0.218-0.415 0-0.751 0.336-0.751 0.751 0 0.207 0.083 0.394 0.219 0.529l-0-0z"></path></svg>`;
const cogIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M29.18 13.92l-2.45-.41a8.91 8.91 0 00-.65-1.57l1.45-2.02a0.75 0.75 0 00-.08-.94l-2.12-2.12a0.75 0.75 0 00-.94-.08l-2.02 1.45a8.91 8.91 0 00-1.57-.65l-.41-2.45A0.75 0.75 0 0019.64 4h-3a0.75 0.75 0 00-.74.63l-.41 2.45a8.91 8.91 0 00-1.57.65L11.9 6.28a0.75 0.75 0 00-.94.08L8.84 8.48a0.75 0.75 0 00-.08.94l1.45 2.02a8.91 8.91 0 00-.65 1.57l-2.45.41A0.75 0.75 0 006.5 14.66v3a0.75 0.75 0 00.63.74l2.45 0.41c.15.55.37 1.08.65 1.57l-1.45 2.02a0.75 0.75 0 00.08.94l2.12 2.12a0.75 0.75 0 00.94.08l2.02-1.45c.49.28 1.02.5 1.57.65l.41 2.45a0.75 0.75 0 00.74.63h3a0.75 0.75 0 00.74-.63l.41-2.45c.55-.15 1.08-.37 1.57-.65l2.02 1.45a0.75 0.75 0 00.94-.08l2.12-2.12a0.75 0.75 0 00.08-.94l-1.45-2.02c.28-.49.5-1.02.65-1.57l2.45-.41a0.75 0.75 0 00.63-.74v-3a0.75 0.75 0 00-.63-.74zM17.84 21.5a5.5 5.5 0 115.5-5.5 5.5 5.5 0 01-5.5 5.5z"></path></svg>`;
const resetFilterIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M28.71 5.29A1 1 0 0 0 28 5H4a1 1 0 0 0-.71 1.71L12 15.42V26a1 1 0 0 0 .45.83l4 2.67A1 1 0 0 0 18 28.67V15.42l6-6V8h2a1 1 0 0 0 0-2h-3.33M27.71 19.29a1 1 0 0 0-1.42 0L24 21.59l-2.29-2.3a1 1 0 0 0-1.42 1.42l2.3 2.29-2.3 2.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l2.29-2.3 2.29 2.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L25.41 23l2.3-2.29a1 1 0 0 0 0-1.42z"/></svg>`;

const externalConfig = ref(null);

const props = defineProps({
  requestUrl: { type: String, required: true },
  storageKey: { type: String, required: true },
  columnsConfig: { type: Array, required: true },
  filtersConfig: { type: Array, default: () => [] },
  defaultOrder: { type: Object, default: () => ({}) },
  showDownload: { type: Boolean, default: false },
  filtersExpanded: { type: Boolean, default: true },
  rowsPerPageOptions: { type: Array, default: () => [10, 25, 50] },
  scrollable: { type: Boolean, default: true }
});

const effectiveRequestUrl = computed(() => externalConfig.value?.requestUrl || props.requestUrl);
const effectiveStorageKey = computed(() => externalConfig.value?.storageKey || props.storageKey);
const effectiveColumns = computed(() => externalConfig.value?.columns || props.columnsConfig);
const effectiveFilters = computed(() => externalConfig.value?.filters || props.filtersConfig);
const effectiveOrder = computed(() => externalConfig.value?.order || props.defaultOrder);
const effectiveShowDownload = computed(() => externalConfig.value?.showDownload ?? props.showDownload);
const effectiveFiltersExpanded = computed(() => externalConfig.value?.filtersExpanded ?? props.filtersExpanded);
const effectiveRowsPerPageOptions = computed(() => externalConfig.value?.rowsPerPageOptions || props.rowsPerPageOptions);
const effectiveScrollable = computed(() => externalConfig.value?.scrollable ?? props.scrollable);

const dtFirstOffset = computed(() => (lazyParams.value.page - 1) * lazyParams.value.rows);
const STORAGE_KEY = computed(() => `udt_state_${effectiveStorageKey.value}`);

const items = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const downloadLoading = ref(false);

const columnsPopover = ref(null);
const filtersPopover = ref(null);

const isFiltersPanelOpen = ref(true);
const columnsState = ref([]);
const filtersState = ref([]);
const activeFilters = reactive({});
const lazyParams = ref({ page: 1, rows: 10, sortField: 'id', sortOrder: 'desc' });

const isScrollEnabled = ref(true);
const topScrollContainer = ref(null);
const dtWrapper = ref(null);
const tableInnerWidth = ref(0);
let tableScrollElement = null;
let resizeObserver = null;
let isInitializing = false;
let filterTimeout = null;

// ─── ХЕНДЛЕРИ ДЛЯ INTEGER ───────────────────────────────────────────────────
const onIntegerFilterInput = (event, filterName) => {
  const parsedValue = (event.value !== undefined && event.value !== null && event.value !== '')
      ? Number(event.value)
      : null;
  activeFilters[filterName] = parsedValue;
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => { triggerFilterApply(); }, 500);
};

// ─── ВИПРАВЛЕНІ ХЕНДЛЕРИ ДЛЯ RANGE ──────────────────────────────────────────
// БАГ 1 ВИПРАВЛЕНО: примусово оновлюємо вкладений проп реактивного об'єкта
// через явне присвоєння, а не покладаємось на v-model у PrimeVue InputNumber
const onRangeFilterInput = (event, filterName, field) => {
  const parsedValue = (event.value !== undefined && event.value !== null && event.value !== '')
      ? Number(event.value)
      : null;
  activeFilters[filterName][field] = parsedValue;
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => { triggerFilterApply(); }, 500);
};

// БАГ 2 ВИПРАВЛЕНО (частково): окремий clear щоб не писати '' у вкладений об'єкт
const onRangeFilterClear = (filterName, field) => {
  activeFilters[filterName][field] = null;
  clearTimeout(filterTimeout);
  triggerFilterApply();
};

// ─── LOCAL STORAGE ───────────────────────────────────────────────────────────
const loadStateFromStorage = () => {
  if (!effectiveStorageKey.value || effectiveStorageKey.value === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY.value);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Помилка читання localStorage:', e);
    return null;
  }
};

const formatDateToLocalString = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const initState = () => {
  isInitializing = true;

  const savedState = loadStateFromStorage();
  const defaultRows = effectiveRowsPerPageOptions.value?.[0] || 10;

  isFiltersPanelOpen.value = (savedState && savedState.isFiltersPanelOpen !== undefined)
      ? savedState.isFiltersPanelOpen
      : effectiveFiltersExpanded.value;

  if (externalConfig.value && externalConfig.value.scrollable !== undefined) {
    isScrollEnabled.value = externalConfig.value.scrollable;
  } else if (savedState && savedState.isScrollEnabled !== undefined) {
    isScrollEnabled.value = savedState.isScrollEnabled;
  } else {
    isScrollEnabled.value = effectiveScrollable.value;
  }

  columnsState.value = effectiveColumns.value.map(col => {
    const savedCol = savedState?.columns?.find(c => c.name === col.name);
    return { ...col, visible: savedCol ? savedCol.visible : (col.visible !== false) };
  });

  filtersState.value = effectiveFilters.value.map(f => {
    const savedFilter = savedState?.filtersVisibility?.find(sf => sf.name === f.name);
    return { ...f, visible: savedFilter ? savedFilter.visible : (f.visible !== false) };
  });

  Object.keys(activeFilters).forEach(key => delete activeFilters[key]);

  effectiveFilters.value.forEach(f => {
    const savedValue = savedState?.activeFilters?.[f.name];

    if ((f.type === 'date' || f.type === 'year') && savedValue) {
      activeFilters[f.name] = new Date(savedValue);
    } else if (f.type === 'date_range' && Array.isArray(savedValue)) {
      activeFilters[f.name] = savedValue.map(d => d ? new Date(d) : null);
    } else if (f.type === 'range') {
      // Завжди ініціалізуємо як об'єкт — навіть якщо savedValue відсутній
      activeFilters[f.name] = {
        from: savedValue?.from ?? null,
        to: savedValue?.to ?? null
      };
    } else if (f.type === 'multiselect') {
      activeFilters[f.name] = Array.isArray(savedValue) ? savedValue : [];
    } else {
      activeFilters[f.name] = savedValue !== undefined ? savedValue : '';
    }
  });

  lazyParams.value = {
    page: savedState?.lazyParams?.page || 1,
    rows: savedState?.lazyParams?.rows || defaultRows,
    sortField: savedState?.lazyParams?.sortField || Object.keys(effectiveOrder.value)[0] || 'id',
    sortOrder: savedState?.lazyParams?.sortOrder || 'desc'
  };

  nextTick(() => {
    isInitializing = false;
    setupScrollSync();
  });
};

watch(() => effectiveStorageKey.value, (newKey) => {
  if (newKey && newKey !== 'undefined') {
    initState();
    loadData();
  }
}, { immediate: true });

const hasVisibleFilters = computed(() => filtersState.value.some(f => f.visible));
const showDownloadBtn = computed(() => effectiveShowDownload.value);

const saveStateToStorage = () => {
  if (isInitializing || !effectiveStorageKey.value || effectiveStorageKey.value === 'undefined') return;

  const cleanedActiveFilters = {};
  Object.keys(activeFilters).forEach(key => {
    const val = activeFilters[key];
    if (val instanceof Date) {
      cleanedActiveFilters[key] = val.toISOString();
    } else if (Array.isArray(val)) {
      cleanedActiveFilters[key] = val.map(d => d instanceof Date ? d.toISOString() : d);
    } else if (val !== null && typeof val === 'object' && 'from' in val && 'to' in val) {
      // Зберігаємо range як об'єкт { from, to }
      cleanedActiveFilters[key] = { from: val.from, to: val.to };
    } else {
      cleanedActiveFilters[key] = val;
    }
  });

  const stateToSave = {
    isFiltersPanelOpen: isFiltersPanelOpen.value,
    isScrollEnabled: isScrollEnabled.value,
    lazyParams: {
      page: lazyParams.value.page,
      rows: lazyParams.value.rows,
      sortField: lazyParams.value.sortField,
      sortOrder: lazyParams.value.sortOrder
    },
    columns: columnsState.value.map(c => ({ name: c.name, visible: c.visible })),
    filtersVisibility: filtersState.value.map(f => ({ name: f.name, visible: f.visible })),
    activeFilters: cleanedActiveFilters
  };
  localStorage.setItem(STORAGE_KEY.value, JSON.stringify(stateToSave));
};

watch(activeFilters, () => { saveStateToStorage(); }, { deep: true });

const toggleFiltersPanel = () => {
  isFiltersPanelOpen.value = !isFiltersPanelOpen.value;
  saveStateToStorage();
};

// ─── ФОРМУВАННЯ ФІЛЬТРІВ ДЛЯ БЕКЕНДУ ────────────────────────────────────────
const getCleanedFilters = () => {
  const cleaned = {};

  filtersState.value.forEach(f => {
    const val = activeFilters[f.name];

    if (!f.visible) return;

    if (f.type === 'date' && val instanceof Date) {
      if (!isNaN(val.getTime())) {
        const offset = val.getTimezoneOffset();
        const correctedDate = new Date(val.getTime() - (offset * 60 * 1000));
        cleaned[f.name] = correctedDate.toISOString().split('T')[0];
      }
    } else if (f.type === 'year' && val instanceof Date) {
      if (!isNaN(val.getTime())) {
        cleaned[f.name] = val.getFullYear();
      }
    } else if (f.type === 'date_range' && Array.isArray(val)) {
      const [startDate, endDate] = val;
      if (startDate && endDate) {
        cleaned[f.name] = `${formatDateToLocalString(startDate)}-${formatDateToLocalString(endDate)}`;
      }
    } else if (f.type === 'multiselect' && Array.isArray(val) && val.length > 0) {
      cleaned[f.name] = val;
    } else if (f.type === 'range') {
      // БАГ 3 ВИПРАВЛЕНО: перевіряємо !== null замість falsy (0 є валідним значенням!)
      const from = val?.from;
      const to = val?.to;
      if (from !== null && from !== undefined) {
        cleaned[`${f.name}_from`] = from;
      }
      if (to !== null && to !== undefined) {
        cleaned[`${f.name}_to`] = to;
      }
    } else if (f.type !== 'range' && val !== '' && val !== null && val !== undefined) {
      cleaned[f.name] = val;
    }
  });

  return cleaned;
};

// ─── ЗАВАНТАЖЕННЯ ДАНИХ ──────────────────────────────────────────────────────
const loadData = async () => {
  if (!effectiveStorageKey.value || effectiveStorageKey.value === 'undefined') return;
  loading.value = true;
  const payload = {
    pager: { page: lazyParams.value.page, size: lazyParams.value.rows },
    order: { [lazyParams.value.sortField]: lazyParams.value.sortOrder },
    filters: getCleanedFilters()
  };
  try {
    const response = await fetch(effectiveRequestUrl.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.results) {
      items.value = data.results.list;
      totalRecords.value = data.results.count;
      nextTick(() => { updateScrollDimensions(); });
    }
  } catch (error) {
    console.error('Помилка завантаження даних:', error);
  } finally {
    loading.value = false;
  }
};

const exportData = async () => {
  downloadLoading.value = true;
  const payload = {
    filters: getCleanedFilters(),
    order: { [lazyParams.value.sortField]: lazyParams.value.sortOrder }
  };
  try {
    const response = await fetch(effectiveRequestUrl.value + '-export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify(payload)
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error('Помилка експорту:', error);
  } finally {
    downloadLoading.value = false;
  }
};

const toggleColumnsPopover = (event) => { columnsPopover.value.toggle(event); };
const toggleFiltersPopover = (event) => { filtersPopover.value.toggle(event); };

// ─── СКРОЛ СИНХРОНІЗАЦІЯ ─────────────────────────────────────────────────────
const updateScrollDimensions = () => {
  if (!isScrollEnabled.value || !dtWrapper.value) return;
  const innerTableContainer = dtWrapper.value.querySelector('.p-datatable-table-container')
      || dtWrapper.value.querySelector('.p-datatable-scrollbar');
  const tableEl = dtWrapper.value.querySelector('.p-datatable-table');
  if (innerTableContainer && tableEl) {
    tableScrollElement = innerTableContainer;
    tableInnerWidth.value = tableEl.offsetWidth;
    tableScrollElement.removeEventListener('scroll', syncTableToTop);
    tableScrollElement.addEventListener('scroll', syncTableToTop);
    nextTick(() => {
      if (topScrollContainer.value) {
        topScrollContainer.value.scrollLeft = tableScrollElement.scrollLeft;
      }
    });
  }
};

let isSyncingTop = false;
let isSyncingTable = false;

const syncTopToTable = () => {
  if (!tableScrollElement || isSyncingTable) return;
  isSyncingTop = true;
  tableScrollElement.scrollLeft = topScrollContainer.value.scrollLeft;
  setTimeout(() => { isSyncingTop = false; }, 20);
};

const syncTableToTop = () => {
  if (!topScrollContainer.value || isSyncingTop) return;
  isSyncingTable = true;
  topScrollContainer.value.scrollLeft = tableScrollElement.scrollLeft;
  setTimeout(() => { isSyncingTable = false; }, 20);
};

const setupScrollSync = () => {
  if (!isScrollEnabled.value) { destroyScrollSync(); return; }
  nextTick(() => {
    updateScrollDimensions();
    if (dtWrapper.value && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => { updateScrollDimensions(); });
      resizeObserver.observe(dtWrapper.value);
    }
  });
};

const destroyScrollSync = () => {
  if (tableScrollElement) {
    tableScrollElement.removeEventListener('scroll', syncTableToTop);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
};

const handleScrollToggle = () => {
  saveStateToStorage();
  isScrollEnabled.value ? setupScrollSync() : destroyScrollSync();
};

const onColumnVisibilityChange = () => {
  saveStateToStorage();
  setTimeout(() => { updateScrollDimensions(); }, 50);
};

onMounted(() => {
  document.addEventListener('datatable:setConfig', (e) => {
    externalConfig.value = e.detail;
    initState();
    loadData();
  });
  if (window.datatableConfig) {
    externalConfig.value = window.datatableConfig;
    initState();
    loadData();
  }
});

onBeforeUnmount(() => { destroyScrollSync(); });

// ─── ПАГІНАЦІЯ / СОРТУВАННЯ ──────────────────────────────────────────────────
const onPage = (event) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.rows = event.rows;
  saveStateToStorage();
  loadData();
};

const onSort = (event) => {
  lazyParams.value.sortField = event.sortField || 'id';
  lazyParams.value.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
  saveStateToStorage();
  loadData();
};

// ─── ЗАГАЛЬНІ ФІЛЬТР-ХЕНДЛЕРИ ────────────────────────────────────────────────
const triggerFilterApply = () => {
  lazyParams.value.page = 1;
  saveStateToStorage();
  loadData();
};

const onFilterInput = () => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => { triggerFilterApply(); }, 500);
};

const onFilterClear = () => {
  clearTimeout(filterTimeout);
  triggerFilterApply();
};

const onFilterDateUpdate = () => {
  clearTimeout(filterTimeout);
  triggerFilterApply();
};

// БАГ 2 ВИПРАВЛЕНО: коректне скидання кожного типу фільтра
const clearAllFilters = () => {
  clearTimeout(filterTimeout);
  effectiveFilters.value.forEach(f => {
    if (f.type === 'range') {
      // Не замінюємо об'єкт на '' — скидаємо поля всередині
      activeFilters[f.name] = { from: null, to: null };
    } else if (f.type === 'multiselect') {
      activeFilters[f.name] = [];
    } else if (f.type === 'date' || f.type === 'date_range' || f.type === 'year') {
      activeFilters[f.name] = null;
    } else {
      activeFilters[f.name] = '';
    }
  });
  triggerFilterApply();
};
</script>

<style scoped>
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
.text-primary { color: #21cc51 !important; }
.bg-light-gray { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 0.75rem; border-radius: 6px; }
.text-center { text-align: center; }
.text-muted { color: #6c757d; font-size: 14px; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.max-h-popover { max-height: 300px; overflow-y: auto; }
.custom-svg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.svg-icon-wrapper { display: inline-flex; align-items: center; justify-content: center; line-height: 1; color: #555555; transition: color 0.15s ease-in-out; }
.p-button-warning .svg-icon-wrapper { color: #212529; }
.p-button-warning:hover .svg-icon-wrapper { color: #000000; }
.p-button-outlined:hover .svg-icon-wrapper { color: #3b82f6; }
.p-button-secondary.p-button-outlined:hover .svg-icon-wrapper { color: #4b5563; }
.border-left-0 { border-top-left-radius: 0 !important; border-bottom-left-radius: 0 !important; border-left: 0 !important; }
.p-segmented-button-group .p-button:first-child { border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; }
.filters-panel { background: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.filters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
.filter-field { display: flex; flex-direction: column; }
.filter-field label { font-size: 14px; font-weight: 600; margin-bottom: 5px; color: #333; }
.p-button-outlined.p-button-secondary:not(:disabled):hover { background: #e2e8f0; border: 1px solid #e2e8f0; color: #334155; }
.top-scrollbar-container { overflow-x: auto; overflow-y: hidden; margin-bottom: 4px; height: 13px; position: sticky; top: 0; left: 0; width: 100%; z-index: 1; display: block; }
.top-scrollbar-container::-webkit-scrollbar { height: 9px; }
.top-scrollbar-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
.top-scrollbar-container::-webkit-scrollbar-thumb { background: #8b8b8b; border-radius: 4px; }
.top-scrollbar-container::-webkit-scrollbar-thumb:hover { background: #6c6b6b; }
.top-scrollbar-filler { height: 1px; }
.dt-responsive-wrapper { width: 100%; overflow: hidden; }
:deep(.success) { color: #0a570a; font-weight: 600; }
:deep(.failed) { color: #bb0e4a; font-weight: 600; }
:deep(.actions-column) { width: max-content; }
:deep(.actions-column a svg) { fill: #244464; transition: fill 0.2s; margin-right: 5px; }
:deep(.actions-column a svg:hover) { fill: #e8a51f; }
</style>
