import { computed, type Ref } from 'vue';
import type {
    ActiveFilters,
    ColumnConfig,
    FilterConfig,
    LazyParams,
    StoredTableState,
} from '../types';

export function useTableStorage(storageKey: Ref<string | undefined>) {
    const STORAGE_KEY = computed(() => `udt_state_${storageKey.value ?? ''}`);

    const loadStateFromStorage = (): StoredTableState | null => {
        if (!storageKey.value || storageKey.value === 'undefined') {
            return null;
        }

        try {
            const saved = localStorage.getItem(STORAGE_KEY.value);
            return saved ? (JSON.parse(saved) as StoredTableState) : null;
        } catch (e) {
            console.error('Помилка читання localStorage:', e);
            return null;
        }
    };

    const saveStateToStorage = (payload: {
        isFiltersPanelOpen: boolean;
        isScrollEnabled: boolean;
        lazyParams: LazyParams;
        columns: ColumnConfig[];
        filters: FilterConfig[];
        activeFilters: ActiveFilters;
        isInitializing: boolean;
    }) => {
        if (
            payload.isInitializing ||
            !storageKey.value ||
            storageKey.value === 'undefined'
        ) {
            return;
        }

        const cleanedActiveFilters: Record<string, unknown> = {};

        Object.keys(payload.activeFilters).forEach((key) => {
            const val = payload.activeFilters[key];

            if (val instanceof Date) {
                cleanedActiveFilters[key] = val.toISOString();
            } else if (Array.isArray(val)) {
                cleanedActiveFilters[key] = val.map((item) => {
                    if (item instanceof Date && !isNaN(item.getTime())) {
                        return item.toISOString();
                    }
                    return item;
                });
            } else if (
                val &&
                typeof val === 'object' &&
                'from' in (val as object) &&
                'to' in (val as object)
            ) {
                const range = val as { from: unknown; to: unknown };
                cleanedActiveFilters[key] = {
                    from: range.from,
                    to: range.to,
                };
            } else {
                cleanedActiveFilters[key] = val;
            }
        });

        try {
            localStorage.setItem(
                STORAGE_KEY.value,
                JSON.stringify({
                    isFiltersPanelOpen: payload.isFiltersPanelOpen,
                    isScrollEnabled: payload.isScrollEnabled,
                    lazyParams: { ...payload.lazyParams },
                    columns: payload.columns.map((c) => ({
                        name: c.name,
                        visible: c.visible,
                    })),
                    filtersVisibility: payload.filters.map((f) => ({
                        name: f.name,
                        visible: f.visible,
                    })),
                    activeFilters: cleanedActiveFilters,
                })
            );
        } catch (e) {
            console.error('Не вдалося зберегти стан:', e);
        }
    };

    return {
        STORAGE_KEY,
        loadStateFromStorage,
        saveStateToStorage,
    };
}
