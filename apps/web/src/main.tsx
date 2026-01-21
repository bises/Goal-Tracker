import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import { TaskProvider } from './contexts/TaskContext';
import { GoalProvider } from './contexts/GoalContext';
import './styles/design-system.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoalProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </GoalProvider>
  </React.StrictMode>
);
