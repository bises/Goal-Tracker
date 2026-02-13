import { Plus, RefreshCw, ServerOff, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GoalCard } from '../components/GoalCard';
import { GoalEditSheet } from '../components/GoalEditSheet';
import { SquircleCard } from '../components/SquircleCard';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';
import { useGoalContext } from '../contexts/GoalContext';
import { GoalScope } from '../types';

type ScopeFilter = 'ALL' | GoalScope;

const SCOPE_OPTIONS: { value: ScopeFilter; label: string; icon: string }[] = [
  { value: 'ALL', label: 'All Goals', icon: '🌟' },
  { value: 'YEARLY', label: 'Yearly', icon: '📅' },
  { value: 'MONTHLY', label: 'Monthly', icon: '🗓️' },
  { value: 'WEEKLY', label: 'Weekly', icon: '📆' },
  { value: 'STANDALONE', label: 'Standalone', icon: '🎯' },
];

export const GoalsPage = () => {
  const { goals, loading, error, fetchGoals } = useGoalContext();
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await fetchGoals();
    setIsRetrying(false);
  };

  const filteredGoals = useMemo(() => {
    let result = goals;

    // Filter by scope
    if (scopeFilter !== 'ALL') {
      result = result.filter((g) => g.scope === scopeFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [goals, scopeFilter, searchQuery]);

  // Group goals by scope for the "ALL" view
  const groupedGoals = useMemo(() => {
    if (scopeFilter !== 'ALL') return null;

    const groups: { scope: GoalScope; label: string; icon: string; goals: typeof goals }[] = [];
    const scopeOrder: GoalScope[] = ['YEARLY', 'MONTHLY', 'WEEKLY', 'STANDALONE'];

    for (const scope of scopeOrder) {
      const scopeGoals = filteredGoals.filter((g) => g.scope === scope);
      if (scopeGoals.length > 0) {
        const option = SCOPE_OPTIONS.find((o) => o.value === scope);
        groups.push({
          scope,
          label: option?.label || scope,
          icon: option?.icon || '🎯',
          goals: scopeGoals,
        });
      }
    }

    return groups;
  }, [filteredGoals, scopeFilter]);

  // Scope counts for badges
  const scopeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: goals.length };
    for (const g of goals) {
      counts[g.scope] = (counts[g.scope] || 0) + 1;
    }
    return counts;
  }, [goals]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-4">
      {/* Error Alert */}
      {error && (
        <div className="px-4">
          <Alert variant="destructive" className="rounded-2xl border-2">
            <ServerOff className="h-5 w-5" />
            <AlertTitle className="font-display">Cannot Connect to Database</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>The database is not running. Please start it using:</p>
              <code className="block p-2 rounded-lg bg-black/5 text-xs font-mono">
                docker-compose up -d postgres
              </code>
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                size="sm"
                className="mt-2"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry Connection'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="px-4 flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold font-display mb-2"
            style={{ color: 'var(--deep-charcoal)' }}
          >
            Goals
          </h1>
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            {goals.length} {goals.length === 1 ? 'goal' : 'goals'} in total
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm text-white transition-all hover:shadow-lg active:scale-95"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: '0 4px 16px rgba(255, 140, 66, 0.3)',
          }}
        >
          <Plus size={18} />
          New Goal
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-4 space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '2px solid rgba(255, 140, 66, 0.15)',
                color: 'var(--deep-charcoal)',
              }}
            />
          </div>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2.5 rounded-2xl transition-all"
            style={{
              background: showFilters ? 'var(--energizing-orange)' : 'rgba(255, 140, 66, 0.1)',
              color: showFilters ? 'white' : 'var(--energizing-orange)',
              border: '2px solid rgba(255, 140, 66, 0.15)',
            }}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Scope Filter Chips */}
        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            {SCOPE_OPTIONS.map((option) => {
              const isActive = scopeFilter === option.value;
              const count = scopeCounts[option.value] || 0;
              return (
                <button
                  key={option.value}
                  onClick={() => setScopeFilter(option.value)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: isActive ? 'var(--energizing-orange)' : 'rgba(255, 255, 255, 0.7)',
                    color: isActive ? 'white' : 'var(--deep-charcoal)',
                    border: isActive
                      ? '2px solid var(--energizing-orange)'
                      : '2px solid rgba(255, 140, 66, 0.15)',
                  }}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                  {count > 0 && (
                    <span
                      className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: isActive
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(255, 140, 66, 0.15)',
                        color: isActive ? 'white' : 'var(--energizing-orange)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <SquircleCard className="p-8 text-center">
          <Spinner
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--energizing-orange)' }}
          />
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            Loading goals...
          </p>
        </SquircleCard>
      )}

      {/* Goals List - Grouped View */}
      {!loading && groupedGoals && groupedGoals.length > 0 && (
        <div className="space-y-8">
          {groupedGoals.map((group) => (
            <div key={group.scope}>
              {/* Section Header */}
              <div className="px-4 flex items-center gap-2.5 mb-3">
                <span className="text-xl">{group.icon}</span>
                <h2
                  className="text-lg font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {group.label}
                </h2>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(255, 140, 66, 0.1)',
                    color: 'var(--energizing-orange)',
                  }}
                >
                  {group.goals.length}
                </span>
              </div>
              {/* Goal Cards */}
              <div className="space-y-3">
                {group.goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals List - Filtered View (single scope) */}
      {!loading && !groupedGoals && filteredGoals.length > 0 && (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGoals.length === 0 && (
        <SquircleCard className="p-10 text-center">
          <div className="text-6xl mb-4">{searchQuery ? '🔍' : '🎯'}</div>
          <h3
            className="text-xl font-bold font-display mb-2"
            style={{ color: 'var(--deep-charcoal)' }}
          >
            {searchQuery ? 'No goals found' : 'No goals yet'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--warm-gray)' }}>
            {searchQuery
              ? `No goals match "${searchQuery}"`
              : 'Set your first goal and start tracking your progress!'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{
                background: 'var(--gradient-primary)',
                boxShadow: '0 4px 16px rgba(255, 140, 66, 0.3)',
              }}
            >
              <Plus size={18} />
              Create Your First Goal
            </button>
          )}
        </SquircleCard>
      )}

      {/* Add Goal Sheet */}
      <GoalEditSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={() => {
          fetchGoals();
          setShowAddModal(false);
        }}
      />
    </div>
  );
};
