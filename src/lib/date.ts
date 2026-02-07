export function formatDateBR(dateISO: string) {
    const [y, m, d] = dateISO.split('-');
    return `${d}/${m}/${y}`;
}
