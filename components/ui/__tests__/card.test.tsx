import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "../card";

describe("Card", () => {
  it("applies padding scale", () => {
    const { getByText } = render(
      <Card padding="lg">
        <span>content</span>
      </Card>
    );
    const card = getByText("content").closest("section");
    expect(card).toHaveClass("p-lg");
  });
});
