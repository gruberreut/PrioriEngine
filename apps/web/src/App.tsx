import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { NavBar } from "./components/NavBar/NavBar";
import { FAB } from "./components/FAB/FAB";
import { RankingPage } from "./features/ranking/RankingPage/RankingPage";
import { TasksPage } from "./features/tasks/TasksPage/TasksPage";
import { TaskCreationPage } from "./features/tasks/TaskCreationPage/TaskCreationPage";

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const showFAB = location.pathname !== "/tasks/new";

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<RankingPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<TaskCreationPage />} />
      </Routes>
      {showFAB && <FAB onClick={() => navigate("/tasks/new")} />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
