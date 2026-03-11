import "./App.css";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const projects = useQuery(api.projects.get);
  return (
    <div className="App">
      <h1>my RSS</h1>
      {projects === undefined ? (
        <p>Loading...</p>
      ) : projects.length === 0 ? (
        <p>No projects yet. Add some in your Convex dashboard.</p>
      ) : (
        projects.map((project) => (
          <div key={project._id}>
            <a href={project.url}>{project.text}</a>
          </div>
        ))
      )}
    </div>
  );
}

export default App;


