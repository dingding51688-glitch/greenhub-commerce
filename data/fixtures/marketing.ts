import { ProductCardData } from "@/lib/types";

export type HeroLink = {
  label: string;
  href: string;
};

export const heroClassicContent = {
  eyebrow: "GreenHub NI · Premium Products",
  title: "Cannabis you can count on, delivered across Belfast",
  subtitle:
    "Browse curated flower, carts, and edibles online — collect from convenient pickup points the moment you're ready.",
  primaryCta: { label: "Browse products", href: "/products" } satisfies HeroLink,
  secondaryCta: { label: "How it works", href: "/#how-it-works" } satisfies HeroLink,
  highlight: "Now shipping subscription refills across NI",
  stats: [
    { label: "Dispatch window", value: "24/7" },
    { label: "Members served", value: "3.1k" },
    { label: "Avg. rating", value: "4.9/5" }
  ]
};

export const homeHeroContent = {
  highlight: "HOME",
  eyebrow: "SAME-DAY DISPATCH",
  title: "Order online & collect discreetly",
  subtitle: "Enter your postcode and we'll route the parcel to the closest pickup point or courier.",
  bullets: [
    "Real-time stock synced directly from our catalog",
    "Scent-proof, tamper-evident packaging on every order",
    "Private pickup instructions sent once dispatch begins"
  ],
  primaryCta: { label: "SHOP NOW", href: "/products" } satisfies HeroLink,
  secondaryCta: { label: "HOW IT WORKS", href: "/how-it-works" } satisfies HeroLink,
  stats: [
    { label: "Dispatch window", value: "24/7" },
    { label: "Members served", value: "3.1k" },
    { label: "Avg. rating", value: "4.9/5" }
  ],
  alignment: "left" as const
};

export type OrderStep = {
  icon: string;
  title: string;
  description: string;
};

export const orderFlow = {
  title: "How ordering works",
  steps: [
    {
      icon: "①",
      title: "Place your order online",
      description: "Browse the catalogue, pick your products, enter your postcode, and confirm the order."
    },
    {
      icon: "②",
      title: "We prep + send your code",
      description: "The team weighs, seals, and arranges dispatch before sending you a collection code by SMS."
    },
    {
      icon: "③",
      title: "Collect your parcel",
      description: "Head to the pickup point whenever you're ready — scan the code, grab your parcel, and you're done."
    }
  ] satisfies OrderStep[],
  tip: {
    label: "Coverage",
    content: "Belfast + Derry are covered 24/7. Contact support at least 2 hours ahead if you need to change pickup location."
  }
};

/** @deprecated Use orderFlow instead */
export type LockerStep = OrderStep;
/** @deprecated Use orderFlow instead */
export const lockerFlow = orderFlow;

export const featuredProducts: ProductCardData[] = [
  {
    id: "midnight-gelato",
    title: "Midnight Gelato",
    category: "Flowers",
    description: "Dessert-forward lift with creamy exhale and relaxed focus for late evenings.",
    price: "From £32",
    badge: "Limited",
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_9a7ddbae00.png"
  },
  {
    id: "berry-kush",
    title: "Berry Kush",
    category: "Pre-rolls",
    description: "Slow-cured flower packed into infused joints with glass tips.",
    price: "From £35",
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_1763924030.png"
  },
  {
    id: "midnight-gelato-7g",
    title: "Midnight Gelato 7g",
    category: "Small batch",
    description: "Reserved jars cut from the same micro-batch now on the menu.",
    price: "£60",
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_9a7ddbae00.png"
  },
  {
    id: "berry-kush-3-5g",
    title: "Berry Kush Flight",
    category: "Starter pack",
    description: "Four half-gram minis designed for daytime rotation.",
    price: "£35",
    imageUrl: "https://cms.greenhub420.co.uk/uploads/R_1763924030.png"
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
    title: "Reserve+ subscription",
    description: "Weekly product allocation, balance top-ups, and SMS pickup assistance",
    price: "£49",
    frequency: "/ month",
    badge: "Most popular",
    features: [
      "Dedicated same-day dispatch slot",
      "Express customer care",
      "Bonus 10% off refills"
    ],
    cta: { label: "Start Reserve+", href: "/reserve" }
  } satisfies PaymentPlan,
  secondary: [
    {
      title: "Pay as you go",
      description: "No subscription — order whenever you need",
      price: "£0",
      frequency: "/ order",
      features: ["Standard store access", "Pickup within 12 hrs"],
      cta: { label: "View menu", href: "/" }
    },
    {
      title: "Refill Club",
      description: "Monthly curated release shipped to your door",
      price: "£85",
      frequency: "/ month",
      features: ["3 premium eighths", "Auto dispatch assignment"],
      cta: { label: "Join Club", href: "/club" }
    }
  ] satisfies PaymentPlan[]
};

