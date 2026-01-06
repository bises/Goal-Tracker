Separate Tasks from Goals - Implementation Plan
Overview
Refactor the system to treat Tasks and Goals as separate entities with distinct database tables, APIs, and UI components.

Current State vs. Desired State
Current (Everything is a Goal)
Single 
Goal
 table with type field (COMPLETION, TOTAL_TARGET, FREQUENCY)
Confusing UI - tasks show goal-specific fields
Mixed mental model
Desired (Separate Tasks and Goals)
Goals: Long-term, measurable objectives (Yearly, Monthly, Weekly)
Tasks: Short-term, completion-based items (Daily only)
Clear separation in database, API, and UI
Proposed Schema Changes
New 
Task
 Model
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  
  // Size estimation (in days, default 1)
  size        Int      @default(1)
  
  // Completion tracking
  isCompleted Boolean  @default(false)
  completedAt DateTime?
  
  // Scheduling
  scheduledDate DateTime?
  
  // Linking to goals
  goalId      String?
  goal        Goal?    @relation(fields: [goalId], references: [id], onDelete: SetNull)
  
  // Hierarchy (tasks can have subtasks)
  parentTaskId String?
  parentTask   Task?    @relation("TaskHierarchy", fields: [parentTaskId], references: [id], onDelete: Cascade)
  subTasks     Task[]   @relation("TaskHierarchy")
  
  // Metadata
  customData  String?  // For logging specific info when completing
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
Size field:

Default: 1 (assumes 1 day for completion)
Can be set to 2, 3, etc. for larger tasks
Helps with capacity planning and sprint planning
Example: "Implement authentication" might be size 3 (3 days)
Updated 
Goal
 Model
model Goal {
  id          String   @id @default(cuid())
  title       String
  description String?
  
  // Goal type (remove COMPLETION)
  type        GoalType // TOTAL_TARGET, FREQUENCY, HABIT only
  
  // Progress tracking
  targetValue     Float?
  currentValue    Float    @default(0)
  stepSize        Float    @default(1)
  frequencyTarget Int?
  frequencyType   FrequencyType?
  
  // Scope (remove DAILY)
  scope       GoalScope @default(STANDALONE) // YEARLY, MONTHLY, WEEKLY, STANDALONE only
  
  // Dates
  startDate   DateTime @default(now())
  endDate     DateTime?
  
  // Hierarchy
  parentId    String?
  parent      Goal?    @relation("GoalHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Goal[]   @relation("GoalHierarchy")
  
  // Linked tasks
  tasks       Task[]
  
  // Metadata
  customDataLabel String?
  
  // Progress history
  progress    Progress[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
enum GoalType {
  TOTAL_TARGET
  FREQUENCY
  HABIT
  // COMPLETION removed
}
enum GoalScope {
  YEARLY
  MONTHLY
  WEEKLY
  STANDALONE
  // DAILY removed
}
API Changes
New Task Endpoints
apps/api/src/routes/tasks.ts (NEW)
// GET /api/tasks - Get all tasks
// GET /api/tasks/:id - Get task by ID
// POST /api/tasks - Create task
// PUT /api/tasks/:id - Update task
// DELETE /api/tasks/:id - Delete task
// POST /api/tasks/:id/complete - Toggle completion
// GET /api/tasks/scheduled/:date - Get tasks for date
// GET /api/tasks/unscheduled - Get unscheduled tasks
// POST /api/goals/:goalId/bulk-tasks - Bulk create tasks for goal
Updated Goal Endpoints
apps/api/src/routes/goals.ts
Remove COMPLETION type handling
Remove DAILY scope handling
Add include: { tasks } to fetch linked tasks
Update bulk task creation to use new Task model
Frontend Changes
New Types
apps/web/src/types.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  scheduledDate?: string;
  goalId?: string;
  goal?: Partial<Goal>;
  parentTaskId?: string;
  parentTask?: Partial<Task>;
  subTasks?: Partial<Task>[];
  customData?: string;
  createdAt: string;
  updatedAt: string;
}
// Update Goal interface - remove COMPLETION type, DAILY scope
export interface Goal {
  // ... existing fields ...
  type: 'TOTAL_TARGET' | 'FREQUENCY' | 'HABIT'; // Remove COMPLETION
  scope: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'STANDALONE'; // Remove DAILY
  tasks?: Partial<Task>[]; // Add linked tasks
}
New API Service
apps/web/src/api.ts
export const taskApi = {
  fetchTasks: async (): Promise<Task[]> => { ... },
  createTask: async (task: Partial<Task>): Promise<Task> => { ... },
  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => { ... },
  deleteTask: async (id: string) => { ... },
  toggleComplete: async (id: string) => { ... },
  getScheduledTasks: async (date: string) => { ... },
  getUnscheduledTasks: async () => { ... },
};
New Components
apps/web/src/components/TaskCard.tsx (NEW)
Simple card for tasks:

Large checkbox
Title (with strikethrough when complete)
Description
Parent goal badge (if linked)
Scheduled date
Edit/Delete buttons
apps/web/src/components/AddTaskModal.tsx (NEW)
Modal for creating tasks:

Title (required)
Description (optional)
Link to goal (optional dropdown)
Scheduled date (optional)
Custom data label (optional)
apps/web/src/components/TaskList.tsx (NEW)
List view for tasks:

Filter by completion status
Filter by goal
Filter by date
Sort options
Updated Components
apps/web/src/components/GoalCard.tsx
Remove COMPLETION type handling
Show linked tasks count
"View Tasks" button to see tasks for this goal
apps/web/src/components/BulkTaskModal.tsx
Update to use Task API instead of Goal API
Same naming pattern functionality
Migration Strategy
Data Migration
We need to migrate existing COMPLETION type goals to tasks:

// Migration script
async function migrateCompletionGoalsToTasks() {
  const completionGoals = await prisma.goal.findMany({
    where: { type: 'COMPLETION' }
  });
  
  for (const goal of completionGoals) {
    await prisma.task.create({
      data: {
        title: goal.title,
        description: goal.description,
        isCompleted: goal.isCompleted,
        completedAt: goal.completedAt,
        scheduledDate: goal.scheduledDate,
        goalId: goal.parentId, // Link to parent goal
        customData: goal.customDataLabel,
      }
    });
  }
  
  // Delete old COMPLETION goals
  await prisma.goal.deleteMany({
    where: { type: 'COMPLETION' }
  });
}
Implementation Steps
Schema & Migration

Create Task model in schema
Update Goal model (remove COMPLETION, DAILY)
Run migration
Run data migration script
Backend

Create tasks.ts routes
Update 
goals.ts
 routes
Test all endpoints
Frontend Types & API

Add Task interface
Update Goal interface
Create taskApi service
Frontend Components

Create TaskCard
Create AddTaskModal
Create TaskList
Update GoalCard
Update BulkTaskModal
Main App

Add Tasks page/view
Update navigation
Test full workflow
Verification Plan
Manual Testing
Create a monthly goal "Read Atomic Habits"
Use bulk task creation to create 15 chapter tasks
Verify tasks are separate entities linked to goal
Schedule some tasks for today
Mark tasks complete and verify goal progress updates
Delete goal and verify tasks are unlinked (not deleted)
Edge Cases
Task without goal link
Goal with no tasks
Completing all tasks for a goal
Deleting a goal with tasks