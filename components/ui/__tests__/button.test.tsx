import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Button from "../button";

describe("Button", () => {
  it("renders primary variant with focus ring class", () => {
    const { getByRole } = render(<Button>Shop now</Button>);
    const btn = getByRole("button", { name: /shop now/i });
    expect(btn).toHaveClass("bg-plum-600");
    expect(btn).toHaveClass("focus-visible:ring-plum-500");
  });

  it("applies disabled styles", () => {
    const { getByRole } = render(
      <Button disabled variant="secondary">
        Disabled
      </Button>
    );
    const btn = getByRole("button", { name: /disabled/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass("opacity-60");
    expect(btn).toHaveClass("cursor-not-allowed");
    expect(btn.className).not.toContain("focus-visible:ring-2");
  });
});
