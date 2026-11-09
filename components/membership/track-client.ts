"use client";

type Purchase = {
  transactionId: string;
  value: number;
  currency: string;
  itemId: string;
  itemName: string;
};

function gtag(...args: unknown[]) {
  const fn = (window as Window & { gtag?: (...params: unknown[]) => void }).gtag;
  if (typeof fn === "function") fn(...args);
}

export function trackBeginCheckout(input: { tier: string; tierName: string; value: number }) {
  gtag("event", "begin_checkout", {
    currency: "USD",
    value: input.value,
    items: [{ item_id: input.tier, item_name: input.tierName, quantity: 1, price: input.value }],
  });
}

export function trackPurchase(purchase: Purchase) {
  const key = `mh_purchase_${purchase.transactionId}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode can block storage. One fire per page load is still attempted.
  }
  gtag("event", "purchase", {
    transaction_id: purchase.transactionId,
    currency: purchase.currency,
    value: purchase.value,
    items: [{ item_id: purchase.itemId, item_name: purchase.itemName, quantity: 1, price: purchase.value }],
  });
}
