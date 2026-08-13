// ====================== COLUMN ======================

export interface ColumnConfig {
    name: string;
    title?: string;
    visible?: boolean;
    sortable?: boolean;
    width?: string;
    type?: 'computed';
    fields?: string[];
    value?: (data: Record<string, unknown>) => string | string[];
    class?: string;
    headerClass?: string;
    bodyClass?: string;
    footerClass?: string;
    attributes?: { class?: string };
}

// ====================== FILTER ======================

export type FilterType =
    | 'string'
    | 'text'
    | 'varchar'
    | 'integer'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'date_range'
    | 'year'
    | 'range'
    | 'select-with-other';

export interface FilterConfig {
    name: string;
    title: string;
    type: FilterType;
    visible?: boolean;
    inToolbar?: boolean;
    defaultValue?: unknown;
    options?: Array<Record<string, unknown> | string | number>;
    optionLabel?: string;
    optionValue?: string;
    placeholder?: string;
    placeholderFrom?: string;
    placeholderTo?: string;
    otherPlaceholder?: string;
    otherLabel?: string;
    colSpan?: 2 | 3;
    minWidth?: string;
}

export type ActiveFilters = Record<string, unknown>;

export interface FilterChip {
    title: string;
    value: string;
}

export type RangeFilterValue = {
    from: number | null;
    to: number | null;
};

// ====================== TABLE CONFIG ======================

export interface LazyParams {
    page: number;
    rows: number;
    sortField: string;
    sortOrder: 'asc' | 'desc';
}

export interface ClientExportColumn {
    key: string;
    header: string;
    width?: number;
}

export interface ClientExportResponse {
    columns: ClientExportColumn[];
    rows: Record<string, unknown>[];
    filename?: string;
    total?: number;
}

export type DownloadFormat = 'xlsx' | 'csv';
export type PaginationMode = 'server' | 'client';

export interface TableConfig {
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
    requestParams?: Record<string, unknown>;
    maxRowsPerFile?: number;
}

export interface ApiResponse {
    results?: {
        list: Record<string, unknown>[];
        count: number;
    };
}

// ====================== PROPS ======================

export interface TableProps {
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
    requestParams?: Record<string, unknown>;
    maxRowsPerFile?: number;
}

// ====================== STORAGE ======================

export interface StoredTableState {
    isFiltersPanelOpen?: boolean;
    isScrollEnabled?: boolean;
    lazyParams?: Partial<LazyParams>;
    columns?: Array<{ name: string; visible?: boolean }>;
    filtersVisibility?: Array<{ name: string; visible?: boolean }>;
    activeFilters?: Record<string, unknown>;
}

// ====================== EVENTS ======================

export interface DataTablePageEvent {
    page: number;
    rows: number;
    first: number;
}

export interface DataTableSortEvent {
    sortField?: string | null;
    sortOrder?: number | null;
}