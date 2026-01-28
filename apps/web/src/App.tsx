import { LogOut, Plus, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GoalCard } from './components/Goals/GoalCard';
import { AddGoalModal } from './components/modals/AddGoalModal';
import AddTaskModal from './components/modals/AddTaskModal';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { TaskListComponent } from './components/Tasks/TaskListComponent';
import { useGoalContext } from './contexts/GoalContext';
import { useTaskContext } from './contexts/TaskContext';
import { CallbackPage } from './pages/CallbackPage';
import { GoalDetailsPage } from './pages/GoalDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { PlannerPage } from './pages/PlannerPage';

type ViewMode = 'goals' | 'tasks' | 'planner';

function AppContent() {
  const auth = useAuth();
  const { goals, fetchGoals } = useGoalContext();
  const { tasks, fetchTasks } = useTaskContext();
  const [viewMode, setViewMode] = useState<ViewMode>('planner');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchGoals();
      fetchTasks();
    }
  }, [auth.isAuthenticated]);

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
  };

  const handleLogout = () => {
    auth.removeUser();
    auth.signoutRedirect();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 w-full">
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
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Goal Tracker
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">
                    Track your progress and achieve your dreams.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="primary-btn flex items-center gap-2 text-sm sm:text-base whitespace-nowrap"
                    onClick={() =>
                      viewMode === 'goals' ? setIsGoalModalOpen(true) : setIsTaskModalOpen(true)
                    }
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">
                      New {viewMode === 'goals' ? 'Goal' : 'Task'}
                    </span>
                    <span className="sm:hidden">New</span>
                  </button>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                      title={auth.user?.profile?.email || 'User menu'}
                    >
                      <User size={18} className="text-gray-400" />
                      <span className="hidden sm:inline text-sm text-gray-300">
                        {auth.user?.profile?.name || auth.user?.profile?.email || 'User'}
                      </span>
                    </button>

                    {showUserMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowUserMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-700">
                            <p className="text-sm font-medium text-gray-200">
                              {auth.user?.profile?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {auth.user?.profile?.email}
                            </p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </header>

              {/* View Mode Tabs */}
              <div className="flex gap-1 sm:gap-3 mb-6 sm:mb-8 border-b border-white/10 pb-2 sm:pb-3 overflow-x-auto">
                <button
                  onClick={() => setViewMode('goals')}
                  className={`px-3 sm:px-6 py-2 rounded text-sm sm:text-base transition-all whitespace-nowrap ${
                    viewMode === 'goals'
                      ? 'bg-cyan-500 font-semibold text-white'
                      : 'bg-transparent text-white font-normal hover:bg-white/5'
                  }`}
                >
                  <span className="sm:hidden">Goals</span>
                  <span className="hidden sm:inline">Goals ({goals.length})</span>
                </button>
                <button
                  onClick={() => setViewMode('tasks')}
                  className={`px-3 sm:px-6 py-2 rounded text-sm sm:text-base transition-all whitespace-nowrap ${
                    viewMode === 'tasks'
                      ? 'bg-cyan-500 font-semibold text-white'
                      : 'bg-transparent text-white font-normal hover:bg-white/5'
                  }`}
                >
                  <span className="sm:hidden">Tasks</span>
                  <span className="hidden sm:inline">Tasks ({tasks.length})</span>
                </button>
                <button
                  onClick={() => setViewMode('planner')}
                  className={`px-3 sm:px-6 py-2 rounded text-sm sm:text-base transition-all whitespace-nowrap ${
                    viewMode === 'planner'
                      ? 'bg-cyan-500 font-semibold text-white'
                      : 'bg-transparent text-white font-normal hover:bg-white/5'
                  }`}
                >
                  Planner
                </button>
              </div>

              {/* Goals View */}
              {viewMode === 'goals' && (
                <>
                  {/* Yearly Goals Section */}
                  {goals.some((g) => g.scope === 'YEARLY') && (
                    <div className="mb-8 sm:mb-10">
                      <h2 className="text-xl sm:text-2xl text-yellow-400 mb-3 sm:mb-4 pb-2 border-b-2 border-yellow-400">
                        Yearly Goals
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {goals
                          .filter((g) => g.scope === 'YEARLY')
                          .map((goal) => (
                            <div key={goal.id}>
                              <GoalCard goal={goal} onUpdate={fetchGoals} />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Goals Section */}
                  {goals.some((g) => g.scope === 'MONTHLY') && (
                    <div className="mb-8 sm:mb-10">
                      <h2 className="text-xl sm:text-2xl text-green-400 mb-3 sm:mb-4 pb-2 border-b-2 border-green-400">
                        Monthly Goals
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {goals
                          .filter((g) => g.scope === 'MONTHLY')
                          .map((goal) => (
                            <div key={goal.id}>
                              <GoalCard goal={goal} onUpdate={fetchGoals} />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Standalone Goals Section */}
                  {goals.some((g) => g.scope === 'STANDALONE') && (
                    <div className="mb-8 sm:mb-10">
                      <h2 className="text-xl sm:text-2xl text-cyan-400 mb-3 sm:mb-4 pb-2 border-b-2 border-cyan-400">
                        Standalone Goals
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {goals
                          .filter((g) => g.scope === 'STANDALONE')
                          .map((goal) => (
                            <div key={goal.id}>
                              <GoalCard goal={goal} onUpdate={fetchGoals} />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tasks View */}
              {viewMode === 'tasks' && (
                <TaskListComponent
                  tasks={tasks}
                  onTaskEvent={(taskId, event) => {
                    // Refetch tasks on any task event
                    fetchTasks();
                  }}
                />
              )}

              {/* Planner View */}
              {viewMode === 'planner' && <PlannerPage />}

              {/* Empty States */}
              {viewMode === 'goals' && goals.length === 0 && (
                <div className="text-center py-12 sm:py-16 text-gray-400">
                  <p className="text-sm sm:text-base">No goals yet. Create one to get started!</p>
                </div>
              )}

              {isGoalModalOpen && (
                <AddGoalModal onClose={() => setIsGoalModalOpen(false)} onAdded={fetchGoals} />
              )}
              {isTaskModalOpen && (
                <AddTaskModal
                  isOpen={isTaskModalOpen}
                  onClose={handleCloseTaskModal}
                  onTaskAdded={() => {
                    fetchTasks();
                    fetchGoals(); // Refresh goals to show updated task counts
                  }}
                />
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
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
