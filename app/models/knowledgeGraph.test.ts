import { describe, expect, test } from "vitest";

import {
  createKnowledgeGraph,
  layoutKnowledgeGraph,
  relationshipLabel,
} from "./knowledgeGraph";

describe("knowledge graph model", () => {
  test("rejects relationships that reference a missing entity", () => {
    expect(() =>
      createKnowledgeGraph(
        [{ id: "person", name: "Person" }],
        [{ source: "person", target: "missing", type: "Author_of" }],
      ),
    ).toThrow("invalid relationship");
  });

  test("lays out every entity and presents relationship types readably", () => {
    const graph = createKnowledgeGraph(
      [
        { id: "person", name: "Person" },
        { id: "work", name: "Work" },
      ],
      [{ source: "person", target: "work", type: "Author_of" }],
    );

    expect(layoutKnowledgeGraph(graph).entities).toHaveLength(2);
    expect(relationshipLabel("Current_Employee_of")).toBe(
      "Current employee of",
    );
  });
});
