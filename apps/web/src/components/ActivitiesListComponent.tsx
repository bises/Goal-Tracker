import React, { useState } from 'react';
import { api } from '../api';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface ActivitiesListComponentProps {
    goalId: string;
}

interface ProgressEntry {
    id: string;
    date: string;
    value: number;
    note?: string;
    customData?: string;
}

export const ActivitiesListComponent: React.FC<ActivitiesListComponentProps> = ({ goalId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activities, setActivities] = useState<ProgressEntry[]>([]);

    const loadActivities = async () => {
        if (isExpanded || isLoading) return;
        try {
            setIsLoading(true);
            const data = await api.getGoalActivities(goalId);
            setActivities(data || []);
            setIsExpanded(true);
        } catch (e) {
            console.error("Failed to load activities", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isExpanded) {
        return (
            <div className="glass-panel p-6 mb-8">
                <button
                    onClick={loadActivities}
                    disabled={isLoading}
                    className="text-white font-medium text-lg hover:text-blue-400 transition-colors"
                >
                    {isLoading ? '↻ Loading activities...' : '⊕ Load Activities'}
                </button>
            </div>
        );
    }

    const chartData = [...activities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(p => ({
            date: new Date(p.date).toLocaleDateString(),
            value: p.value,
            customData: p.customData
        }));

    return (
        <div className="glass-panel p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Activities</h2>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Collapse"
                >
                    ⊖
                </button>
            </div>

            {/* Progress History Chart 
            {chartData.length > 1 && (
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Progress History</h3>
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`gradient-activities-${goalId}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill={`url(#gradient-activities-${goalId})`}
                                    strokeWidth={2}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: 'white' }}
                                    formatter={(val: any, name: any, props: any) => [val, props.payload.customData || 'Value']}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )} */}

            {/* Activity Log */}
            {activities.length > 0 ? (
                <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Activity ({activities.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {[...activities]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(p => (
                                <div
                                    key={p.id}
                                    className="flex justify-between items-center bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                                >
                                    <div>
                                        <div className="text-white font-medium">
                                            {p.customData || (p.value > 0 ? `+${p.value}` : p.value)}
                                        </div>
                                        {p.note && <p className="text-slate-400 text-sm mt-1">{p.note}</p>}
                                    </div>
                                    <span className="text-slate-400 text-sm">
                                        {new Date(p.date).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            ) : (
                <p className="text-slate-400 text-center py-4">No activities recorded yet</p>
            )}
        </div>
    );
};
