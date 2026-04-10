export type NavMatch = "exact" | "prefix";

export type NavItem = {
  label: string;
  href: string;
  match?: NavMatch;
  children?: NavItem[];
};

export type NavigationCTA = {
  label: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/", match: "exact" },
  { label: "Shop all", href: "/products", match: "prefix" },
  { label: "Flowers", href: "/products?category=flowers" },
  { label: "Pre-rolls", href: "/products?category=pre-rolls" },
  { label: "Vapes", href: "/products?category=vapes" },
  { label: "Edibles", href: "/products?category=edibles" },
  { label: "Concentrates", href: "/products?category=concentrates" },
  { label: "Ordering guide", href: "/how-it-works", match: "exact" },
  { label: "Support", href: "/support", match: "exact" }
];

export type MenuCTAGroup = {
  primary: NavigationCTA;
  secondary: NavigationCTA;
};

export const menuCtas: MenuCTAGroup = {
  primary: { label: "Earn Hub", href: "/account/commission" },
  secondary: { label: "Recharge balance", href: "/wallet/topup" }
};

export type DrawerSection = {
  title: string;
  links: NavItem[];
};

export const marketingLinks: NavItem[] = [
  { label: "Products", href: "/products" },
  { label: "Ordering guide", href: "/how-it-works" },
  { label: "Support", href: "/support" }
];

export const drawerSections: DrawerSection[] = [
  {
    title: "Account",
    links: [
      { label: "Overview", href: "/account", match: "prefix" },
      { label: "Wallet", href: "/wallet", match: "prefix" },
      { label: "Orders", href: "/orders", match: "prefix" }
    ]
  }
  // Legacy logistics quick links were removed to match the 420.co.uk drawer (menu + account only).
];

export type FooterColumn = {
  title: string;
  links: NavItem[];
};

export const footerColumns: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/products" },
      { label: "Flowers", href: "/products?category=flowers" },
      { label: "Vapes", href: "/products?category=vapes" },
      { label: "Edibles", href: "/products?category=edibles" },
      { label: "Concentrates", href: "/products?category=concentrates" }
    ]
  },
  {
    title: "Help",
    links: [
      { label: "Ordering guide", href: "/how-it-works" },
      { label: "Support", href: "/support" },
      { label: "FAQ", href: "/faq" }
    ]
  },
  {
    title: "Account",
    links: [
      { label: "Overview", href: "/account" },
      { label: "Wallet", href: "/wallet" },
      { label: "Earn Hub", href: "/referral" }
    ]
  }
];

export const socialLinks: NavItem[] = [
  { label: "Instagram", href: "https://instagram.com/greenhub" },
  { label: "Telegram", href: "https://t.me/greenhub" },
  { label: "Email", href: "mailto:hi@greenhub.co.uk" }
];

export const footerContact = {
  address: "Belfast City Centre · NI",
  email: "hi@greenhub.co.uk",
  phone: "+44 28 1234 5678",
  disclaimer: "Cannabis products sold in compliance with NI regulations. 21+ only."
};
