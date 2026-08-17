import type { ActiveFilters, FilterConfig, RangeFilterValue } from '../types';
import { formatDateToLocalString, toDateOnlyISO } from './date';

export type NormalizedOption = {
    label: string;
    value: string | number | boolean;
};

/**
 * Підтримує обидва формати options:
 * - ['А', 'Б']
 * - [{ label: 'А', value: 'a' }, ...]
 * - [{ name: 'А', id: 1 }, ...] з optionLabel / optionValue
 */
export function normalizeFilterOptions(
    options: FilterConfig['options'] | undefined,
    optionLabel = 'label',
    optionValue = 'value'
): NormalizedOption[] {
    if (!options?.length) return [];

    return options.map((opt) => {
        if (opt !== null && typeof opt === 'object' && !Array.isArray(opt)) {
            const obj = opt as Record<string, unknown>;
            const rawValue =
                obj[optionValue] ?? obj.value ?? obj[optionLabel] ?? obj.label;
            const rawLabel =
                obj[optionLabel] ?? obj.label ?? obj[optionValue] ?? obj.value;

            return {
                label: String(rawLabel ?? ''),
                value: rawValue as string | number | boolean,
            };
        }

        return {
            label: String(opt),
            value: opt as string | number | boolean,
        };
    });
}

/** Готує activeFilters для відправки на сервер / export. */
export function getCleanedFilters(
    filtersState: FilterConfig[],
    activeFilters: ActiveFilters
): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    filtersState.forEach((f) => {
        if (!f.visible) return;

        const val = activeFilters[f.name];

        if (f.type === 'date' && val instanceof Date) {
            if (!isNaN(val.getTime())) {
                cleaned[f.name] = toDateOnlyISO(val);
            }
        } else if (f.type === 'year' && val instanceof Date) {
            cleaned[f.name] = val.getFullYear();
        } else if (f.type === 'date_range' && Array.isArray(val)) {
            const [start, end] = val as [Date, Date];
            if (start && end) {
                cleaned[f.name] = `${formatDateToLocalString(start)}-${formatDateToLocalString(end)}`;
            }
        } else if (f.type === 'multiselect' && Array.isArray(val) && val.length > 0) {
            cleaned[f.name] = val;
        } else if (f.type === 'range') {
            const range = val as RangeFilterValue | undefined;
            if (range?.from !== null && range?.from !== undefined) {
                cleaned[`${f.name}_from`] = range.from;
            }
            if (range?.to !== null && range?.to !== undefined) {
                cleaned[`${f.name}_to`] = range.to;
            }
        } else if (
            f.type !== 'range' &&
            val !== '' &&
            val !== null &&
            val !== undefined
        ) {
            cleaned[f.name] = val;
        }
    });

    return cleaned;
}

/** Скидає значення одного фільтра до «порожнього» стану за типом. */
export function getEmptyFilterValue(type: FilterConfig['type']): unknown {
    switch (type) {
        case 'range':
            return { from: null, to: null };
        case 'multiselect':
            return [];
        case 'date_range':
            return undefined;
        case 'select-with-other':
            return null;
        default:
            return null;
    }
}
