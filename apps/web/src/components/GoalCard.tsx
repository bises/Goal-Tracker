import React, { useState } from 'react';
import { Goal } from '../types';
import { api } from '../api';
import { Trash2, Edit2, Link, Plus, Eye } from 'lucide-react';
import { EditGoalModal } from './EditGoalModal';
import { AddProgressModal } from './AddProgressModal';
import { BulkTaskModal } from './BulkTaskModal';
import LinkTasksModal from './LinkTasksModal';

interface GoalCardProps {
    goal: Goal;
    onUpdate: () => void;
    onViewDetails?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdate, onViewDetails }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [isCreatingTasks, setIsCreatingTasks] = useState(false);
    const [isLinkingTasks, setIsLinkingTasks] = useState(false);

    const handleDelete = async () => {
        if (confirm('Delete this goal?')) {
            await api.deleteGoal(goal.id);
            onUpdate();
        }
    }

    const percent = goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;

    return (
        <>
            <div className="glass-panel p-6 relative overflow-hidden">
                {/* Header with title and actions */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">{goal.title}</h3>
                        <div className="flex gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md border border-blue-500/30">
                                {goal.scope}
                            </span>
                            {goal.parent && (
                                <span className="inline-flex items-center px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md border border-blue-500/30">
                                    ↑ {goal.parent.title}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Progress Display */}
                <div className="mb-6">
                    <div className="text-sm text-slate-400 mb-2">
                        {goal.currentValue} {goal.targetValue ? `/ ${goal.targetValue}` : ''}
                    </div>
                    <div className="w-full bg-slate-700/30 rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <div className="text-right text-sm text-slate-300 mt-2">{percent.toFixed(0)}%</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                    {(goal.scope === 'MONTHLY' || goal.scope === 'YEARLY') && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsCreatingTasks(true); }}
                            className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-white rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                            title="Create Tasks"
                        >
                            + Tasks
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsLinkingTasks(true); }}
                        className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-white rounded-lg text-sm hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                        title="Link existing tasks"
                    >
                        <Link size={14} />
                        Link
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsLogging(true); }} 
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
                        title="Log Progress"
                    >
                        <Plus size={14} />
                        Log
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onViewDetails?.(); }}
                        className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700/70 transition-colors flex items-center gap-1"
                        title="View Details"
                    >
                        <Eye size={14} />
                        Details
                    </button>
                </div>
            </div>

            {isEditing && (
                <EditGoalModal
                    goal={goal}
                    onClose={() => setIsEditing(false)}
                    onUpdated={onUpdate}
                />
            )}

            {isLogging && (
                <AddProgressModal
                    goal={goal}
                    onClose={() => setIsLogging(false)}
                    onUpdated={onUpdate}
                />
            )}
            {isCreatingTasks && (
                <BulkTaskModal
                    parentGoal={goal}
                    onClose={() => setIsCreatingTasks(false)}
                    onCreated={onUpdate}
                />
            )}
            {isLinkingTasks && (
                <LinkTasksModal
                    isOpen={isLinkingTasks}
                    onClose={() => setIsLinkingTasks(false)}
                    goal={goal}
                    onTasksLinked={onUpdate}
                />
            )}
        </>
    );
};
