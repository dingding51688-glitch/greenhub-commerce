import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Input from "../input";

describe("Input", () => {
  it("flags invalid state", () => {
    const { getByRole } = render(<Input isInvalid aria-label="Amount" />);
    const input = getByRole("textbox", { name: /amount/i });
    expect(input).toHaveClass("border-amber-500");
  });

  it("applies disabled styling", () => {
    const { getByRole } = render(<Input disabled aria-label="Locker" />);
    const input = getByRole("textbox", { name: /locker/i });
    expect(input).toBeDisabled();
    expect(input).toHaveClass("opacity-60");
    expect(input).toHaveClass("cursor-not-allowed");
    expect(input.className).not.toContain("focus-visible:ring-2");
  });
});
