import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { setAuthTokenProvider } from './api';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TaskEditSheet } from './components/TaskEditSheet';
import { TopNavBar } from './components/TopNavBar';
import { useGoalContext } from './contexts/GoalContext';
import { useTaskContext } from './contexts/TaskContext';
import { AchievementDashboardPage } from './pages/AchievementDashboardPage';
import { CallbackPage } from './pages/CallbackPage';
import { GoalDetailsPage } from './pages/GoalDetailsPage';
import { GoalsPage } from './pages/GoalsPage';
import { LoginPage } from './pages/LoginPage';
import { PlannerPage } from './pages/PlannerPage';
import { TasksPage } from './pages/TasksPage';

function AppContent() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { goals, fetchGoals } = useGoalContext();
  const { fetchTasks } = useTaskContext();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const hasFetchedRef = useRef(false);

  const handleAddTask = () => {
    setIsTaskModalOpen(true);
  };

  // Setup Auth0 token provider for API calls
  useEffect(() => {
    setAuthTokenProvider(async () => {
      try {
        const token = await getAccessTokenSilently();
        return token;
      } catch (error) {
        console.error('Error getting access token:', error);
        return '';
      }
    });
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchGoals();
      fetchTasks();
    }
  }, [isAuthenticated, fetchGoals, fetchTasks]);

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
  };

  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/callback';

  return (
    <div className="w-full">
      {/* Master Navigation Bar - shown on all authenticated pages */}
      {isAuthenticated && !isAuthPage && <TopNavBar />}

      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 w-full"
        style={{
          paddingTop: isAuthenticated && !isAuthPage ? '5rem' : undefined,
          paddingBottom: isAuthenticated && !isAuthPage ? '5rem' : undefined,
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route
            path="/goals/:goalId"
            element={
              <ProtectedRoute>
                <GoalDetailsPage />
              </ProtectedRoute>
            }
          />
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

      {/* Global Task Edit Sheet - shown on all authenticated pages */}
      {isAuthenticated && !isAuthPage && isTaskModalOpen && (
        <TaskEditSheet
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSave={() => {
            fetchTasks();
            fetchGoals();
            handleCloseTaskModal();
          }}
          availableGoals={goals}
        />
      )}

      {/* Bottom Navigation - shown on all authenticated pages */}
      {isAuthenticated && !isAuthPage && <BottomNav onAddClick={handleAddTask} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
