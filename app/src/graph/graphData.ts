import edgesData from "./data/edges.json";
import entitiesData from "./data/entities.json";
import personEdgesData from "./data/is_a_person-edges.json";

import { createKnowledgeGraph } from "../../models/knowledgeGraph";

export const favoritesGraph = createKnowledgeGraph(
  entitiesData.entities,
  [...edgesData.edges, ...personEdgesData.edges],
);

export const defaultHiddenRelationshipTypes = new Set(["Is_a_Person"]);
