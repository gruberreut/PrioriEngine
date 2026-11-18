import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { LoadingGate } from "./features/loading/LoadingGate/LoadingGate";
import { NavBar } from "./components/NavBar/NavBar";
import { FAB } from "./components/FAB/FAB";
import { RankingPage } from "./features/ranking/RankingPage/RankingPage";
import { InProgressPage } from "./features/ranking/InProgressPage/InProgressPage";
import { TasksPage } from "./features/tasks/TasksPage/TasksPage";
import { TaskCreationPage } from "./features/tasks/TaskCreationPage/TaskCreationPage";
import { TaskDetailPage } from "./features/tasks/TaskDetailPage/TaskDetailPage";
import { useTheme } from "./features/theme/useTheme";

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isInProgressBlock = location.pathname === "/in-progress";
  // /in-progress blocks navigation elsewhere until the task is resolved
  // (Complete / Snooze / Delete) - the FAB would otherwise be the one
  // remaining way to leave without resolving it, since NavBar already
  // hides its links via linksHidden below.
  const showFAB = location.pathname !== "/tasks/new" && !isInProgressBlock;
  const linksHidden = isInProgressBlock;
  // No UI yet (see tasks/TASKS-FEATURES.md § 23 for the planned settings screen) - this just
  // applies the light/dark theme (time-of-day by default) and exposes
  // window.switchTheme() as a dev-console escape hatch.
  useTheme();

  return (
    <>
      <NavBar linksHidden={linksHidden} />
      <Routes>
        <Route path="/" element={<RankingPage />} />
        <Route path="/in-progress" element={<InProgressPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<TaskCreationPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
      </Routes>
      {showFAB && <FAB onClick={() => navigate("/tasks/new")} />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LoadingGate>
        <AppShell />
      </LoadingGate>
    </BrowserRouter>
  );
}

export default App;
