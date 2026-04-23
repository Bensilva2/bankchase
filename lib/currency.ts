// Centralized currency formatting utility for USD
export const CURRENCY = {
  symbol: "$",
  code: "USD",
  locale: "en-US",
}

export function formatCurrency(amount: number | undefined | null): string {
  const value = amount ?? 0
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCurrencyWithSign(amount: number | undefined | null, type: "credit" | "debit"): string {
  const value = amount ?? 0
  const sign = type === "debit" ? "-" : "+"
  return `${sign}$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
