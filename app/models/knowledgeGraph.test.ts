import { describe, expect, test } from "vitest";

import {
  createKnowledgeGraph,
  layoutForceDirectedGraph,
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

  test("clusters connected entities and places hubs inside their edge nodes", () => {
    const graph = createKnowledgeGraph(
      [
        { id: "hub", name: "Hub" },
        { id: "leaf-a", name: "Leaf A" },
        { id: "leaf-b", name: "Leaf B" },
        { id: "leaf-c", name: "Leaf C" },
      ],
      [
        { source: "hub", target: "leaf-a", type: "Author_of" },
        { source: "hub", target: "leaf-b", type: "Author_of" },
        { source: "hub", target: "leaf-c", type: "Author_of" },
      ],
    );
    const layout = layoutKnowledgeGraph(graph);
    const component = layout.components[0];
    const hub = layout.entities.find((entity) => entity.id === "hub");
    const leaf = layout.entities.find((entity) => entity.id === "leaf-a");

    expect(layout.components).toHaveLength(1);
    expect(hub?.degree).toBe(3);
    expect(leaf?.degree).toBe(1);
    expect(Math.hypot((hub?.x ?? 0) - component.x, (hub?.y ?? 0) - component.y)).toBeLessThan(
      Math.hypot((leaf?.x ?? 0) - component.x, (leaf?.y ?? 0) - component.y),
    );
  });

  test("provides a deterministic force-directed alternative layout", () => {
    const graph = createKnowledgeGraph(
      [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
      ],
      [
        { source: "a", target: "b", type: "Related_to" },
        { source: "b", target: "c", type: "Related_to" },
      ],
    );

    const first = layoutForceDirectedGraph(graph);
    const second = layoutForceDirectedGraph(graph);

    expect(first).toEqual(second);
    expect(first.entities).toHaveLength(3);
    expect(first.entities).not.toEqual(layoutKnowledgeGraph(graph).entities);
    for (const entity of first.entities) {
      expect(entity.x).toBeGreaterThanOrEqual(0);
      expect(entity.x).toBeLessThanOrEqual(first.width);
      expect(entity.y).toBeGreaterThanOrEqual(0);
      expect(entity.y).toBeLessThanOrEqual(first.height);
    }
  });
});
