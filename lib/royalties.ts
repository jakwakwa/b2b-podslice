export const ROYALTY_RATES = {
  view: 0.001, // $0.001 per view
  share: 0.01, // $0.01 per share
  click: 0.005, // $0.005 per click
}

export function calculateRoyalty(views: number, shares: number, clicks = 0): number {
  const viewRevenue = views * ROYALTY_RATES.view
  const shareRevenue = shares * ROYALTY_RATES.share
  const clickRevenue = clicks * ROYALTY_RATES.click

  return Number((viewRevenue + shareRevenue + clickRevenue).toFixed(2))
}

export function getPayoutSchedule(date: Date): { start: Date; end: Date } {
  const year = date.getFullYear()
  const month = date.getMonth()

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  return { start, end }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}
