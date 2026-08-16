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
  componentId: string;
  degree: number;
}

export interface KnowledgeGraphCluster {
  id: string;
  x: number;
  y: number;
  radius: number;
  entityIds: string[];
}

export interface KnowledgeGraphLayout {
  width: number;
  height: number;
  components: KnowledgeGraphCluster[];
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

export function countRelationshipsByType(edges: GraphEdge[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of edges) {
    counts.set(edge.type, (counts.get(edge.type) ?? 0) + 1);
  }
  return counts;
}

export function layoutKnowledgeGraph(graph: KnowledgeGraph): KnowledgeGraphLayout {
  const width = 1600;
  const height = 1200;
  const centerX = width / 2;
  const centerY = height / 2;
  const entityById = new Map(graph.entities.map((entity) => [entity.id, entity]));
  const neighbors = new Map(graph.entities.map((entity) => [entity.id, new Set<string>()]));

  for (const edge of graph.edges) {
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
  }

  const unvisited = new Set(graph.entities.map((entity) => entity.id));
  const connectedComponents: string[][] = [];

  while (unvisited.size > 0) {
    const first = [...unvisited].sort()[0];
    const pending = [first];
    const entityIds: string[] = [];
    unvisited.delete(first);

    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) {
        continue;
      }
      entityIds.push(current);
      for (const neighbor of neighbors.get(current) ?? []) {
        if (unvisited.delete(neighbor)) {
          pending.push(neighbor);
        }
      }
    }
    connectedComponents.push(entityIds);
  }

  connectedComponents.sort((left, right) => {
    if (right.length !== left.length) {
      return right.length - left.length;
    }
    const leftName = entityById.get(left[0])?.name ?? left[0];
    const rightName = entityById.get(right[0])?.name ?? right[0];
    return leftName.localeCompare(rightName);
  });

  const satelliteCount = Math.max(connectedComponents.length - 1, 1);
  const components = connectedComponents.map((entityIds, index) => {
    const isPrimary = index === 0 && entityIds.length > 5;
    const angle = -Math.PI / 2 + ((index - 1) * Math.PI * 2) / satelliteCount;
    return {
      id: `cluster-${index}`,
      x: isPrimary || connectedComponents.length === 1
        ? centerX
        : centerX + Math.cos(angle) * 620,
      y: isPrimary || connectedComponents.length === 1
        ? centerY
        : centerY + Math.sin(angle) * 470,
      radius: isPrimary ? 320 : Math.min(128, 62 + entityIds.length * 13),
      entityIds,
    };
  });

  const entities = components.flatMap((component) => {
    const sortedEntities = component.entityIds
      .map((id) => entityById.get(id))
      .filter((entity): entity is GraphEntity => entity !== undefined)
      .sort((left, right) => {
        const degreeDifference =
          (neighbors.get(right.id)?.size ?? 0) - (neighbors.get(left.id)?.size ?? 0);
        return degreeDifference || left.name.localeCompare(right.name);
      });
    const maxDegree = Math.max(
      ...sortedEntities.map((entity) => neighbors.get(entity.id)?.size ?? 0),
      1,
    );
    const hubCount = sortedEntities.filter(
      (entity) => (neighbors.get(entity.id)?.size ?? 0) === maxDegree,
    ).length;
    let edgeNodeIndex = 0;

    return sortedEntities.map((entity, index) => {
      const degree = neighbors.get(entity.id)?.size ?? 0;
      const isHub = maxDegree > 1 && degree === maxDegree;
      let radialDistance: number;
      let angle: number;

      if (sortedEntities.length === 1) {
        radialDistance = 0;
        angle = 0;
      } else if (isHub) {
        radialDistance = hubCount === 1 ? 0 : Math.min(46, component.radius * 0.2);
        angle = (index * Math.PI * 2) / hubCount;
      } else {
        const edgeNodeCount = sortedEntities.length - (maxDegree > 1 ? hubCount : 0);
        radialDistance = component.radius * (0.48 + (1 - degree / maxDegree) * 0.4);
        radialDistance += edgeNodeIndex % 2 === 0 ? 0 : component.radius * 0.06;
        angle = -Math.PI / 2 + (edgeNodeIndex * Math.PI * 2) / edgeNodeCount;
        edgeNodeIndex += 1;
      }

      return {
        ...entity,
        componentId: component.id,
        degree,
        x: component.x + Math.cos(angle) * radialDistance,
        y: component.y + Math.sin(angle) * radialDistance,
      };
    });
  });

  return {
    width,
    height,
    components,
    entities,
  };
}
