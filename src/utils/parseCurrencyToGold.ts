export const parseCurrencyToGold = (costStr: string): number => {
  const [value, unit] = costStr.split(' ')
  const num = parseFloat(value)
  switch (unit?.toLowerCase()) {
    case 'gp': return num
    case 'sp': return num / 10
    case 'cp': return num / 100
    default: return num
  }
}
