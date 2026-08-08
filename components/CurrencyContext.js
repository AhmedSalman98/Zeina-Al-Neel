"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CurrencyContext = createContext(null);

export const markets = {
  EG: {
    country: "مصر",
    flag: "🇪🇬",
    currency: "EGP",
    label: "جنيه مصري",
    symbol: "ج.م"
  },
  AE: {
    country: "الإمارات",
    flag: "🇦🇪",
    currency: "AED",
    label: "درهم إماراتي",
    symbol: "د.إ"
  },
  QA: {
    country: "قطر",
    flag: "🇶🇦",
    currency: "QAR",
    label: "ريال قطري",
    symbol: "ر.ق"
  },
};

export function CurrencyProvider({ children }) {
  const [marketCode, setMarketCode] = useState("EG");
  const [rates, setRates] = useState({
    EGP: 1,
    AED: 0.074,
    QAR: 0.073,
  });
  const [ratesUpdated, setRatesUpdated] = useState("");

  useEffect(() => {
    const savedMarket = localStorage.getItem("zeenatMarket");
    if (savedMarket && markets[savedMarket]) {
      setMarketCode(savedMarket);
    }

    const savedRates = localStorage.getItem("zeenatRates");
    const savedAt = Number(localStorage.getItem("zeenatRatesTime") || 0);
    const oneDay = 24 * 60 * 60 * 1000;

    if (savedRates && Date.now() - savedAt < oneDay) {
      try {
        setRates(JSON.parse(savedRates));
        setRatesUpdated(new Date(savedAt).toLocaleDateString("ar-EG"));
        return;
      } catch {}
    }

    async function loadRates() {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/EGP");
        if (!response.ok) throw new Error("Exchange rate request failed");
        const data = await response.json();

        const nextRates = {
          EGP: 1,
          AED: data.rates?.AED || 0.074,
          QAR: data.rates?.QAR || 0.073,
        };

        setRates(nextRates);
        setRatesUpdated(new Date().toLocaleDateString("ar-EG"));
        localStorage.setItem("zeenatRates", JSON.stringify(nextRates));
        localStorage.setItem("zeenatRatesTime", String(Date.now()));
      } catch {
        setRatesUpdated("سعر تقريبي");
      }
    }

    loadRates();
  }, []);

  function changeMarket(code) {
    if (!markets[code]) return;
    setMarketCode(code);
    localStorage.setItem("zeenatMarket", code);
  }

  const market = markets[marketCode];

  function convert(basePriceEGP) {
    return basePriceEGP * (rates[market.currency] || 1);
  }

  function formatPrice(basePriceEGP) {
    const amount = convert(basePriceEGP);
    const isNoDecimal = market.currency === "EGP";

    return `${new Intl.NumberFormat("ar-EG", {
      maximumFractionDigits: 2,
      minimumFractionDigits: isNoDecimal ? 0 : 2
    }).format(amount)} ${market.symbol}`;
  }

  const value = useMemo(() => ({
    marketCode,
    market,
    markets,
    rates,
    ratesUpdated,
    changeMarket,
    convert,
    formatPrice
  }), [marketCode, market, rates, ratesUpdated]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
}
