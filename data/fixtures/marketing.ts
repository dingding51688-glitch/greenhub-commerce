import { ProductCardData } from "@/lib/types";

export type HeroLink = {
  label: string;
  href: string;
};

export const heroClassicContent = {
  eyebrow: "GreenHub NI · Premium Lockers",
  title: "Cannabis you can count on, 24/7 lockers in Belfast",
  subtitle:
    "Reserve curated flower, carts, and edibles online — collect from climate-controlled lockers the moment you're ready.",
  primaryCta: { label: "Browse products", href: "/" } satisfies HeroLink,
  secondaryCta: { label: "How lockers work", href: "/#lockers" } satisfies HeroLink,
  highlight: "Now shipping subscription refills across NI",
  stats: [
    { label: "Locker pickup", value: "24/7" },
    { label: "Members served", value: "3.1k" },
    { label: "Avg. rating", value: "4.9/5" }
  ]
};

export type LockerStep = {
  icon: string;
  title: string;
  description: string;
};

export const lockerFlow = {
  title: "How the smart lockers work",
  steps: [
    {
      icon: "①",
      title: "Place your order",
      description: "Lock in your mix online — we reserve inventory instantly."
    },
    {
      icon: "②",
      title: "We prep the locker",
      description: "Staff verify your pickup slot, seal the parcel, and assign a code."
    },
    {
      icon: "③",
      title: "Collect 24/7",
      description: "Use the SMS code to open the locker whenever you're ready, no queues."
    }
  ] satisfies LockerStep[],
  tip: {
    label: "NI members",
    content: "Locker network now covers Titanic Quarter, Cathedral Quarter, and Ormeau."
  }
};

export const featuredProducts: ProductCardData[] = [
  {
    id: "cereal-milk",
    title: "Cereal Milk",
    category: "Hybrid flower",
    description: "Creamy, uplifting hybrid sourced from Bay Area craft growers.",
    price: "£45",
    badge: "Top pick",
    imageUrl: "/images/products/cereal-milk.png"
  },
  {
    id: "ice-pop",
    title: "Ice Pop 1g Cart",
    category: "Live resin",
    description: "Single source live resin cart with bright sherbet notes.",
    price: "£38",
    imageUrl: "/images/products/ice-pop.png"
  },
  {
    id: "sativa-flight",
    title: "Sativa Flight",
    category: "Starter pack",
    description: "Three 3.5g jars of daytime favorites, ready for rotation.",
    price: "£95",
    imageUrl: "/images/products/sativa-flight.png"
  },
  {
    id: "night-bites",
    title: "Night Bites",
    category: "Edibles",
    description: "5 mg micro-dose chews infused with indica live rosin.",
    price: "£22",
    imageUrl: "/images/products/night-bites.png"
  }
];

export type PaymentPlan = {
  title: string;
  description: string;
  price: string;
  frequency: string;
  badge?: string;
  features: string[];
  cta: HeroLink;
};

export const paymentRecommendations = {
  recommendation: {
    title: "Locker Reserve+",
    description: "Weekly locker allocation, refills, and SMS pickup assistance",
    price: "£49",
    frequency: "/ month",
    badge: "Most popular",
    features: [
      "Dedicated 24-hour locker hold",
      "Express customer care",
      "Bonus 10% off refills"
    ],
    cta: { label: "Start Reserve+", href: "/reserve" }
  } satisfies PaymentPlan,
  secondary: [
    {
      title: "Pay as you go",
      description: "No subscription — book slots whenever you need",
      price: "£0",
      frequency: "/ booking",
      features: ["Standard locker access", "Pickup within 12 hrs"] ,
      cta: { label: "View menu", href: "/" }
    },
    {
      title: "Refill Club",
      description: "Monthly curated drop shipped to your locker",
      price: "£85",
      frequency: "/ month",
      features: ["3 premium eighths", "Auto locker assignment"],
      cta: { label: "Join Club", href: "/club" }
    }
  ] satisfies PaymentPlan[]
};

export type FeaturedCollection = {
  title: string;
  blurb: string;
  href: string;
  accent: string;
};

