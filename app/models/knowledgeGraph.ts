export interface GraphEntity {
  id: string;
  name: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface KnowledgeGraph {
  entities: GraphEntity[];
  edges: GraphEdge[];
}

export interface PositionedGraphEntity extends GraphEntity {
  x: number;
  y: number;
}

export interface KnowledgeGraphLayout {
  width: number;
  height: number;
  entities: PositionedGraphEntity[];
}

export function createKnowledgeGraph(
  entities: GraphEntity[],
  edges: GraphEdge[],
): KnowledgeGraph {
  const ids = new Set<string>();

  for (const entity of entities) {
    if (!entity.id || !entity.name || ids.has(entity.id)) {
      throw new Error("Favorites graph contains an invalid or duplicate entity.");
    }
    ids.add(entity.id);
  }

  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target) || !edge.type) {
      throw new Error("Favorites graph contains an invalid relationship.");
    }
  }

  return { entities, edges };
}

export function relationshipLabel(type: string): string {
  const words = type.replaceAll("_", " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function layoutKnowledgeGraph(graph: KnowledgeGraph): KnowledgeGraphLayout {
  const width = 1080;
  const rowHeight = 52;
  const marginY = 48;
  const sourceIds = new Set(graph.edges.map((edge) => edge.source));
  const byName = (a: GraphEntity, b: GraphEntity) => a.name.localeCompare(b.name);
  const sources = graph.entities.filter((entity) => sourceIds.has(entity.id)).sort(byName);
  const targets = graph.entities.filter((entity) => !sourceIds.has(entity.id)).sort(byName);
  const rowCount = Math.max(sources.length, targets.length, 1);
  const height = Math.max(720, marginY * 2 + (rowCount - 1) * rowHeight);

  function positionColumn(entities: GraphEntity[], x: number) {
    if (entities.length === 0) {
      return [];
    }
    const availableHeight = height - marginY * 2;
    const gap = entities.length === 1 ? 0 : availableHeight / (entities.length - 1);
    return entities.map((entity, index) => ({
      ...entity,
      x,
      y: marginY + index * gap,
    }));
  }

  return {
    width,
    height,
    entities: [
      ...positionColumn(sources, 145),
      ...positionColumn(targets, width - 145),
    ],
  };
}