export type FeaturedCollection = {
  title: string;
  href: string;
  imageUrl: string;
  label?: string;
  subtitle?: string;
  imageAlt?: string;
  tone?: "green" | "orange" | "cream";
};

export const featuredCollectionsContent: FeaturedCollection[] = [
  {
    title: "Flowers",
    label: "NOW SHIPPING",
    subtitle: "Fresh eighths ready to ship across NI",
    href: "/products?category=flowers",
    imageUrl: "https://cdn.greenhub420.co.uk/ui-parity/flowers-card.png",
    imageAlt: "Curated flower jars",
    tone: "green"
  },
  {
    title: "Pre-rolls",
    label: "INFUSED MINIS",
    subtitle: "Resin-dipped five packs",
    href: "/products?category=pre-rolls",
    imageUrl: "https://cdn.greenhub420.co.uk/ui-parity/pre-rolls-card.png",
    imageAlt: "Infused pre-roll tins",
    tone: "orange"
  },
  {
    title: "Vapes",
    label: "READY TO SHIP",
    subtitle: "Live resin carts en route",
    href: "/products?category=vapes",
    imageUrl: "https://cdn.greenhub420.co.uk/ui-parity/vapes-card.png",
    imageAlt: "Gold vaporizer carts",
    tone: "cream"
  }
];

export type HowItWorksFaq = {
  question: string;
  answer: string;
};

export const howItWorksFaq: HowItWorksFaq[] = [
  {
    question: "How do I start ordering?",
    answer: "Create an account, verify your details, and place your first order. We send collection credentials by SMS shortly before pickup."
  },
  {
    question: "Can I pay with card?",
    answer: "Preferred method is USDT via NowPayments. Account top-ups and debit/credit bridge are available for verified members."
  },
  {
    question: "How long is the collection window?",
    answer: "Standard window is 2 hours. Reserve+ subscribers can extend it or request support assistance via chat."
  },
  {
    question: "What if I miss my pickup?",
    answer: "Contact support before the window expires. We can arrange redelivery or reschedule depending on courier availability."
  }
];

export type ContactHeroDetail = {
  label: string;
  value: string;
  href?: string;
};

export type ContactChannel = {
  title: string;
  detail: string;
  description?: string;
  href?: string;
  badge?: string;
};

export const contactHeroDetails = [
  { label: "Email", value: "support@greenhub.app", href: "mailto:support@greenhub.app" },
  { label: "Secure chat", value: "In-app encrypted messenger" },
  { label: "Operating hours", value: "09:00–21:00 GMT · Mon–Sun" }
];

export const contactChannels: ContactChannel[] = [
  {
    title: "Telegram support",
    detail: "@greenhub_support",
    description: "Fastest replies between 09:00–21:00 GMT. Share your order reference for priority handling.",
    href: "https://t.me/greenhub_support",
    badge: "< 5 min"
  },
  {
    title: "Email support",
    detail: "support@greenhub.app",
    description: "Best for delivery changes, payment confirmations, and general support threads.",
    href: "mailto:support@greenhub.app"
  },
  {
    title: "Wholesale & media",
    detail: "partners@greenhub.app",
    description: "For corporate orders, influencer partnerships, or press enquiries.",
    href: "mailto:partners@greenhub.app"
  },
  {
    title: "SMS hotline",
    detail: "+44 7441 902134",
    description: "Pickup or code issues only. Text HELP + your order reference for the on-call agent.",
    href: "sms:+447441902134"
  }
];

