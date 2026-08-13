import { ref, nextTick, type Ref } from 'vue';

export function useScrollSync(
    isScrollEnabled: Ref<boolean>,
    dtWrapper: Ref<HTMLElement | null>
) {
    const topScrollContainer = ref<HTMLElement | null>(null);
    const bottomScrollContainer = ref<HTMLElement | null>(null);
    const tableInnerWidth = ref(0);

    let tableScrollElement: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let isSyncingTop = false;
    let isSyncingBottom = false;
    let isSyncingTable = false;

    const updateScrollDimensions = () => {
        if (!isScrollEnabled.value || !dtWrapper.value) return;

        const innerTableContainer = dtWrapper.value.querySelector(
            '.p-datatable-table-container'
        ) as HTMLElement | null;
        const tableEl = dtWrapper.value.querySelector(
            '.p-datatable-table'
        ) as HTMLElement | null;

        if (!innerTableContainer || !tableEl) return;

        tableScrollElement = innerTableContainer;
        tableInnerWidth.value = tableEl.offsetWidth;

        tableScrollElement.removeEventListener('scroll', syncTableToScrollbars);
        tableScrollElement.addEventListener('scroll', syncTableToScrollbars);

        nextTick(() => {
            const scrollLeft = tableScrollElement!.scrollLeft;
            if (topScrollContainer.value) {
                topScrollContainer.value.scrollLeft = scrollLeft;
            }
            if (bottomScrollContainer.value) {
                bottomScrollContainer.value.scrollLeft = scrollLeft;
            }
        });
    };

    const syncTopToTable = () => {
        if (!tableScrollElement || isSyncingTable || isSyncingBottom) return;

        isSyncingTop = true;
        const pos = topScrollContainer.value!.scrollLeft;
        tableScrollElement.scrollLeft = pos;

        if (bottomScrollContainer.value) {
            bottomScrollContainer.value.scrollLeft = pos;
        }

        setTimeout(() => {
            isSyncingTop = false;
        }, 20);
    };

    const syncBottomToTable = () => {
        if (!tableScrollElement || isSyncingTable || isSyncingTop) return;

        isSyncingBottom = true;
        const pos = bottomScrollContainer.value!.scrollLeft;
        tableScrollElement.scrollLeft = pos;

        if (topScrollContainer.value) {
            topScrollContainer.value.scrollLeft = pos;
        }

        setTimeout(() => {
            isSyncingBottom = false;
        }, 20);
    };

    const syncTableToScrollbars = () => {
        if (isSyncingTop || isSyncingBottom) return;

        isSyncingTable = true;
        const pos = tableScrollElement!.scrollLeft;

        if (topScrollContainer.value) {
            topScrollContainer.value.scrollLeft = pos;
        }
        if (bottomScrollContainer.value) {
            bottomScrollContainer.value.scrollLeft = pos;
        }

        setTimeout(() => {
            isSyncingTable = false;
        }, 20);
    };

    const setupScrollSync = () => {
        if (!isScrollEnabled.value) {
            destroyScrollSync();
            return;
        }

        nextTick(() => {
            updateScrollDimensions();
            if (dtWrapper.value && !resizeObserver) {
                resizeObserver = new ResizeObserver(() => updateScrollDimensions());
                resizeObserver.observe(dtWrapper.value);
            }
        });
    };

    const destroyScrollSync = () => {
        if (tableScrollElement) {
            tableScrollElement.removeEventListener('scroll', syncTableToScrollbars);
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
    };

    const handleScrollToggle = (save: () => void) => {
        save();
        if (isScrollEnabled.value) {
            setupScrollSync();
        } else {
            destroyScrollSync();
        }
    };

    return {
        topScrollContainer,
        bottomScrollContainer,
        tableInnerWidth,
        updateScrollDimensions,
        syncTopToTable,
        syncBottomToTable,
        setupScrollSync,
        destroyScrollSync,
        handleScrollToggle,
    };
}
