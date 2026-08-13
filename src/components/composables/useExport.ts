import { type Ref } from 'vue';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type {
    ActiveFilters,
    ClientExportResponse,
    DownloadFormat,
    FilterConfig,
    LazyParams,
} from '../types';
import { getAuthHeaders } from '../utils/auth';
import { stripHtml } from '../utils/cell';
import { getCleanedFilters } from '../utils/filters';

function triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function generateCsvBlob(data: ClientExportResponse): Blob {
    const { columns, rows } = data;
    if (!columns || !rows) {
        return new Blob([''], { type: 'text/csv;charset=utf-8;' });
    }

    const headerRow = columns.map((col) => col.header);
    const dataRows = rows.map((row) =>
        columns.map((col) => stripHtml(row[col.key]))
    );

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    const csv = XLSX.utils.sheet_to_csv(ws);

    return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
}

function generateXlsxBlob(data: ClientExportResponse): Blob {
    const { columns, rows } = data;

    if (!columns || !rows) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([['Немає даних']]);
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
    }

    const headerRow = columns.map((col) => col.header);
    const dataRows = rows.map((row) =>
        columns.map((col) => stripHtml(row[col.key]))
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    ws['!cols'] = columns.map((col) => ({ wch: col.width || 40 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Звіт');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
}

export function useExport(options: {
    requestUrl: Ref<string | undefined>;
    requestParams: Ref<Record<string, unknown>>;
    filtersState: Ref<FilterConfig[]>;
    activeFilters: ActiveFilters;
    lazyParams: Ref<LazyParams>;
    downloadFilename: Ref<string>;
    downloadFormat: Ref<DownloadFormat>;
    maxRowsPerFile: Ref<number>;
    downloadLoading: Ref<boolean>;
}) {
    const {
        requestUrl,
        requestParams,
        filtersState,
        activeFilters,
        lazyParams,
        downloadFilename,
        downloadFormat,
        maxRowsPerFile,
        downloadLoading,
    } = options;

    const exportData = async (): Promise<void> => {
        if (!requestUrl.value) return;

        downloadLoading.value = true;

        try {
            const cleanedFilters = getCleanedFilters(
                filtersState.value,
                activeFilters
            );

            const basePayload = {
                filters: { ...requestParams.value, ...cleanedFilters },
                order: {
                    [lazyParams.value.sortField]: lazyParams.value.sortOrder,
                },
            };

            const countRes = await fetch(`${requestUrl.value}-export`, {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...basePayload, limit: 1 }),
            });

            const countData = (await countRes.json()) as { total?: number };
            const total = countData.total || 0;

            if (total === 0) {
                alert('Немає даних для вивантаження.');
                return;
            }

            const fileCount = Math.ceil(total / maxRowsPerFile.value);

            if (fileCount > 1) {
                const zip = new JSZip();

                for (let i = 0; i < fileCount; i++) {
                    const payload = {
                        ...basePayload,
                        limit: maxRowsPerFile.value,
                        offset: i * maxRowsPerFile.value,
                    };

                    const res = await fetch(`${requestUrl.value}-export`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payload),
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP error: ${res.status}`);
                    }

                    const data = (await res.json()) as ClientExportResponse;

                    let baseName = data.filename || downloadFilename.value;
                    if (!baseName || baseName.trim() === '' || baseName === 'export') {
                        baseName = 'party_summary_info';
                    }

                    const fileName = `${baseName}_part${i + 1}`;
                    const blob =
                        downloadFormat.value === 'csv'
                            ? generateCsvBlob(data)
                            : generateXlsxBlob(data);

                    zip.file(`${fileName}.${downloadFormat.value}`, blob);
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                triggerDownload(zipBlob, `${downloadFilename.value}.zip`);

                alert(
                    `Дані експорту (${total.toLocaleString('uk-UA')} записів) розбито на ${fileCount} файлів і запаковано в ZIP архів.`
                );
            } else {
                const payload = {
                    ...basePayload,
                    limit: maxRowsPerFile.value,
                    offset: 0,
                };

                const res = await fetch(`${requestUrl.value}-export`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    throw new Error(`HTTP error: ${res.status}`);
                }

                const data = (await res.json()) as ClientExportResponse;

                let baseName = data.filename || downloadFilename.value;
                if (!baseName || baseName.trim() === '' || baseName === 'export') {
                    baseName = 'party_summary_info';
                }

                const blob =
                    downloadFormat.value === 'csv'
                        ? generateCsvBlob(data)
                        : generateXlsxBlob(data);

                triggerDownload(blob, `${baseName}.${downloadFormat.value}`);
            }
        } catch (error) {
            console.error('Помилка експорту:', error);
            alert('Помилка під час вивантаження даних.');
        } finally {
            downloadLoading.value = false;
        }
    };

    return { exportData };
}