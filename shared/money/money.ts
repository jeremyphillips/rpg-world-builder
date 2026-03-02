import type { Coin, Money } from './types'

export const COIN_TO_CP: Record<Coin, number> = {
  cp: 1,
  sp: 10,
  ep: 50,
  gp: 100,
  pp: 1000,
}

export const moneyToCp = (money?: Money): number => {
  if (!money) return 0
  return money.value * COIN_TO_CP[money.coin]
}

export const cpToDenoms = (cp: number): { gp: number; sp: number; cp: number } => {
  const abs = Math.abs(cp)
  const gp = Math.floor(abs / 100)
  const remainder = abs - gp * 100
  const sp = Math.floor(remainder / 10)
  return { gp, sp, cp: remainder % 10 }
}

export const formatMoney = (money?: Money): string => {
  return formatCp(moneyToCp(money))
}

export const formatCp = (cp: number): string => {
  if (cp === 0) return '0 cp'
  const d = cpToDenoms(cp)
  const parts: string[] = []
  if (d.gp > 0) parts.push(`${d.gp} gp`)
  if (d.sp > 0) parts.push(`${d.sp} sp`)
  if (d.cp > 0) parts.push(`${d.cp} cp`)
  const result = parts.join(' ') || '0 cp'
  return cp < 0 ? `-${result}` : result
}
