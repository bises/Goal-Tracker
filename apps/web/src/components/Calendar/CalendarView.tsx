import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Goal } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarView.css';
import { Modal } from '../Modal';
import { useTaskContext } from '../../contexts/TaskContext';
import { AddTaskToDateModal } from '../AddTaskToDateModal';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarViewProps {
    onTaskClick?: (task: Task) => void;
    onDateClick?: (date: Date) => void;
    onScheduled?: (taskId: string, date: Date | null) => void;
    reloadVersion?: number;
}

export function CalendarView({ onTaskClick, onDateClick, onScheduled, reloadVersion = 0 }: CalendarViewProps) {
    const { tasks: allTasks, scheduleTask } = useTaskContext();
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduling, setScheduling] = useState(false);
    const [sheetDate, setSheetDate] = useState<Date | null>(null);
    const [actionTask, setActionTask] = useState<Task | null>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;

    const handleTaskPress = (task: Task) => {
        console.log('Task pressed:', task);
        if (isMobile()) {
            setActionTask(task);
        } else {
            onTaskClick?.(task);
        }
    };

    const handleUnschedule = async () => {
        if (!actionTask) return;
        try {
            if (scheduling) return;
            setScheduling(true);
            await scheduleTask(actionTask.id, null);
            setActionTask(null);
        } finally {
            setScheduling(false);
        }
    };

    const getDateRange = () => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (viewMode === 'month') {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1, 0);
        } else if (viewMode === 'week') {
            const day = start.getDay();
            start.setDate(start.getDate() - day);
            end.setDate(start.getDate() + 6);
        } else {
            // day view
            end.setDate(end.getDate());
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { startDate: start, endDate: end };
    };

    // Filter tasks for the current date range
    const tasks = useMemo(() => {
        const { startDate, endDate } = getDateRange();
        return allTasks.filter(task => {
            if (!task.scheduledDate) return false;
            const taskDate = new Date(task.scheduledDate);
            return taskDate >= startDate && taskDate <= endDate;
        });
    }, [allTasks, currentDate, viewMode]);

    const navigatePrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleDayPress = (e: React.TouchEvent, date: Date) => {
        if (!isMobile()) return;
        
        // Start 500ms timer for long-press detection
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
            console.log('Long-press detected on date:', date);
            setSheetDate(date);
            longPressTimerRef.current = null;
        }, 500);
    };

    const handleDayRelease = (e: React.TouchEvent, date: Date) => {
        // Clear timer if touch ends before 500ms (wasn't a long-press)
        console.log('Touch released, clearing long-press timer');
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
            console.log('Short tap detected on date:', date);
            onDateClick?.(date);
        }
        // Prevent onClick from firing on mobile after touch events
        e.preventDefault();
    };

    const handleDayClick = (date: Date) => {
        // Desktop only: call onDateClick callback
        // Mobile: skip onDateClick to avoid overlap with sheet
        console.log('Day clicked:', date);
        if (!isMobile()) {
            onDateClick?.(date);
        }
    };

    const getTitle = () => {
        const options: Intl.DateTimeFormatOptions = viewMode === 'month' 
            ? { year: 'numeric', month: 'long' }
            : viewMode === 'week'
            ? { year: 'numeric', month: 'short', day: 'numeric' }
            : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        
        return currentDate.toLocaleDateString('en-US', options);
    };

    const getTasksForDate = (date: Date) => {
        return tasks.filter(task => {
            if (!task.scheduledDate) return false;
            const taskDate = new Date(task.scheduledDate);
            return taskDate.toDateString() === date.toDateString();
        });
    };

    const handleDayDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDayDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDayDrop = async (date: Date, e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        try {
            // Use context to schedule task (with caching)
            if (scheduling) return;
            setScheduling(true);
            await scheduleTask(taskId, date);
            onScheduled?.(taskId, date);
            // Context automatically updates, no need to reload
            setScheduling(false);
        } catch (error) {
            console.error('Failed to schedule task:', error);
            setScheduling(false);
        }
    };

    

    /**
     * Renders a calendar month view with days, tasks, and drag-and-drop functionality.
     * 
     * Generates a 6-week grid layout for the current month, displaying:
     * - Day numbers for each date
     * - Up to 3 task pills per day with a "+X more" indicator for additional tasks
     * - Empty cells for days outside the current month
     * - Visual highlighting for today's date
     * 
     * Supports interactive features:
     * - Click handlers on dates and tasks
     * - Drag-and-drop task rearrangement between days
     * - Drag over/leave visual feedback
     * 
     * @returns {JSX.Element} A calendar grid displaying the current month with task overlays
     */
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const weeks = [];
        let day = 1;
        
        for (let week = 0; week < 6; week++) {
            const days = [];
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                if ((week === 0 && dayOfWeek < firstDay) || day > daysInMonth) {
                    days.push(<div key={`empty-${week}-${dayOfWeek}`} className="calendar-day empty" />);
                } else {
                    const currentDay = day;
                    const date = new Date(year, month, currentDay);
                    const dayTasks = getTasksForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    days.push(
                        <div
                            key={`day-${day}`}
                            className={`calendar-day ${isToday ? 'today' : ''}`}
                            onDragOver={handleDayDragOver}
                            onDragLeave={handleDayDragLeave}
                            onDrop={(e) => handleDayDrop(date, e)}
                            onClick={() => handleDayClick(date)}
                            onTouchStart={(e) => handleDayPress(e, date)}
                            onTouchEnd={(e) => handleDayRelease(e, date)}
                        >
                            <div className="day-header">{currentDay}</div>
                            {/* Mobile: show total count only */}
                            {dayTasks.length > 0 && (
                                <div className="md:hidden mt-1">
                                    <span className="inline-flex items-center justify-center text-[11px] font-bold bg-cyan-500/90 text-black rounded-full px-1.5 py-0.5 shadow-[0_1px_4px_rgba(6,182,212,0.4)]">
                                        {dayTasks.length}
                                    </span>
                                </div>
                            )}
                            {/* Desktop: show first pill + hidden count badge */}
                            <div className="day-tasks hidden md:flex md:flex-col md:gap-1">
                                {dayTasks.slice(0, 1).map(task => (
                                    <div key={task.id} className="task-pill-wrapper">
                                        <div 
                                            className={`task-pill ${task.isCompleted ? 'completed' : ''}`}
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                e.dataTransfer.setData('taskId', task.id);
                                            }}
                                        >
                                            {task.title}
                                        </div>
                                        <div className="task-tooltip">{task.title}</div>
                                    </div>
                                ))}
                                {dayTasks.length > 1 && (
                                    <div className="hidden-tasks-badge">
                                        +{dayTasks.length - 1}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                    day++;
                }
            }
            weeks.push(
                <div key={`week-${week}`} className="calendar-week">
                    {days}
                </div>
            );
            
            if (day > daysInMonth) break;
        }
        
        return (
            <div className="calendar-month-view">
                <div className="calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday-header">{day}</div>
                    ))}
                </div>
                {weeks}
            </div>
        );
    };

    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            days.push(
                <div 
                    key={i} 
                    className={`week-day ${isToday ? 'today' : ''}`}
                    onDragOver={handleDayDragOver}
                    onDragLeave={handleDayDragLeave}
                    onDrop={(e) => handleDayDrop(date, e)}
                    onClick={() => handleDayClick(date)}
                    onTouchStart={(e) => handleDayPress(e, date)}
                    onTouchEnd={(e) => handleDayRelease(e, date)}
                >
                    <div className="day-header">
                        <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="day-number">{date.getDate()}</div>
                    </div>
                    <div className="day-tasks-list">
                        {dayTasks.map(task => (
                            <div
                                key={task.id}
                                className={`task-card ${task.isCompleted ? 'completed' : ''}`}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('taskId', task.id);
                                }}>
                                <div className="task-title">{task.title}</div>
                                {task.description && (
                                    <div className="task-description">{task.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        
        return <div className="calendar-week-view">{days}</div>;
    };

    const renderDayView = () => {
        const dayTasks = getTasksForDate(currentDate);
        
        return (
            <div 
                className="calendar-day-view"
                onDragOver={handleDayDragOver}
                onDragLeave={handleDayDragLeave}
                onDrop={(e) => handleDayDrop(currentDate, e)}
            >
                <div className="day-tasks-detail">
                    {dayTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
                            No tasks scheduled for this day
                        </div>
                    ) : (
                        dayTasks.map(task => (
                            <div
                                key={task.id}
                                className={`task-card-detailed ${task.isCompleted ? 'completed' : ''}`}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('taskId', task.id);
                                }}
                                onClick={() => handleTaskPress(task)}
                            >
                                <div className="task-title">{task.title}</div>
                                {task.description && (
                                    <div className="task-description">{task.description}</div>
                                )}
                                <div className="task-meta">
                                    <span>Size: {task.size} day(s)</span>
                                    {task.goalTasks && task.goalTasks.length > 0 && (
                                        <span className="task-goals">
                                            {task.goalTasks.map(gt => gt.goal?.title).join(', ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
        <div className="calendar-container">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button onClick={navigatePrevious} className="icon-btn">
                        <ChevronLeft size={20} />
                    </button>
                    <h2>{getTitle()}</h2>
                    <button onClick={navigateNext} className="icon-btn">
                        <ChevronRight size={20} />
                    </button>
                </div>
                
                <div className="calendar-controls">
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'month' ? 'active' : ''}
                            onClick={() => setViewMode('month')}
                        >
                            Month
                        </button>
                        <button
                            className={viewMode === 'week' ? 'active' : ''}
                            onClick={() => setViewMode('week')}
                        >
                            Week
                        </button>
                        <button
                            className={viewMode === 'day' ? 'active' : ''}
                            onClick={() => setViewMode('day')}
                        >
                            Day
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
        </div>

        <AddTaskToDateModal 
            isOpen={!!sheetDate} 
            date={sheetDate} 
            onClose={() => setSheetDate(null)}
            onCreateNew={(date) => onDateClick?.(date)} 
        />
        
        {actionTask && (
            <Modal
                isOpen={true}
                onClose={() => setActionTask(null)}
                title={actionTask.title}
                maxWidth="420px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="primary-btn" onClick={() => { onTaskClick?.(actionTask); setActionTask(null); }}>
                        View / Edit
                    </button>
                    <button className="secondary-btn" onClick={handleUnschedule} disabled={scheduling}>
                        {scheduling ? 'Unscheduling...' : 'Unschedule (make unscheduled)'}
                    </button>
                    <button className="icon-btn" onClick={() => setActionTask(null)}>Close</button>
                </div>
            </Modal>
        )}
        </>
    );
}
