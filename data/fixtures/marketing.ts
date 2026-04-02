import type { ProductCardData } from "@/lib/types";

export type HeroLink = {
  label: string;
  href: string;
};

export type HeroStat = {
  label: string;
  value: string;
};

export const heroClassicContent = {
  eyebrow: "GreenHub NI · Premium Lockers",
  title: "Cannabis you can count on, 24/7 lockers in Belfast",
  subtitle:
    "Reserve curated flower, carts, and edibles online — collect from climate-controlled lockers the moment you're ready.",
  highlight: "Now shipping subscription refills across NI",
  primaryCta: { label: "Browse products", href: "/" } satisfies HeroLink,
  secondaryCta: { label: "How lockers work", href: "/#lockers" } satisfies HeroLink,
  stats: [
    { label: "Locker pickup", value: "24/7" },
    { label: "Members served", value: "3.1k" },
    { label: "Avg. rating", value: "4.9/5" }
  ] satisfies HeroStat[]
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
      features: ["Standard locker access", "Pickup within 12 hrs"],
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
  ] satisfies PaymentPlan[],
  footnote: "Locker programs are currently limited to Belfast city centre."
};
