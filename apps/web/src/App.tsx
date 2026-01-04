import React, { useEffect, useState } from 'react';
import { api } from './api';
import { Goal } from './types';
import { GoalCard } from './components/GoalCard';
import { AddGoalModal } from './components/AddGoalModal';
import { Plus } from 'lucide-react';

function App() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadGoals = async () => {
        try {
            const data = await api.fetchGoals();
            setGoals(data);
        } catch (e) {
            console.error("Failed to load goals", e);
        }
    };

    useEffect(() => {
        loadGoals();
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', width: '100%' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Goal Tracker</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>Track your progress and achieve your dreams.</p>
                </div>
                <button className="primary-btn" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} />
                    <span>New Goal</span>
                </button>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} onUpdate={loadGoals} />
                ))}
            </div>

            {goals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
                    <p>No goals yet. Create one to get started!</p>
                </div>
            )}

            {isModalOpen && <AddGoalModal onClose={() => setIsModalOpen(false)} onAdded={loadGoals} />}
        </div>
    );
}

export default App;
