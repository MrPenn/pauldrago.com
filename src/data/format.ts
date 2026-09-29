// Number and name formats the service pages share, so a figure reads the same wherever it appears.
export const pct = (n: number) => `${Math.round(n)}%`;
export const num = (n: number) => Math.round(n).toLocaleString('en-US');
// Deposits held in billions, and plan figures held in $ thousands, shown in millions.
export const money = (b: number) => `$${b.toFixed(1)}B`;
export const mUSD = (n: number) => `$${(Math.abs(n) / 1000).toFixed(1)}M`;
// A bank's name without its legal suffix.
export const shortName = (name: string) => name.replace(/, National Association$/, '').replace(/ Bank$/, '');
// A position in a list as two digits: 01, 02.
export const twoDigit = (i: number) => String(i + 1).padStart(2, '0');
