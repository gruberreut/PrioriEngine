import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar/NavBar";
import { RankingPage } from "./features/ranking/RankingPage/RankingPage";
import { TasksPage } from "./features/tasks/TasksPage/TasksPage";
import { TaskCreationPage } from "./features/tasks/TaskCreationPage/TaskCreationPage";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<RankingPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<TaskCreationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
