import { ref, type Ref } from 'vue';
import type {
    ActiveFilters,
    ApiResponse,
    FilterConfig,
    LazyParams,
} from '../types';
import { getAuthHeaders } from '../utils/auth';
import { getCleanedFilters } from '../utils/filters';

export function useTableData<TRow extends Record<string, unknown>>(options: {
    requestUrl: Ref<string | undefined>;
    storageKey: Ref<string | undefined>;
    requestParams: Ref<Record<string, unknown>>;
    filtersState: Ref<FilterConfig[]>;
    activeFilters: ActiveFilters;
    lazyParams: Ref<LazyParams>;
    isClientMode: Ref<boolean>;
    onAfterLoad?: () => void;
}) {
    const {
        requestUrl,
        storageKey,
        requestParams,
        filtersState,
        activeFilters,
        lazyParams,
        isClientMode,
        onAfterLoad,
    } = options;

    const items = ref<TRow[]>([]);
    const allClientItems = ref<TRow[]>([]);
    const totalRecords = ref(0);
    const loading = ref(true);

    const loadData = async () => {
        if (!requestUrl.value) {
            console.warn('⏳ loadData skipped — config not ready yet');
            return;
        }

        if (!storageKey.value || storageKey.value === 'undefined') return;

        loading.value = true;

        try {
            const cleanedFilters = getCleanedFilters(
                filtersState.value,
                activeFilters
            );
            const mergedFilters = {
                ...requestParams.value,
                ...cleanedFilters,
            };

            const requestBody: Record<string, unknown> = {
                order: {
                    [lazyParams.value.sortField]: lazyParams.value.sortOrder,
                },
                filters: mergedFilters,
            };

            if (!isClientMode.value) {
                requestBody.pager = {
                    page: lazyParams.value.page,
                    size: lazyParams.value.rows,
                };
            }

            const response = await fetch(requestUrl.value, {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestBody),
            });

            const data = (await response.json()) as ApiResponse<TRow>;

            if (data.results) {
                const list = (data.results.list || []) as TRow[];

                if (isClientMode.value) {
                    allClientItems.value = list;
                    totalRecords.value = list.length;
                } else {
                    items.value = list;
                    totalRecords.value = data.results.count || 0;
                }

                onAfterLoad?.();

                document.dispatchEvent(
                    new CustomEvent('datatable:dataLoaded', { detail: data })
                );
            }
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        } finally {
            loading.value = false;
        }
    };

    return {
        items,
        allClientItems,
        totalRecords,
        loading,
        loadData,
    };
}
