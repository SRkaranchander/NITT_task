// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Decimal-safe Currency & Arithmetic Utilities (Paise / 2-Decimal Precision)
// ==============================================================================

/**
 * Rounds a number to exactly decimal places safely avoiding floating point artifacts
 */
export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function round4(val: number): number {
  return Math.round((val + Number.EPSILON) * 10000) / 10000;
}

/**
 * Format currency with Indian Rupee symbol and commas
 */
export function formatINR(val: number, includeSymbol: boolean = true): string {
  const rounded = round2(val);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return includeSymbol ? `₹${formatted}` : formatted;
}

export function formatQty(val: number, unit?: string): string {
  const rounded = Number.isInteger(val) ? val.toString() : round2(val).toString();
  return unit ? `${rounded} ${unit}` : rounded;
}

/**
 * Converts a number to Indian Currency words (e.g. 7875 -> Rupees Seven Thousand Eight Hundred and Seventy-Five Only)
 */
export function numberToIndianWords(amount: number): string {
  const val = Math.floor(round2(amount));
  const paise = Math.round((round2(amount) - val) * 100);

  if (val === 0 && paise === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return singleDigits[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return tens[t] + (u !== 0 ? ' ' + singleDigits[u] : '');
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) {
      res += singleDigits[h] + ' Hundred';
      if (rem > 0) res += ' and ';
    }
    if (rem > 0) {
      res += convertTwoDigits(rem);
    }
    return res;
  }

  let words = '';
  const crore = Math.floor(val / 10000000);
  let rem = val % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundreds = rem;

  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds);

  words = 'Rupees ' + words.trim();
  if (paise > 0) {
    words += ' and ' + convertTwoDigits(paise) + ' Paise';
  }
  return words + ' Only';
}
