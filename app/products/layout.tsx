import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Weed Online UK — Shop Premium Cannabis | Green Hub 420",
  description: "Browse premium cannabis strains available for UK delivery. Order online and collect from 16,000+ InPost lockers. Discreet vacuum-sealed packaging, 3-5 day delivery including Northern Ireland.",
  keywords: ["buy weed online uk", "cannabis shop uk", "weed strains uk", "buy cannabis online", "weed delivery inpost", "420 shop uk"],
  openGraph: {
    title: "Buy Weed Online UK — Shop Premium Cannabis",
    description: "Browse premium cannabis strains. Order online, collect from InPost lockers across the UK.",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
