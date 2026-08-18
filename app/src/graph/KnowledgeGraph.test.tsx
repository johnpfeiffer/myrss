import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import {
  countRelationshipsByType,
  relationshipLabel,
} from "../../models/knowledgeGraph";
import { favoritesGraph } from "./graphData";
import { KnowledgeGraphPage } from "./KnowledgeGraph";

const relationshipCounts = countRelationshipsByType(favoritesGraph.edges);
const defaultHiddenCount = relationshipCounts.get("Is_a_Person") ?? 0;

function summary(visibleCount = favoritesGraph.edges.length - defaultHiddenCount) {
  return `${favoritesGraph.entities.length} entities · ${visibleCount} of ${favoritesGraph.edges.length} relationships shown`;
}

describe("KnowledgeGraphPage", () => {
  test("renders the imported entities and relationships as an accessible graph", () => {
    render(<KnowledgeGraphPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Favorites graph" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(summary()),
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
    expect(relationshipCounts.get("Is_a_Person")).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Is a person" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    for (const [type, count] of relationshipCounts) {
      const label = relationshipLabel(type);
      expect(
        screen.getByLabelText(`${label}: ${count} relationships`),
      ).toHaveTextContent(String(count));
    }
    expect(screen.getByRole("link", { name: "Back to favorites" })).toHaveAttribute(
      "href",
      "./",
    );
  });

  test("keeps person classification relationships off until selected", async () => {
    const user = userEvent.setup();
    render(<KnowledgeGraphPage />);

    const personFilter = screen.getByRole("button", { name: "Is a person" });
    expect(screen.queryByLabelText(/— Is a person → Person$/)).not.toBeInTheDocument();

    await user.click(personFilter);

    expect(personFilter).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByLabelText(/— Is a person → Person$/)).toHaveLength(
      defaultHiddenCount,
    );
    expect(screen.getByText(summary(favoritesGraph.edges.length))).toBeInTheDocument();
  });

  test("switches between clustered and force-directed layouts", async () => {
    const user = userEvent.setup();
    render(<KnowledgeGraphPage />);

    const clusteredButton = screen.getByRole("button", { name: "Clustered" });
    const forceButton = screen.getByRole("button", { name: "Force-directed" });
    expect(clusteredButton).toHaveAttribute("aria-pressed", "true");
    expect(forceButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("knowledge-graph-svg")).toHaveAttribute(
      "data-layout",
      "clustered",
    );

    await user.click(forceButton);

    expect(clusteredButton).toHaveAttribute("aria-pressed", "false");
    expect(forceButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("knowledge-graph-svg")).toHaveAttribute(
      "data-layout",
      "force-directed",
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
      screen.getByText(
        summary(
          favoritesGraph.edges.length -
            defaultHiddenCount -
            (relationshipCounts.get("Founder_of") ?? 0),
        ),
      ),
    ).toBeInTheDocument();

    await user.click(founderFilter);
    expect(founderFilter).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByLabelText("Noam Shazeer — Founder of → Character.AI"),
    ).toBeInTheDocument();
  });
});
