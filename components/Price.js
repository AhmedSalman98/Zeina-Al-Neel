"use client";

import { useCurrency } from "./CurrencyContext";

export default function Price({ amount, className = "" }) {
  const { formatPrice } = useCurrency();
  return <span className={className}>{formatPrice(amount)}</span>;
}
