import React, { useState } from 'react';
import { api } from '../api';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

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
  const [activities, setActivities] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadActivities = async () => {
    if (hasLoaded || isLoading) return;
    try {
      setIsLoading(true);
      const data = await api.getGoalActivities(goalId);
      setActivities(data || []);
      setHasLoaded(true);
    } catch (e) {
      console.error('Failed to load activities', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel mb-8">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        onValueChange={(value) => {
          if (value === 'activities') {
            loadActivities();
          }
        }}
      >
        <AccordionItem value="activities" className="border-none">
          <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-white hover:no-underline hover:text-blue-400">
            {isLoading
              ? '↻ Loading Activities...'
              : `Activities ${hasLoaded && activities.length > 0 ? `(${activities.length})` : ''}`}
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            {!hasLoaded && !isLoading && (
              <p className="text-slate-400 text-center py-4">Expand to load activities</p>
            )}

            {hasLoaded && (
              <>
                {activities.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">
                      Recent Activity ({activities.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {[...activities]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((p) => (
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
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
