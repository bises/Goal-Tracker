import React, { useEffect, useState } from 'react';
import { api, taskApi } from './api';
import { Goal, Task } from './types';
import { GoalCard } from './components/GoalCard';
import { AddGoalModal } from './components/AddGoalModal';
import TaskCard from './components/TaskCard';
import AddTaskModal from './components/AddTaskModal';
import { GoalDetailsPage } from './pages/GoalDetailsPage';
import { Plus } from 'lucide-react';

type ViewMode = 'goals' | 'tasks';
type PageMode = 'list' | 'details';

function App() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('goals');
    const [pageMode, setPageMode] = useState<PageMode>('list');
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const loadGoals = async () => {
        try {
            const data = await api.fetchGoals();
            setGoals(data);
        } catch (e) {
            console.error("Failed to load goals", e);
        }
    };

    const loadTasks = async () => {
        try {
            const data = await taskApi.fetchTasks();
            setTasks(data);
        } catch (e) {
            console.error("Failed to load tasks", e);
        }
    };

    useEffect(() => {
        loadGoals();
        loadTasks();
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
        setSelectedGoalId(goalId);
        setPageMode('details');
    };

    const handleBackToList = () => {
        setPageMode('list');
        setSelectedGoalId(null);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', width: '100%' }}>
            {pageMode === 'details' && selectedGoalId ? (
                <GoalDetailsPage 
                    goalId={selectedGoalId}
                    onBack={handleBackToList}
                    onUpdate={loadGoals}
                />
            ) : (
                <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Goal Tracker</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>Track your progress and achieve your dreams.</p>
                </div>
                <button 
                    className="primary-btn" 
                    onClick={() => viewMode === 'goals' ? setIsGoalModalOpen(true) : setIsTaskModalOpen(true)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={20} />
                    <span>New {viewMode === 'goals' ? 'Goal' : 'Task'}</span>
                </button>
            </header>

            {/* View Mode Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '32px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '12px'
            }}>
                <button
                    onClick={() => setViewMode('goals')}
                    style={{
                        background: viewMode === 'goals' ? 'var(--color-primary)' : 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '8px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: viewMode === 'goals' ? 600 : 400
                    }}
                >
                    Goals ({goals.length})
                </button>
                <button
                    onClick={() => setViewMode('tasks')}
                    style={{
                        background: viewMode === 'tasks' ? 'var(--color-primary)' : 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '8px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: viewMode === 'tasks' ? 600 : 400
                    }}
                >
                    Tasks ({tasks.length})
                </button>
            </div>

            {/* Goals View */}
            {viewMode === 'goals' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {goals.map(goal => (
                        <div key={goal.id} onClick={() => handleGoalDetailsClick(goal.id)} style={{ cursor: 'pointer' }}>
                            <GoalCard goal={goal} onUpdate={loadGoals} />
                        </div>
                    ))}
                </div>
            )}

            {/* Tasks View */}
            {viewMode === 'tasks' && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {tasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            onUpdate={loadTasks} 
                            onEdit={handleEditTask}
                        />
                    ))}
                </div>
            )}

            {/* Empty States */}
            {viewMode === 'goals' && goals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
                    <p>No goals yet. Create one to get started!</p>
                </div>
            )}

            {viewMode === 'tasks' && tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
                    <p>No tasks yet. Create one to get started!</p>
                </div>
            )}

            {isGoalModalOpen && <AddGoalModal onClose={() => setIsGoalModalOpen(false)} onAdded={loadGoals} />}
            {isTaskModalOpen && (
                <AddTaskModal 
                    isOpen={isTaskModalOpen}
                    onClose={handleCloseTaskModal} 
                    onTaskAdded={() => {
                        loadTasks();
                        loadGoals(); // Refresh goals to show updated task counts
                    }}
                    editTask={editingTask}
                />
            )}
                </>
            )}
        </div>
    );
}

export default App;
