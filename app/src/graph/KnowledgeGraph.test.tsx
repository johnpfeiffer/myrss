import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { KnowledgeGraphPage } from "./KnowledgeGraph";

describe("KnowledgeGraphPage", () => {
  test("renders the imported entities and relationships as an accessible graph", () => {
    render(<KnowledgeGraphPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Favorites graph" }),
    ).toBeInTheDocument();
    expect(screen.getByText("39 entities · 35 relationships")).toBeInTheDocument();
    expect(screen.getByText("Noam Shazeer", { selector: "text" })).toBeInTheDocument();
    expect(screen.getByText("Character.AI", { selector: "text" })).toBeInTheDocument();
    expect(
      screen.getByLabelText("Noam Shazeer — Founder of → Character.AI"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to favorites" })).toHaveAttribute(
      "href",
      "./",
    );
  });
});
