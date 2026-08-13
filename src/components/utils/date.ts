export function formatDateToLocalString(date: Date | null | undefined): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

/** Коригує Date під UTC-дату без зсуву таймзони (для date-фільтрів). */
export function toDateOnlyISO(date: Date): string {
    const offset = date.getTimezoneOffset();
    const corrected = new Date(date.getTime() - offset * 60 * 1000);
    return corrected.toISOString().split('T')[0];
}