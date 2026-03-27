import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { setAuthTokenProvider } from './api';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TaskEditSheet } from './components/TaskEditSheet';
import { TopNavBar } from './components/TopNavBar';
import { useGoalContext } from './contexts/GoalContext';
import { useTaskContext } from './contexts/TaskContext';
import { AchievementDashboardPage } from './pages/AchievementDashboardPage';
import { GoalDetailsPage } from './pages/GoalDetailsPage';
import { GoalsPage } from './pages/GoalsPage';
import { PlannerPage } from './pages/PlannerPage';
import { TasksPage } from './pages/TasksPage';

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { goals, fetchGoals, refreshGoals } = useGoalContext();
  const { refreshTasks } = useTaskContext();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Setup Auth0 token provider for API calls
  useEffect(() => {
    setAuthTokenProvider(() => getAccessTokenSilently());
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && isTaskModalOpen && goals.length === 0) {
      fetchGoals();
    }
  }, [isAuthenticated, isTaskModalOpen, fetchGoals, goals.length]);

  return (
    <div className="w-full">
      {isAuthenticated && <TopNavBar />}

      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 w-full"
        style={{
          paddingTop: isAuthenticated ? '5rem' : undefined,
          paddingBottom: isAuthenticated ? '5rem' : undefined,
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AchievementDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <GoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/:goalId"
            element={
              <ProtectedRoute>
                <GoalDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <PlannerPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {isAuthenticated && isTaskModalOpen && (
        <TaskEditSheet
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={() => {
            refreshTasks();
            refreshGoals();
            setIsTaskModalOpen(false);
          }}
          availableGoals={goals}
        />
      )}

      {isAuthenticated && <BottomNav onAddClick={() => setIsTaskModalOpen(true)} />}
    </div>
  );
}

export default App;
