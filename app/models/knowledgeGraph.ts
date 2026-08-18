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

export function layoutForceDirectedGraph(graph: KnowledgeGraph): KnowledgeGraphLayout {
  const initial = layoutKnowledgeGraph(graph);
  const padding = 80;
  const nodes = initial.entities.map((entity) => ({
    ...entity,
    vx: 0,
    vy: 0,
  }));
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const springs = graph.edges.flatMap((edge) => {
    const source = nodeIndex.get(edge.source);
    const target = nodeIndex.get(edge.target);
    return source === undefined || target === undefined ? [] : [{ source, target }];
  });

  for (let iteration = 0; iteration < 140; iteration += 1) {
    const cooling = 1 - iteration / 180;

    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      const left = nodes[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const right = nodes[rightIndex];
        let dx = right.x - left.x;
        let dy = right.y - left.y;
        let distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 1) {
          const angle = ((leftIndex + 1) * (rightIndex + 1) * 2.399963) % (Math.PI * 2);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distanceSquared = 1;
        }
        const distance = Math.sqrt(distanceSquared);
        const repulsion = Math.min(18, 7200 / distanceSquared) * cooling;
        const forceX = (dx / distance) * repulsion;
        const forceY = (dy / distance) * repulsion;
        left.vx -= forceX;
        left.vy -= forceY;
        right.vx += forceX;
        right.vy += forceY;
      }
    }

    for (const spring of springs) {
      const source = nodes[spring.source];
      const target = nodes[spring.target];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.hypot(dx, dy) || 1;
      const attraction = (distance - 135) * 0.018 * cooling;
      const forceX = (dx / distance) * attraction;
      const forceY = (dy / distance) * attraction;
      source.vx += forceX;
      source.vy += forceY;
      target.vx -= forceX;
      target.vy -= forceY;
    }

    for (const node of nodes) {
      node.vx += (initial.width / 2 - node.x) * 0.0008;
      node.vy += (initial.height / 2 - node.y) * 0.0008;
      node.vx *= 0.78;
      node.vy *= 0.78;
      const speed = Math.hypot(node.vx, node.vy);
      const speedLimit = 12 * cooling;
      if (speed > speedLimit) {
        node.vx = (node.vx / speed) * speedLimit;
        node.vy = (node.vy / speed) * speedLimit;
      }
      node.x += node.vx;
      node.y += node.vy;
    }
  }

  const minX = Math.min(...nodes.map((node) => node.x));
  const maxX = Math.max(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxY = Math.max(...nodes.map((node) => node.y));
  const xRange = Math.max(maxX - minX, 1);
  const yRange = Math.max(maxY - minY, 1);
  const availableWidth = initial.width - padding * 2;
  const availableHeight = initial.height - padding * 2;

  return {
    ...initial,
    entities: nodes.map((node) => ({
      id: node.id,
      name: node.name,
      componentId: node.componentId,
      degree: node.degree,
      x: padding + ((node.x - minX) / xRange) * availableWidth,
      y: padding + ((node.y - minY) / yRange) * availableHeight,
    })),
  };
}
