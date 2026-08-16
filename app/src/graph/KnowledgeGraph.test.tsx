import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { KnowledgeGraphPage } from "./KnowledgeGraph";

describe("KnowledgeGraphPage", () => {
  test("renders the imported entities and relationships as an accessible graph", () => {
    render(<KnowledgeGraphPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Favorites graph" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("39 entities · 35 of 35 relationships shown"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select a type to show or hide its connections. Node positions stay fixed.",
      ),
    ).toHaveStyle({ fontStyle: "italic" });
    expect(screen.getByText("Noam Shazeer", { selector: "text" })).toBeInTheDocument();
    expect(screen.getByText("Character.AI", { selector: "text" })).toBeInTheDocument();
    expect(
      screen.getByLabelText("Noam Shazeer — Founder of → Character.AI"),
    ).toBeInTheDocument();
    for (const [type, count] of [
      ["Founder of", 10],
      ["Author of", 11],
      ["Host of", 2],
      ["Current employee of", 4],
      ["Previous employee of", 8],
    ] as const) {
      expect(
        screen.getByLabelText(`${type}: ${count} relationships`),
      ).toHaveTextContent(String(count));
    }
    expect(screen.getByRole("link", { name: "Back to favorites" })).toHaveAttribute(
      "href",
      "./",
    );
  });

  test("selects and deselects relationship types", async () => {
    const user = userEvent.setup();
    render(<KnowledgeGraphPage />);

    const founderFilter = screen.getByRole("button", { name: "Founder of" });
    expect(founderFilter).toHaveAttribute("aria-pressed", "true");

    await user.click(founderFilter);

    expect(founderFilter).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByLabelText("Noam Shazeer — Founder of → Character.AI"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Noam Shazeer — Author of → Attention Is All You Need",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("39 entities · 25 of 35 relationships shown"),
    ).toBeInTheDocument();

    await user.click(founderFilter);
    expect(founderFilter).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByLabelText("Noam Shazeer — Founder of → Character.AI"),
    ).toBeInTheDocument();
  });
});