export const inPostFlow = {
  title: "Collection point reminders",
  steps: [
    { icon: "①", title: "Choose your location", description: "Pick the collection point that suits your route; support can relocate with 2h notice." },
    { icon: "②", title: "Verify payment", description: "Account balance or USDT confirmation triggers the collection code." },
    { icon: "③", title: "Collect & confirm", description: "Scan the code, grab your parcel, and confirm receipt so we can process the next order." }
  ],
  tip: { label: "InPost", content: "Most Belfast collection points sit inside 24/7 petrol stations for easier pickup." }
};


export type TermsSection = {
  id: string;
  title: string;
  summary: string;
  body: string[];
  bullets?: string[];
};

// TODO: replace placeholder copy once Legal supplies the final Terms version.
export const termsSections: TermsSection[] = [
  {
    id: "eligibility",
    title: "Eligibility & membership",
    summary: "Placeholder copy outlining who can create or keep a membership.",
    body: [
      "Members must be 21+ and reside within areas covered by the delivery network. A government-issued ID and proof of address are reviewed before any order is dispatched.",
      "Accounts flagged for duplicate IDs or suspicious activity may be paused while support re-validates the identity on file."
    ],
    bullets: [
      "One account per member; sharing collection codes voids access until reverified.",
      "Support may request a selfie with ID for manual reviews.",
      "Members agree to update their address within 24 hours of moving."
    ]
  },
  {
    id: "payments",
    title: "Payments & billing",
    summary: "Placeholder text describing accepted payment methods and settlement timing.",
    body: [
      "Card payments process via the NowPayments bridge; crypto submissions settle once one confirmation is observed. Account credits remain valid for 12 months.",
      "Chargebacks or disputed transfers may result in immediate suspension pending finance review."
    ],
    bullets: [
      "Visa / Mastercard via bridge checkout (limits apply).",
      "USDT (TRC20) with on-chain confirmations.",
      "Manual bank transfers for wholesale partners upon request."
    ]
  },
  {
    id: "compliance",
    title: "Compliance & conduct",
    summary: "Placeholder obligations covering lawful use of collection points and parcel handling.",
    body: [
      "Members agree not to tamper with collection points, resell access codes, or interfere with couriers. Any misuse may be reported to local authorities.",
      "All products remain sealed; opening parcels at the collection point breaches terms and voids support."
    ],
    bullets: [
      "Collect parcels within the stated 2-hour window unless support extends it.",
      "Do not leave waste, packaging, or personal items at collection points.",
      "Report damaged parcels within 4 hours via support@greenhub.app."
    ]
  },
  {
    id: "privacy",
    title: "Privacy & data handling",
    summary: "Placeholder statements covering how personal data, IDs, and chat logs are stored.",
    body: [
      "ID uploads and order history are encrypted at rest. Access is restricted to vetted support leads for verification purposes only.",
      "Support transcripts are retained for 30 days before anonymisation unless a regulatory request requires longer retention."
    ],
    bullets: [
      "Members may request data export or deletion via privacy@greenhub.app.",
      "Operational alerts (collection codes, delivery ETA) are transactional and cannot be unsubscribed from.",
      "Marketing preferences can be updated inside /account at any time."
    ]
  }
];

export type FaqGroup = {
  title: string;
  description: string;
  entries: HowItWorksFaq[];
};

export const faqGroups: FaqGroup[] = [
  {
    title: "Delivery & verification",
    description: "Checklist before you collect or change a pickup.",
    entries: [
      {
        question: "How do I verify my account?",
        answer:
          "Upload photo ID once inside /account. Support approves within 1–2 hours so you can place orders the same day."
      },
      {
        question: "Can I change my delivery address after ordering?",
        answer:
          "Yes — reply to the collection SMS or message Telegram @greenhub_support. We need 2 hours' notice to reassign."
      },
      {
        question: "What happens if I miss the pickup window?",
        answer:
          "Let support know before the 2h timer expires. We can rearrange redelivery once the courier returns."
      }
    ]
  },
  {
    title: "Payments & refunds",
    description: "Supported methods, billing limits, and account credits.",
    entries: [
      {
        question: "What payment methods are supported?",
        answer:
          "USDT (TRC20) via NowPayments is instant. Account top-ups and Visa/Mastercard bridge work once your billing profile is verified."
      },
      {
        question: "How do account credits or refunds work?",
        answer:
          "Approved refunds return to your account within 6 hours. Bank cards can take 3–5 working days depending on your issuer."
      }
    ]
  },
  {
    title: "Coverage & support",
    description: "Where we currently deliver and how fast support responds.",
    entries: [
      {
        question: "Do you ship outside Belfast/Derry?",
        answer:
          "Delivery currently covers Belfast + Derry. Refill Club ships statewide; join the waitlist inside /contact."
      },
      {
        question: "How fast does support reply?",
        answer:
          "Telegram replies usually arrive in under 5 minutes from 09:00–21:00 GMT. Email support@greenhub.app for long-form requests."
      }
    ]
  }
];

