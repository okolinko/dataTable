import type { ColumnConfig } from '../types';

export function getCellText(
    row: Record<string, unknown>,
    col: ColumnConfig
): string {
    let rawValue: unknown;

    if (typeof col.value === 'function') {
        const html = col.value(row);
        rawValue = Array.isArray(html) ? html.join(' ') : html;
    } else if (col.type === 'computed' && Array.isArray(col.fields)) {
        rawValue = col.fields.map((f) => row[f] ?? '').join(' ');
    } else {
        rawValue = row[col.name] ?? '';
    }

    const div = document.createElement('div');
    div.innerHTML = String(rawValue);
    return (div.textContent || div.innerText || '').toLowerCase();
}

export function stripHtml(value: unknown): string {
    if (typeof value !== 'string') {
        return String(value ?? '');
    }

    const div = document.createElement('div');
    div.innerHTML = value;
    return div.textContent || div.innerText || '';
}