export interface PaymentPlan {
  id: string;
  name: string;
  initialPercentage: number;
  months: number | null;
  term: string;
  initial_deposit_in_value?: string;
  price?: string;
  payment_period_in_months?: string;
  payment_frequency: string;
  periodic_payment?: string;
  unit_title?: string;
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString("en", { maximumFractionDigits: 0 })} €`;
}

export const formatAmount = (str: string | number, options: Intl.NumberFormatOptions, locales: Intl.LocalesArgument = "en-US") => {
  return str && typeof str == "string"
    ? Number(str?.replace(/\,/g, "")).toLocaleString(locales, options)
    : Number(str?.toString()?.replace(/\,/g, "")).toLocaleString(locales, options);
};

export function formatToCurrency(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (Number.isNaN(n)) return "0.00";
  return `${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatToCurrencyNaira(amount: number | string | null | undefined): string {
  return `₦${formatToCurrency(amount)}`;
}

export const formatListingAmount = (amount: number | string | null | undefined, currencyValue?: string) => {
  const localCurrency = sessionStorage.getItem("project-currency");
  const currency = localCurrency || currencyValue;

  if (!currency) return formatToCurrencyNaira(amount);
  else {
    const locale = `en-${currency?.substring(0, 2) || "US"}`;
    return formatAmount(amount || 0, { style: "currency", currency }, locale);
  }
};
