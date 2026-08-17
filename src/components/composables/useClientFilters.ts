import { computed, type Ref } from 'vue';
import type {
    ActiveFilters,
    ColumnConfig,
    FilterChip,
    FilterConfig,
    RangeFilterValue,
} from '../types';
import { getCellText } from '../utils/cell';
import { formatDateToLocalString, toDateOnlyISO } from '../utils/date';
import { normalizeFilterOptions } from '../utils/filters';

export function useClientFilters<TRow extends Record<string, unknown>>(options: {
    allClientItems: Ref<TRow[]>;
    columnsState: Ref<ColumnConfig<TRow>[]>;
    filtersState: Ref<FilterConfig[]>;
    activeFilters: ActiveFilters;
    globalSearch: Ref<string>;
}) {
    const {
        allClientItems,
        columnsState,
        filtersState,
        activeFilters,
        globalSearch,
    } = options;

    const resolveOptionLabel = (
        filter: FilterConfig,
        rawValue: unknown
    ): string => {
        const normalized = normalizeFilterOptions(
            filter.options,
            filter.optionLabel,
            filter.optionValue
        );

        const found = normalized.find(
            (opt) => String(opt.value) === String(rawValue)
        );

        return found ? found.label : String(rawValue ?? '');
    };

    const applyClientFilters = (row: TRow): boolean => {
        for (const f of filtersState.value) {
            if (!f.visible) continue;

            const val = activeFilters[f.name];

            if (f.type === 'range') {
                const range = val as RangeFilterValue | undefined;
                const rowVal = Number(row[f.name]);
                if (range?.from !== null && range?.from !== undefined && rowVal < range.from) {
                    return false;
                }
                if (range?.to !== null && range?.to !== undefined && rowVal > range.to) {
                    return false;
                }
                continue;
            }

            if (f.type === 'multiselect') {
                if (!Array.isArray(val) || val.length === 0) continue;

                const optValue = f.optionValue || 'value';
                const rowRaw = row[f.name];
                const match = val.some((selectedValue) => {
                    if (typeof selectedValue === 'object' && selectedValue !== null) {
                        return String(rowRaw) === String(
                            (selectedValue as Record<string, unknown>)[optValue]
                        );
                    }
                    return String(rowRaw) === String(selectedValue);
                });

                if (!match) return false;
                continue;
            }

            if (f.type === 'select') {
                if (val === null || val === undefined || val === '') continue;
                if (String(row[f.name]) !== String(val)) return false;
                continue;
            }

            if (f.type === 'integer') {
                if (val === null || val === undefined || val === '') continue;
                if (Number(row[f.name]) !== Number(val)) return false;
                continue;
            }

            if (f.type === 'date') {
                if (!(val instanceof Date) || isNaN(val.getTime())) continue;
                const filterStr = toDateOnlyISO(val);
                if (String(row[f.name]) !== filterStr) return false;
                continue;
            }

            if (f.type === 'year') {
                if (!(val instanceof Date) || isNaN(val.getTime())) continue;
                if (String(row[f.name]) !== String(val.getFullYear())) return false;
                continue;
            }

            if (f.type === 'date_range') {
                if (!Array.isArray(val) || !val[0] || !val[1]) continue;
                const [start, end] = val as [Date, Date];
                const rowDate = new Date(String(row[f.name]));
                if (isNaN(rowDate.getTime())) return false;
                if (rowDate < start || rowDate > end) return false;
                continue;
            }

            // text / string / varchar / select-with-other
            if (val === '' || val === null || val === undefined) continue;

            let cleanRowValue = row[f.name];
            if (typeof cleanRowValue === 'string') {
                cleanRowValue = cleanRowValue.replace(/<[^>]*>/g, '');
            }

            if (
                !String(cleanRowValue ?? '')
                    .toLowerCase()
                    .includes(String(val).toLowerCase())
            ) {
                return false;
            }
        }

        return true;
    };

    const clientFilteredItems = computed<TRow[]>(() => {
        let result = allClientItems.value;

        const search = globalSearch.value.trim().toLowerCase();
        if (search) {
            result = result.filter((row) =>
                columnsState.value
                    .filter((c) => c.visible && c.name !== 'actions')
                    .some((col) => getCellText(row, col).includes(search))
            );
        }

        return result.filter((row) => applyClientFilters(row));
    });

    const activeFilterChips = computed(() => {
        const chips: Record<string, FilterChip> = {};

        filtersState.value.forEach((f) => {
            if (!f.visible) return;

            const val = activeFilters[f.name];
            if (
                val === null ||
                val === undefined ||
                val === '' ||
                (Array.isArray(val) && val.length === 0)
            ) {
                return;
            }

            let displayValue = '';

            if (f.type === 'date_range' && Array.isArray(val)) {
                const [start, end] = val as [Date, Date];
                if (start && end) {
                    displayValue = `${formatDateToLocalString(start)} — ${formatDateToLocalString(end)}`;
                }
            } else if (
                f.type === 'year' &&
                val instanceof Date &&
                !isNaN(val.getTime())
            ) {
                displayValue = String(val.getFullYear());
            } else if (
                f.type === 'date' &&
                val instanceof Date &&
                !isNaN(val.getTime())
            ) {
                displayValue = formatDateToLocalString(val);
            } else if (f.type === 'range') {
                const range = val as RangeFilterValue;
                if (range?.from != null && range?.to != null) {
                    displayValue = `${range.from} — ${range.to}`;
                } else if (range?.from != null) {
                    displayValue = `від ${range.from}`;
                } else if (range?.to != null) {
                    displayValue = `до ${range.to}`;
                }
            } else if (f.type === 'multiselect' && Array.isArray(val)) {
                displayValue = val
                    .map((v) => resolveOptionLabel(f, v))
                    .join(', ');
            } else if (
                (f.type === 'select' || f.type === 'select-with-other') &&
                val !== null &&
                val !== undefined &&
                val !== ''
            ) {
                displayValue = resolveOptionLabel(f, val);
            } else if (Array.isArray(val)) {
                displayValue = val.join(', ');
            } else if (val instanceof Date) {
                displayValue = formatDateToLocalString(val);
            } else {
                displayValue = String(val);
            }

            if (displayValue) {
                chips[f.name] = {
                    title: f.title,
                    value: displayValue,
                };
            }
        });

        return chips;
    });

    const hasActiveFilters = computed(
        () => Object.keys(activeFilterChips.value).length > 0
    );

    return {
        applyClientFilters,
        clientFilteredItems,
        activeFilterChips,
        hasActiveFilters,
    };
}
