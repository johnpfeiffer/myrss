import { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import {
  layoutKnowledgeGraph,
  relationshipLabel,
} from "../../models/knowledgeGraph";
import { favoritesGraph } from "./graphData";
import "./KnowledgeGraph.css";

const nodeWidth = 250;
const nodeHeight = 36;

export function KnowledgeGraphPage() {
  const theme = useTheme();
  const layout = useMemo(() => layoutKnowledgeGraph(favoritesGraph), []);
  const positions = useMemo(
    () => new Map(layout.entities.map((entity) => [entity.id, entity])),
    [layout.entities],
  );
  const relationshipTypes = [...new Set(favoritesGraph.edges.map((edge) => edge.type))];
  const relationshipColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  return (
    <Box className="app-shell">
      <Container component="main" maxWidth="lg" className="page-container">
        <Stack spacing={3}>
          <Stack
            component="header"
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography component="h1" variant="h3" sx={{ fontWeight: 700 }}>
                Favorites graph
              </Typography>
              <Typography color="text.secondary">
                {favoritesGraph.entities.length} entities · {favoritesGraph.edges.length}{" "}
                relationships
              </Typography>
            </Box>
            <Button component="a" href="./" variant="outlined" sx={{ textTransform: "none" }}>
              Back to favorites
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {relationshipTypes.map((type, index) => (
              <Chip
                key={type}
                label={relationshipLabel(type)}
                size="small"
                variant="outlined"
                sx={{ borderColor: relationshipColors[index % relationshipColors.length] }}
              />
            ))}
          </Stack>

          <Paper variant="outlined" className="knowledge-graph-frame">
            <svg
              aria-labelledby="knowledge-graph-title knowledge-graph-description"
              className="knowledge-graph-svg"
              role="img"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
            >
              <title id="knowledge-graph-title">Favorites knowledge graph</title>
              <desc id="knowledge-graph-description">
                Entities are connected by author, founder, host, and employment relationships.
              </desc>
              <defs>
                {relationshipTypes.map((type, index) => (
                  <marker
                    id={`arrow-${index}`}
                    key={type}
                    markerHeight="8"
                    markerWidth="8"
                    orient="auto"
                    refX="7"
                    refY="4"
                    viewBox="0 0 8 8"
                  >
                    <path
                      d="M 0 0 L 8 4 L 0 8 z"
                      fill={relationshipColors[index % relationshipColors.length]}
                    />
                  </marker>
                ))}
              </defs>

              {favoritesGraph.edges.map((edge, index) => {
                const source = positions.get(edge.source);
                const target = positions.get(edge.target);
                if (!source || !target) {
                  return null;
                }
                const typeIndex = relationshipTypes.indexOf(edge.type);
                const sourceName = source.name;
                const targetName = target.name;
                const label = `${sourceName} — ${relationshipLabel(edge.type)} → ${targetName}`;

                return (
                  <g aria-label={label} key={`${edge.source}-${edge.target}-${index}`}>
                    <title>{label}</title>
                    <line
                      markerEnd={`url(#arrow-${typeIndex})`}
                      stroke={relationshipColors[typeIndex % relationshipColors.length]}
                      strokeOpacity="0.46"
                      strokeWidth="1.5"
                      x1={source.x + nodeWidth / 2}
                      x2={target.x - nodeWidth / 2 - 8}
                      y1={source.y}
                      y2={target.y}
                    />
                  </g>
                );
              })}

              {layout.entities.map((entity) => (
                <g key={entity.id} transform={`translate(${entity.x}, ${entity.y})`}>
                  <title>{entity.name}</title>
                  <rect
                    fill={theme.palette.background.paper}
                    height={nodeHeight}
                    rx="4"
                    stroke={theme.palette.divider}
                    strokeWidth="1"
                    width={nodeWidth}
                    x={-nodeWidth / 2}
                    y={-nodeHeight / 2}
                  />
                  <text
                    dominantBaseline="middle"
                    fill={theme.palette.text.primary}
                    fontFamily={theme.typography.fontFamily}
                    fontSize="14"
                    textAnchor="middle"
                  >
                    {entity.name}
                  </text>
                </g>
              ))}
            </svg>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

export default KnowledgeGraphPage;
