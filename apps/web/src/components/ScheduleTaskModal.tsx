import React, { useState } from 'react';
import { Task } from '../types';
import { Modal } from './Modal';

interface ScheduleTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (taskId: string, date: Date) => void;
}

export function ScheduleTaskModal({ task, isOpen, onClose, onSchedule }: ScheduleTaskModalProps) {
  const [selectedDate, setSelectedDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task && selectedDate) {
      // The selectedDate from input is in 'YYYY-MM-DD' format, which is parsed as UTC.
      // To treat it as local date, we create a new Date object from its components.
      const dateParts = selectedDate.split('-').map(Number);
      const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      onSchedule(task.id, localDate);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule "${task.title}"`}>
      <form onSubmit={handleSubmit}>
        <div className="p-1">
          <label htmlFor="schedule-date" className="block text-sm font-medium text-slate-300 mb-2">
            Choose a date
          </label>
          <input
            type="date"
            id="schedule-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex justify-end mt-4">
          <button type="submit" className="primary-btn">
            Schedule Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