export const featuredCollectionsContent: FeaturedCollection[] = [
  {
    title: "Fresh flower",
    blurb: "Indoor drops trimmed the morning they ship to lockers.",
    href: "/products?strain=Hybrid",
    accent: "from-plum-600/40 to-night-900"
  },
  {
    title: "Discreet vapes",
    blurb: "Live resin carts + pods with full terp expressions.",
    href: "/products?category=vapes",
    accent: "from-jade-500/30 to-night-900"
  },
  {
    title: "Bundles & locker sets",
    blurb: "Curated locker-ready kits with SMS concierge support.",
    href: "/collections",
    accent: "from-amber-500/30 to-night-900"
  }
];

export type HowItWorksFaq = {
  question: string;
  answer: string;
};

export const howItWorksFaq: HowItWorksFaq[] = [
  {
    question: "How do I get locker access?",
    answer: "Create an account, verify your details, and place your first order. We SMS locker credentials right before pickup."
  },
  {
    question: "Can I pay with card?",
    answer: "Preferred method is USDT via NowPayments. Wallet top-ups and debit/credit bridge are available for verified members."
  },
  {
    question: "How long is the locker hold?",
    answer: "Standard hold is 2 hours. Reserve+ subscribers can extend holds or request concierge assistance via chat."
  },
  {
    question: "What if I miss my pickup?",
    answer: "Message concierge before the window expires. We can reassign a locker or restock your order depending on courier schedules."
  }
];

export type ContactChannel = {
  title: string;
  detail: string;
  description?: string;
  href?: string;
  badge?: string;
};

export const contactChannels: ContactChannel[] = [
  {
    title: "Concierge email",
    detail: "concierge@greenhub420.co.uk",
    description: "Best for locker reschedules, payment confirmations, and general support.",
    href: "mailto:concierge@greenhub420.co.uk"
  },
  {
    title: "Telegram live chat",
    detail: "@greenhub_concierge",
    description: "Fastest responses between 10:00–00:00. Provide order reference for priority.",
    href: "https://t.me/greenhub_concierge",
    badge: "< 5 min"
  },
  {
    title: "SMS hotline",
    detail: "+44 7441 902134",
    description: "Locker pickup or code issues only. Text HELP + your locker code.",
    href: "sms:+447441902134"
  },
  {
    title: "Business hours",
    detail: "10:00 – 00:00 GMT",
    description: "Concierge monitors high-priority incidents overnight for Reserve+ members."
  }
];

export const inPostFlow = {
  title: "InPost & locker reminders",
  steps: [
    { icon: "①", title: "Pick the locker", description: "Choose the location that suits your route; concierge can relocate with 2h notice." },
    { icon: "②", title: "Verify payment", description: "Wallet or USDT confirmation triggers the InPost QR + PIN message." },
    { icon: "③", title: "Collect & confirm", description: "Scan the QR, grab your parcel, and reply DONE so we can reset the locker." }
  ],
  tip: { label: "InPost", content: "Most Belfast lockers sit inside 24/7 petrol stations for easier pickup." }
};

export const faqEntries: HowItWorksFaq[] = [
  {
    question: "How do I verify my account?",
    answer: "Upload photo ID once inside /account. Concierge approves within 1-2 hours so you can reserve lockers the same day."
  },
  {
    question: "Can I change lockers after ordering?",
    answer: "Yes—reply to the locker SMS or ping Telegram @greenhub_concierge. We need 2 hours notice to reassign inventory."
  },
  {
    question: "What payment methods are supported?",
    answer: "USDT (TRC20) via NowPayments is instant. Wallet top-ups and Visa/Mastercard bridge work once your billing profile is verified."
  },
  {
    question: "Do you ship outside Belfast/Derry?",
    answer: "Lockers currently cover Belfast + Derry. Refill Club ships statewide; join the waitlist inside /contact."
  },
  {
    question: "What happens if I miss the pickup window?",
    answer: "Let concierge know before the 2h timer expires. We can restock or schedule another locker once the courier returns."
  }
];
