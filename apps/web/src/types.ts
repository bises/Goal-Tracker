export interface Goal {
    id: string;
    title: string;
    description?: string;
    type: 'TOTAL_TARGET' | 'FREQUENCY' | 'HABIT';
    targetValue?: number;
    currentValue: number;
    frequencyTarget?: number;
    frequencyType?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    startDate: string;
    endDate?: string;
    progress: Progress[];
}

export interface Progress {
    id: string;
    value: number;
    date: string;
    note?: string;
}
