import { useEffect, useMemo, useRef, useState } from "react";
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
  countRelationshipsByType,
  layoutKnowledgeGraph,
  relationshipLabel,
} from "../../models/knowledgeGraph";
import { favoritesGraph } from "./graphData";
import "./KnowledgeGraph.css";

export function KnowledgeGraphPage() {
  const theme = useTheme();
  const graphFrameRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => layoutKnowledgeGraph(favoritesGraph), []);
  const positions = useMemo(
    () => new Map(layout.entities.map((entity) => [entity.id, entity])),
    [layout.entities],
  );
  const clusters = useMemo(
    () => new Map(layout.components.map((component) => [component.id, component])),
    [layout.components],
  );
  const relationshipTypes = useMemo(
    () => [...new Set(favoritesGraph.edges.map((edge) => edge.type))],
    [],
  );
  const relationshipCounts = useMemo(
    () => countRelationshipsByType(favoritesGraph.edges),
    [],
  );
  const [selectedTypes, setSelectedTypes] = useState(
    () => new Set(relationshipTypes),
  );
  const visibleEdges = favoritesGraph.edges.filter((edge) =>
    selectedTypes.has(edge.type),
  );
  const relationshipColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  useEffect(() => {
    const frame = graphFrameRef.current;
    if (frame && frame.scrollWidth > frame.clientWidth) {
      frame.scrollLeft = (frame.scrollWidth - frame.clientWidth) / 2;
    }
  }, []);

  function toggleRelationshipType(type: string) {
    setSelectedTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function nodeRadius(degree: number) {
    return 9 + Math.sqrt(Math.max(degree, 1)) * 5;
  }

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
              <Typography aria-live="polite" color="text.secondary">
                {favoritesGraph.entities.length} entities · {visibleEdges.length} of{" "}
                {favoritesGraph.edges.length} relationships shown
              </Typography>
            </Box>
            <Button component="a" href="./" variant="outlined" sx={{ textTransform: "none" }}>
              Back to favorites
            </Button>
          </Stack>

          <Box component="section" aria-labelledby="relationship-filter-title">
            <Typography component="h2" id="relationship-filter-title" variant="subtitle1">
              Relationship types
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ fontStyle: "italic", mb: 1 }}
            >
              Select a type to show or hide its connections. Node positions stay fixed.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              {relationshipTypes.map((type, index) => {
                const selected = selectedTypes.has(type);
                const color = relationshipColors[index % relationshipColors.length];
                const label = relationshipLabel(type);
                const count = relationshipCounts.get(type) ?? 0;
                return (
                  <Stack key={type} spacing={0.5} sx={{ alignItems: "center" }}>
                    <Chip
                      aria-pressed={selected}
                      clickable
                      label={label}
                      onClick={() => toggleRelationshipType(type)}
                      size="small"
                      variant={selected ? "filled" : "outlined"}
                      sx={{
                        backgroundColor: selected ? color : "transparent",
                        borderColor: color,
                        color: selected
                          ? theme.palette.getContrastText(color)
                          : theme.palette.text.primary,
                      }}
                    />
                    <Typography
                      aria-label={`${label}: ${count} relationships`}
                      sx={{
                        color,
                        fontWeight: 600,
                        lineHeight: 1,
                        textAlign: "center",
                      }}
                      variant="caption"
                    >
                      {count}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Box>

          <Paper
            className="knowledge-graph-frame"
            ref={graphFrameRef}
            variant="outlined"
          >
            <svg
              aria-labelledby="knowledge-graph-title knowledge-graph-description"
              className="knowledge-graph-svg"
              role="img"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
            >
              <title id="knowledge-graph-title">Favorites knowledge graph</title>
              <desc id="knowledge-graph-description">
                Connected entities form clusters. Larger central nodes have more connections,
                and less-connected nodes sit toward cluster edges.
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

              {layout.components.map((component) => (
                <circle
                  cx={component.x}
                  cy={component.y}
                  fill={theme.palette.action.hover}
                  key={component.id}
                  r={component.radius}
                  stroke={theme.palette.divider}
                  strokeDasharray="5 7"
                  strokeWidth="1"
                />
              ))}

              {visibleEdges.map((edge, index) => {
                const source = positions.get(edge.source);
                const target = positions.get(edge.target);
                if (!source || !target) {
                  return null;
                }
                const typeIndex = relationshipTypes.indexOf(edge.type);
                const sourceName = source.name;
                const targetName = target.name;
                const label = `${sourceName} — ${relationshipLabel(edge.type)} → ${targetName}`;
                const distance = Math.hypot(target.x - source.x, target.y - source.y) || 1;
                const unitX = (target.x - source.x) / distance;
                const unitY = (target.y - source.y) / distance;
                const sourceRadius = nodeRadius(source.degree);
                const targetRadius = nodeRadius(target.degree);

                return (
                  <g aria-label={label} key={`${edge.source}-${edge.target}-${index}`}>
                    <title>{label}</title>
                    <line
                      markerEnd={`url(#arrow-${typeIndex})`}
                      stroke={relationshipColors[typeIndex % relationshipColors.length]}
                      strokeOpacity="0.58"
                      strokeWidth="2"
                      x1={source.x + unitX * sourceRadius}
                      x2={target.x - unitX * (targetRadius + 8)}
                      y1={source.y + unitY * sourceRadius}
                      y2={target.y - unitY * (targetRadius + 8)}
                    />
                  </g>
                );
              })}

              {layout.entities.map((entity) => {
                const radius = nodeRadius(entity.degree);
                const cluster = clusters.get(entity.componentId);
                const clusterCenterX = cluster?.x ?? layout.width / 2;
                const horizontalOffset = entity.x - clusterCenterX;
                const isPrimaryCluster = (cluster?.entityIds.length ?? 0) > 5;
                const placeLabelVertically =
                  isPrimaryCluster &&
                  Math.abs(horizontalOffset) <= radius * 1.25;
                const clusterOffset = clusterCenterX - layout.width / 2;
                const labelOnRight = !isPrimaryCluster && Math.abs(clusterOffset) > 1
                  ? clusterOffset > 0
                  : Math.abs(horizontalOffset) > 1
                    ? horizontalOffset > 0
                    : clusterCenterX <= layout.width / 2;
                return (
                  <g key={entity.id} transform={`translate(${entity.x}, ${entity.y})`}>
                    <title>{`${entity.name}, ${entity.degree} connections`}</title>
                    <circle
                      fill={theme.palette.primary.main}
                      r={radius}
                      stroke={theme.palette.background.paper}
                      strokeWidth="3"
                    />
                    <text
                      dominantBaseline={
                        placeLabelVertically
                          ? entity.y < (cluster?.y ?? layout.height / 2)
                            ? "auto"
                            : "hanging"
                          : "middle"
                      }
                      fill={theme.palette.text.primary}
                      fontFamily={theme.typography.fontFamily}
                      fontSize="20"
                      fontWeight={entity.degree >= 4 ? 600 : 400}
                      paintOrder="stroke"
                      stroke={theme.palette.background.paper}
                      strokeWidth="5"
                      textAnchor={
                        placeLabelVertically
                          ? "middle"
                          : labelOnRight
                            ? "start"
                            : "end"
                      }
                      x={
                        placeLabelVertically
                          ? 0
                          : labelOnRight
                            ? radius + 8
                            : -radius - 8
                      }
                      y={
                        placeLabelVertically
                          ? entity.y < (cluster?.y ?? layout.height / 2)
                            ? -radius - 8
                            : radius + 8
                          : 0
                      }
                    >
                      {entity.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

export default KnowledgeGraphPage;
