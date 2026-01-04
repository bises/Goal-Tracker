export type GoalScope = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'STANDALONE';

export interface Goal {
    id: string;
    title: string;
    description?: string;
    type: 'TOTAL_TARGET' | 'FREQUENCY' | 'HABIT' | 'COMPLETION';
    targetValue?: number;
    currentValue: number;
    frequencyTarget?: number;
    frequencyType?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    startDate: string;
    endDate?: string;
    stepSize?: number;
    customDataLabel?: string;

    // Hierarchy fields
    parentId?: string;
    parent?: Partial<Goal>;
    children?: Partial<Goal>[];

    // Scope and scheduling
    scope: GoalScope;
    scheduledDate?: string;
    isCompleted: boolean;
    completedAt?: string;

    progress: Progress[];
}

export interface Progress {
    id: string;
    value: number;
    date: string;
    note?: string;
    customData?: string;
}