export type ShippingMilestone = {
  icon: string;
  title: string;
  description: string;
  window: string;
};

export const shippingTimeline: ShippingMilestone[] = [
  {
    icon: "①",
    title: "Order cutoff",
    description: "Place orders before 8pm to guarantee same-evening dispatch.",
    window: "Cutoff 20:00"
  },
  {
    icon: "②",
    title: "Courier prep",
    description: "Team weighs, seals, and arranges dispatch. Expect status updates in the app.",
    window: "Prep 20:00–22:00"
  },
  {
    icon: "③",
    title: "Collection SMS",
    description: "We send SMS + email with collection code once the parcel is ready for pickup.",
    window: "Pickup 22:00–00:00"
  }
];

export const collectionTips = {
  title: "Collection etiquette & late fees",
  steps: [
    { icon: "①", title: "Arrive within 2h", description: "Collection windows close after 120 minutes to keep the queue fair." },
    { icon: "②", title: "Bring ID", description: "Support may request photo proof if an anomaly is flagged." },
    { icon: "③", title: "Report issues", description: "Contact support immediately if the collection point is inaccessible or empty." }
  ],
  tip: { label: "Late policy", content: "No-shows are restocked after 2h and incur a £15 restocking fee unless you contact us." }
};

/** @deprecated Use collectionTips instead */
export const lockerUsageTips = collectionTips;

export type ReturnPolicyItem = {
  icon: string;
  title: string;
  description: string;
};

export const returnPolicies: ReturnPolicyItem[] = [
  {
    icon: "🕒",
    title: "2-hour collection window",
    description: "Refunds only apply before the window closes. Contact us before the timer runs out."
  },
  {
    icon: "📦",
    title: "Seal + photo required",
    description: "Send a photo of the unopened parcel so we can investigate courier errors."
  },
  {
    icon: "💳",
    title: "Account credits",
    description: "Approved refunds return to your account within 6 hours; bank transfers may take 3–5 days."
  },
  {
    icon: "🚫",
    title: "Non-refundable",
    description: "Opened products or missed pickups without notice fall outside refund scope."
  }
];

export const supportSteps = [
  { title: "Contact support", detail: "Use Telegram or email within 2 hours, include your order reference." },
  { title: "Provide evidence", detail: "Photo/video of the parcel and any damage helps us escalate." },
  { title: "Wait for update", detail: "We confirm within 4 hours and credit your account or schedule a replacement." }
];

export type AboutHighlight = {
  icon: string;
  title: string;
  description: string;
};

export const aboutHighlights: AboutHighlight[] = [
  { icon: "🔒", title: "Discreet delivery", description: "50+ Belfast & Derry pickup points with 24/7 availability." },
  { icon: "⚡", title: "Same-evening dispatch", description: "Order by 8pm, collect before midnight with live SMS tracking." },
  { icon: "🤝", title: "Dedicated support", description: "NI-based team on Telegram + email every day 10:00–00:00." },
  { icon: "🌿", title: "Curated products", description: "We partner with EU craft growers and test every batch." }
];

export const coverageStats = [
  { label: "Delivery cities", value: "2", description: "Belfast & Derry" },
  { label: "Postcodes served", value: "47", description: "Titanic Quarter → Lisburn" },
  { label: "Partners", value: "3", description: "InPost, Rapid courier, NowPayments" }
];

export const supportCommitments = [
  { title: "Telegram support", detail: "@greenhub_support · replies < 5 min" },
  { title: "Email", detail: "support@greenhub420.co.uk · 4h resolution" },
  { title: "Ticket SLA", detail: "Refunds processed in 4h, replacements scheduled same evening" }
];
