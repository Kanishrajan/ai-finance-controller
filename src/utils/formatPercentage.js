export function formatPercentage(val = 0) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return `${num.toFixed(1)}%`;
}
