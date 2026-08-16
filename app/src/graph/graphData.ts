import edgesData from "./data/edges.json";
import entitiesData from "./data/entities.json";

import { createKnowledgeGraph } from "../../models/knowledgeGraph";

export const favoritesGraph = createKnowledgeGraph(
  entitiesData.entities,
  edgesData.edges,
);
