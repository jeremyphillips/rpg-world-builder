export type Coin = 'cp' | 'sp' | 'ep' | 'gp' | 'pp'

export type Money = {
  coin: Coin
  value: number
}
