# Goal

Visualize the lightweight knowledge graph

## MVP

The data in app/src/graph/data are JSON files representing the entities and edges.

At the top right corner, below the "Find your next thing" link,
Add a new button and create a new submodule that allows me to simply visualize the graph.

### Details

**Entity**

- UUIDv4
- Name

**Edges**

Founder_of
Author_of
Host_of
Current_Employee_of
Previous_Employee_of


## Design

put in italics: Select a type to show or hide its connections. Node positions stay fixed.

have below each Edge type chip its count: the count should be the same color as the chip and number "center aligned"

The MVP graph app is pretty crude - what are better visualization patterns than just two columns with a nest of lines between them? 
Could it be clustering? more showing central nodes with lots of connections and more edge nodes?
Also please provide the functionality to select and deselect the edge type (thereby removing those edges and making the graph easier to read)

"Implemented a clustered, degree-centered graph visualization."
- High-degree nodes are larger and sit centrally.


## Post-MVP

Consider a react-force-graph with a search box and click-to-focus

