export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
};

export type FaqCategory = {
  id: string;
  title: string;
  description: string;
  entries: FaqEntry[];
};

const deliveryEntries: FaqEntry[] = [
  {
    id: "delivery-access",
    question: "How do I start ordering?",
    answer: "Create an account, verify your ID inside /account, and place your first order. We'll send a collection code by SMS shortly before pickup.",
    keywords: ["verify", "delivery"]
  },
  {
    id: "collection-window",
    question: "How long is the collection window?",
    answer: "Standard window is 120 minutes after the SMS. Reply BEFORE the timer expires if you need an extension so the team can hold your parcel.",
    keywords: ["window", "pickup"]
  },
  {
    id: "missed-pickup",
    question: "What if I miss the pickup?",
    answer: "Reply to the SMS or message us on Telegram @greenhub_support. We can reschedule or arrange redelivery once the courier returns.",
    keywords: ["miss", "pickup"]
  }
];

const paymentEntries: FaqEntry[] = [
  {
    id: "payment-methods",
    question: "What payment methods are supported?",
    answer: "Account top-ups (minimum £20), NowPayments card/USDT bridge, and manual bank or direct USDT transfers. Cash on delivery isn't offered.",
    keywords: ["card", "USDT"]
  },
  {
    id: "transfer-id",
    question: "Why is the Transfer ID important?",
    answer: "It links your payments to the correct account. Add it to every bank/USDT reference and include it when chatting with support.",
    keywords: ["transfer id", "reference"]
  },
  {
    id: "nowpayments-issues",
    question: "NowPayments flagged my card—what now?",
    answer: "They run their own risk checks. If the invoice fails twice, switch to account balance or bank, or DM support so finance can review manually.",
    keywords: ["nowpayments", "card"]
  }
];

const orderEntries: FaqEntry[] = [
  {
    id: "order-status",
    question: "Where can I see order status?",
    answer: "Visit /orders for live tracking. Each card shows your delivery postcode, payment method, and a link to the detail page.",
    keywords: ["status", "orders"]
  },
  {
    id: "change-delivery",
    question: "Can I change my delivery address after ordering?",
    answer: "Yes—reply to the SMS or message Telegram @greenhub_support with the new postcode. We need roughly 2 hours' notice to reassign.",
    keywords: ["change", "delivery"]
  },
  {
    id: "damaged",
    question: "What if the parcel looks tampered?",
    answer: "Take photos and contact support immediately with your order reference. The team will inspect and issue a refund or redelivery.",
    keywords: ["damaged", "parcel"]
  }
];

const balanceEntries: FaqEntry[] = [
  {
    id: "balance-withdraw",
    question: "How do I withdraw funds?",
    answer: "Use /wallet/withdraw to send balance to a UK bank, USDT address, or another member handle. Minimum transfer is £20.",
    keywords: ["withdraw", "balance"]
  },
  {
    id: "balance-refund",
    question: "How long do refunds take?",
    answer: "Account credits post within 6 hours of approval. Bank transfers can take 3–5 working days depending on your bank.",
    keywords: ["refund", "balance"]
  }
];

const referralEntries: FaqEntry[] = [
  {
    id: "referral-rewards",
    question: "What do I earn from referrals?",
    answer: "£0.30 per verified click plus 10% of every order your friend places — for life.",
    keywords: ["referral", "rewards"]
  },
  {
    id: "share-link",
    question: "Where do I find my invite link?",
    answer: "Visit /referral or /invite?ref=YOURCODE. Copy the link or generate a poster under /referral/poster.",
    keywords: ["invite", "poster"]
  }
];

export const faqCategories: FaqCategory[] = [
  { id: "all", title: "All topics", description: "Browse every question in one place.", entries: [] },
  { id: "delivery", title: "Delivery", description: "Collection, pickup windows, and incidents.", entries: deliveryEntries },
  { id: "payment", title: "Payments", description: "Top-ups, NowPayments, and manual transfers.", entries: paymentEntries },
  { id: "orders", title: "Orders", description: "Tracking, address changes, damaged parcels.", entries: orderEntries },
  { id: "balance", title: "Balance & withdrawals", description: "Credits, refunds, payouts.", entries: balanceEntries },
  { id: "referral", title: "Referrals", description: "Earning from invites.", entries: referralEntries }
];

export type FaqEntryWithCategory = FaqEntry & { category: string };

export const flatFaqEntries: FaqEntryWithCategory[] = faqCategories
  .filter((category) => category.id !== "all")
  .flatMap((category) => category.entries.map((entry) => ({ ...entry, category: category.id })));
