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
    answer: "Create an account, top up your wallet, and place your first order. You'll receive a collection code by email once your parcel reaches the locker.",
    keywords: ["verify", "delivery"]
  },
  {
    id: "collection-window",
    question: "How long is the collection window?",
    answer: "You have 72 hours to collect from the InPost locker. After that, the parcel is returned and we are not responsible for missed collections.",
    keywords: ["window", "pickup"]
  },
  {
    id: "locker-how",
    question: "How does locker delivery work?",
    answer: "At checkout, enter your postcode and we'll assign the nearest InPost locker. Once your order is dispatched, you'll receive an email with the locker address and a unique access code. Head to the locker at any time, enter your code, and collect your parcel.",
    keywords: ["locker", "delivery", "postcode"]
  },
  {
    id: "locker-lost-code",
    question: "What if I lose my access code?",
    answer: "Check the confirmation email we sent when your order was dispatched. If you still can't find it, contact support and we'll reissue a new code for you.",
    keywords: ["locker", "code", "lost"]
  },
  {
    id: "locker-full",
    question: "What if the locker is full?",
    answer: "This is rare, but if it happens we'll automatically assign the next nearest InPost locker and notify you by email with the updated address and code.",
    keywords: ["locker", "full"]
  },
  {
    id: "locker-identity",
    question: "Is my identity required?",
    answer: "No. You don't need to show ID or give your name to collect. Just your access code — that's it. We keep things simple and private.",
    keywords: ["locker", "identity", "anonymous", "ID"]
  },
  {
    id: "locker-collect-time",
    question: "How long do I have to collect?",
    answer: "You have 72 hours from the time we notify you that your order is ready. After that, the parcel is returned and we are not responsible for missed collections.",
    keywords: ["locker", "collect", "time", "72 hours"]
  },
  {
    id: "locker-choose",
    question: "Can I choose a specific locker?",
    answer: "Currently, the system assigns the nearest InPost locker based on your postcode. You can't pick a specific unit, but you can update your postcode in your account settings to influence which locker is selected.",
    keywords: ["locker", "choose", "specific"]
  }
];

const paymentEntries: FaqEntry[] = [
  {
    id: "payment-methods",
    question: "What payment methods are supported?",
    answer: "Bank transfer (GBP) to top up your wallet. Minimum top-up is £20. Once funds are confirmed, checkout is instant from your wallet balance.",
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
