export function calculate(expression: string): string {
  const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/g, '');

  if (sanitized.length === 0) {
    throw new Error('Invalid expression');
  }

  try {
    const withPow = sanitized.replace(/\^/g, '**');
    const fn = new Function(`"use strict"; return (${withPow});`);
    const result = fn();

    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Result is not a finite number');
    }

    return String(result);
  } catch {
    throw new Error(`Failed to evaluate expression: ${expression}`);
  }
}
