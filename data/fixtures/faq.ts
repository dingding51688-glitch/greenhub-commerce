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
    id: "how-delivery-works",
    question: "How does delivery work?",
    answer: "At checkout, enter your postcode and select a pickup location (InPost locker, OOHPod locker, or Yodel collection point). Once dispatched, you'll receive a tracking number and collection code. Head to the location, enter your code, and collect your parcel — no ID needed.",
    keywords: ["delivery", "locker", "how"]
  },
  {
    id: "delivery-areas",
    question: "Where do you deliver?",
    answer: "We deliver UK-wide. Mainland GB orders go via InPost lockers (16,000+ locations). Northern Ireland orders use OOHPod lockers or Yodel collection points.",
    keywords: ["area", "UK", "northern ireland", "NI"]
  },
  {
    id: "delivery-time",
    question: "How long does delivery take?",
    answer: "Orders placed before 8pm are dispatched same evening. Delivery typically takes 3–5 working days depending on your location. You'll receive a tracking number once dispatched.",
    keywords: ["time", "how long", "dispatch"]
  },
  {
    id: "delivery-fee",
    question: "How much is delivery?",
    answer: "Flat rate £5 per order, regardless of order size or location.",
    keywords: ["fee", "cost", "price", "shipping"]
  },
  {
    id: "collection-window",
    question: "How long do I have to collect?",
    answer: "You have 72 hours from the time we notify you that your parcel is ready. After that, the parcel is returned and we are not responsible for missed collections.",
    keywords: ["window", "pickup", "collect", "72 hours"]
  },
  {
    id: "locker-identity",
    question: "Do I need to show ID?",
    answer: "No. Just your access code — that's it. No name, no ID, completely anonymous.",
    keywords: ["identity", "anonymous", "ID", "name"]
  },
  {
    id: "packaging",
    question: "How is my order packaged?",
    answer: "All orders are vacuum-sealed and discreetly packaged. No labels or branding on the outside.",
    keywords: ["packaging", "discreet", "vacuum"]
  },
  {
    id: "locker-lost-code",
    question: "I lost my access code",
    answer: "Check the email we sent when your order was dispatched. If you can't find it, go to your order details page — the code is displayed there. Still stuck? Contact support.",
    keywords: ["code", "lost", "access"]
  }
];

const paymentEntries: FaqEntry[] = [
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer: "We accept USDT (TRC20 & ERC20) for instant top-ups, and bank transfer (GBP). All payments go to your wallet first, then you pay from your wallet at checkout.",
    keywords: ["payment", "USDT", "bank", "method"]
  },
  {
    id: "how-topup",
    question: "How do I top up my wallet?",
    answer: "Go to Wallet → Top Up. For crypto: select USDT amount and network (TRC20 recommended), generate an invoice, and pay. For bank transfer: open the Telegram top-up bot which will guide you step by step. Minimum top-up is £20.",
    keywords: ["topup", "wallet", "add funds"]
  },
  {
    id: "topup-time",
    question: "How long until my top-up appears?",
    answer: "USDT top-ups are confirmed automatically once the blockchain confirms the transaction — usually within a few minutes. Bank transfers are processed manually and may take up to a few hours during business hours.",
    keywords: ["topup", "time", "pending"]
  },
  {
    id: "transfer-id",
    question: "What is my Transfer ID?",
    answer: "Your Transfer ID (e.g. GH-00000123) is your unique account reference. Always include it in bank transfer references so we can match the payment to your account.",
    keywords: ["transfer id", "reference", "GH"]
  }
];

const orderEntries: FaqEntry[] = [
  {
    id: "order-status",
    question: "How do I track my order?",
    answer: "Go to the Orders page in your account. Each order shows its current status, tracking number, and carrier link. Click through for detailed tracking events.",
    keywords: ["track", "status", "order"]
  },
  {
    id: "order-cancel",
    question: "Can I cancel my order?",
    answer: "Orders can only be cancelled before they are dispatched. Contact support as soon as possible. Once dispatched, cancellation is not possible.",
    keywords: ["cancel", "order"]
  },
  {
    id: "change-delivery",
    question: "Can I change my delivery location after ordering?",
    answer: "Contact support with your order reference and the new postcode. We need at least 2 hours' notice before dispatch to make changes.",
    keywords: ["change", "delivery", "address"]
  }
];

