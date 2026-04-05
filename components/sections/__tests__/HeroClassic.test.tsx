import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroClassic } from "../HeroClassic";

describe("HeroClassic", () => {
  it("renders title, subtitle and CTAs", () => {
    render(
      <HeroClassic
        title="Store hero"
        subtitle="Trusted products across Belfast"
        primaryCta={{ label: "Shop now", href: "/" }}
        secondaryCta={{ label: "Learn more", href: "/how-it-works" }}
      />
    );

    expect(screen.getByText(/store hero/i)).toBeInTheDocument();
    expect(screen.getByText(/trusted products/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop now/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /learn more/i })).toBeInTheDocument();
  });
});
