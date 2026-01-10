import React, { useEffect, useState } from 'react';
import { Goal, Task } from './types';
import { GoalCard } from './components/GoalCard';
import { AddGoalModal } from './components/AddGoalModal';
import TaskCard from './components/TaskCard';
import AddTaskModal from './components/AddTaskModal';
import { GoalDetailsPage } from './pages/GoalDetailsPage';
import { PlannerPage } from './pages/PlannerPage';
import { Plus } from 'lucide-react';
import { useGoalContext } from './contexts/GoalContext';
import { useTaskContext } from './contexts/TaskContext';

type ViewMode = 'goals' | 'tasks' | 'planner';
type PageMode = 'list' | 'details';

function AppContent() {
    const { goals, fetchGoals } = useGoalContext();
    const { tasks, fetchTasks } = useTaskContext();
    const [viewMode, setViewMode] = useState<ViewMode>('planner');
    const [pageMode, setPageMode] = useState<PageMode>('list');
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchGoals();
        fetchTasks();
    }, []);

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
    };

    const handleGoalDetailsClick = (goalId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            setSelectedGoal(goal);
            setPageMode('details');
        }
    };

    const handleBackToList = () => {
        setPageMode('list');
        setSelectedGoal(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-8 py-8 w-full">
            {pageMode === 'details' && selectedGoal ? (
                <GoalDetailsPage 
                    goal={selectedGoal}
                    onBack={handleBackToList}
                    onUpdate={fetchGoals}
                />
            ) : (
                <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Goal Tracker</h1>
                    <p className="text-gray-400 mt-2">Track your progress and achieve your dreams.</p>
                </div>
                <button 
                    className="primary-btn flex items-center gap-2" 
                    onClick={() => viewMode === 'goals' ? setIsGoalModalOpen(true) : setIsTaskModalOpen(true)}
                >
                    <Plus size={20} />
                    <span>New {viewMode === 'goals' ? 'Goal' : 'Task'}</span>
                </button>
            </header>

            {/* View Mode Tabs */}
            <div className="flex gap-3 mb-8 border-b border-white/10 pb-3">
                <button
                    onClick={() => setViewMode('goals')}
                    className={`px-6 py-2 rounded transition-all ${
                        viewMode === 'goals' 
                            ? 'bg-cyan-500 font-semibold text-white' 
                            : 'bg-transparent text-white font-normal hover:bg-white/5'
                    }`}
                >
                    Goals ({goals.length})
                </button>
                <button
                    onClick={() => setViewMode('tasks')}
                    className={`px-6 py-2 rounded transition-all ${
                        viewMode === 'tasks' 
                            ? 'bg-cyan-500 font-semibold text-white' 
                            : 'bg-transparent text-white font-normal hover:bg-white/5'
                    }`}
                >
                    Tasks ({tasks.length})
                </button>
                <button
                    onClick={() => setViewMode('planner')}
                    className={`px-6 py-2 rounded transition-all ${
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
                    {goals.some(g => g.scope === 'YEARLY') && (
                        <div className="mb-10">
                            <h2 className="text-2xl text-yellow-400 mb-4 pb-2 border-b-2 border-yellow-400">
                                Yearly Goals
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {goals.filter(g => g.scope === 'YEARLY').map(goal => (
                                    <div key={goal.id}>
                                        <GoalCard goal={goal} onUpdate={fetchGoals} onViewDetails={() => handleGoalDetailsClick(goal.id)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Monthly Goals Section */}
                    {goals.some(g => g.scope === 'MONTHLY') && (
                        <div className="mb-10">
                            <h2 className="text-2xl text-green-400 mb-4 pb-2 border-b-2 border-green-400">
                                Monthly Goals
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {goals.filter(g => g.scope === 'MONTHLY').map(goal => (
                                    <div key={goal.id}>
                                        <GoalCard goal={goal} onUpdate={fetchGoals} onViewDetails={() => handleGoalDetailsClick(goal.id)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Standalone Goals Section */}
                    {goals.some(g => g.scope === 'STANDALONE') && (
                        <div className="mb-10">
                            <h2 className="text-2xl text-cyan-400 mb-4 pb-2 border-b-2 border-cyan-400">
                                Standalone Goals
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {goals.filter(g => g.scope === 'STANDALONE').map(goal => (
                                    <div key={goal.id}>
                                        <GoalCard goal={goal} onUpdate={fetchGoals} onViewDetails={() => handleGoalDetailsClick(goal.id)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Tasks View */}
            {viewMode === 'tasks' && (
                <div className="flex flex-col gap-4">
                    {tasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            onUpdate={fetchTasks} 
                            onEdit={handleEditTask}
                        />
                    ))}
                </div>
            )}

            {/* Planner View */}
            {viewMode === 'planner' && (
                <PlannerPage />
            )}

            {/* Empty States */}
            {viewMode === 'goals' && goals.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p>No goals yet. Create one to get started!</p>
                </div>
            )}

            {viewMode === 'tasks' && tasks.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p>No tasks yet. Create one to get started!</p>
                </div>
            )}

            {isGoalModalOpen && <AddGoalModal onClose={() => setIsGoalModalOpen(false)} onAdded={fetchGoals} />}
            {isTaskModalOpen && (
                <AddTaskModal 
                    isOpen={isTaskModalOpen}
                    onClose={handleCloseTaskModal} 
                    onTaskAdded={() => {
                        fetchTasks();
                        fetchGoals(); // Refresh goals to show updated task counts
                    }}
                    editTask={editingTask}
                />
            )}
                </>
            )}
        </div>
    );
}

export default AppContent;