const balanceEntries: FaqEntry[] = [
  {
    id: "balance-withdraw",
    question: "How do I withdraw my balance?",
    answer: "Go to Wallet → Withdraw. You can withdraw to a UK bank account or USDT address. Minimum withdrawal is £100. A 3% processing fee applies. Withdrawals are processed within 24 hours.",
    keywords: ["withdraw", "balance", "payout"]
  },
  {
    id: "balance-transfer",
    question: "Can I transfer balance to another user?",
    answer: "Yes. Go to Wallet → Transfer and enter the recipient's Transfer ID (GH-XXXXXXXX). The transfer is instant.",
    keywords: ["transfer", "send", "balance"]
  },
  {
    id: "balance-refund",
    question: "How do refunds work?",
    answer: "Refunds are credited to your wallet balance within 6 hours of approval. If you need a bank refund, contact support.",
    keywords: ["refund", "credit"]
  }
];

const referralEntries: FaqEntry[] = [
  {
    id: "referral-how",
    question: "How does the referral program work?",
    answer: "Share your unique referral link with friends. When they sign up and order, you earn commission on every order they place — for life. Check your Earn Hub for your link, stats, and earnings.",
    keywords: ["referral", "invite", "earn"]
  },
  {
    id: "referral-rewards",
    question: "How much do I earn?",
    answer: "You earn 10% commission on every order your referred friends place. Commission is credited to your wallet instantly after each order.",
    keywords: ["commission", "rewards", "percent"]
  },
  {
    id: "referral-link",
    question: "Where is my referral link?",
    answer: "Go to Earn Hub (from the menu or Account → Earn Hub). Your unique link and referral code are displayed there. You can also share directly via WhatsApp, Telegram, or copy the link.",
    keywords: ["link", "code", "share"]
  }
];

const accountEntries: FaqEntry[] = [
  {
    id: "account-create",
    question: "How do I create an account?",
    answer: "Tap Register, enter your name, email, phone, postcode, and create a password. Verify your email to get a £5 welcome bonus.",
    keywords: ["register", "sign up", "account"]
  },
  {
    id: "account-verify",
    question: "Why should I verify my email?",
    answer: "Verified accounts receive a £5 wallet bonus. It also ensures you receive order updates and tracking notifications.",
    keywords: ["verify", "email", "bonus"]
  },
  {
    id: "forgot-password",
    question: "I forgot my password",
    answer: "Go to the login page and tap 'Forgot password'. Enter your email and we'll send you a reset link.",
    keywords: ["password", "forgot", "reset"]
  }
];

export const faqCategories: FaqCategory[] = [
  { id: "all", title: "All", description: "Browse every question.", entries: [] },
  { id: "delivery", title: "Delivery", description: "Shipping, collection, packaging.", entries: deliveryEntries },
  { id: "payment", title: "Payments", description: "Top-ups and payment methods.", entries: paymentEntries },
  { id: "orders", title: "Orders", description: "Tracking and changes.", entries: orderEntries },
  { id: "balance", title: "Wallet", description: "Withdrawals, transfers, refunds.", entries: balanceEntries },
  { id: "referral", title: "Referrals", description: "Earn from invites.", entries: referralEntries },
  { id: "account", title: "Account", description: "Registration, login, settings.", entries: accountEntries }
];

export type FaqEntryWithCategory = FaqEntry & { category: string };

export const flatFaqEntries: FaqEntryWithCategory[] = faqCategories
  .filter((category) => category.id !== "all")
  .flatMap((category) => category.entries.map((entry) => ({ ...entry, category: category.id })));
