import "./App.css";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const tasks = useQuery(api.tasks.get);
  return (
    <div className="App">
      <h1>my RSS</h1>
      {tasks === undefined ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet. Add some in your Convex dashboard.</p>
      ) : (
        tasks.map(({ _id, text }) => <div key={_id}>{text}</div>)
      )}
    </div>
  );
}

export default App;


