import { z } from 'zod';

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const TaskCategoryEnum = z.enum([
  'WORK',
  'PERSONAL',
  'HEALTH',
  'LEARNING',
  'FINANCE',
  'SOCIAL',
  'HOUSEHOLD',
  'OTHER',
]);

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeStringRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  size: z
    .union([z.number().int().min(1), z.string().regex(/^\d+$/).transform(Number)])
    .optional()
    .default(1),
  scheduledDate: z
    .string()
    .regex(dateStringRegex, 'scheduledDate must be YYYY-MM-DD')
    .optional()
    .nullable(),
  goalIds: z.array(z.string().min(1)).optional().default([]),
  parentTaskId: z
    .string()
    .min(1)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  customData: z.any().optional().nullable(),
  priority: TaskPriorityEnum.optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  category: TaskCategoryEnum.optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  scheduledTime: z
    .string()
    .regex(timeStringRegex, 'scheduledTime must be HH:MM or HH:MM:SS')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  estimatedDurationMinutes: z.number().int().min(0).optional().nullable(),
  estimatedCompletionDate: z
    .string()
    .regex(dateStringRegex, 'estimatedCompletionDate must be YYYY-MM-DD')
    .optional()
    .nullable(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .optional(),
  description: z.string().optional().nullable(),
  size: z
    .union([z.number().int().min(1), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  scheduledDate: z
    .string()
    .regex(dateStringRegex, 'scheduledDate must be YYYY-MM-DD')
    .optional()
    .nullable(),
  parentTaskId: z
    .string()
    .min(1)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  customData: z.any().optional().nullable(),
  isCompleted: z.boolean().optional(),
  priority: TaskPriorityEnum.optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  category: TaskCategoryEnum.optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  scheduledTime: z
    .string()
    .regex(timeStringRegex, 'scheduledTime must be HH:MM or HH:MM:SS')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  estimatedDurationMinutes: z.number().int().min(0).optional().nullable(),
  estimatedCompletionDate: z
    .string()
    .regex(dateStringRegex, 'estimatedCompletionDate must be YYYY-MM-DD')
    .optional()
    .nullable(),
});

export const setTaskCompletionSchema = z.object({
  isCompleted: z.boolean({
    required_error: 'Field isCompleted (boolean) is required',
    invalid_type_error: 'Field isCompleted (boolean) is required',
  }),
});

export const linkGoalSchema = z.object({
  goalId: z
    .string({ required_error: 'goalId is required' })
    .min(1, 'goalId is required'),
});

export const unlinkGoalSchema = z.object({
  goalId: z
    .string({ required_error: 'goalId is required' })
    .min(1, 'goalId is required'),
});

export const scheduleTaskSchema = z.object({
  scheduledDate: z
    .string()
    .regex(dateStringRegex, 'scheduledDate must be YYYY-MM-DD')
    .optional()
    .nullable(),
});

export const deleteGoalIdsSchema = z.object({
  goalIds: z.array(z.string().min(1)).optional().default([]),
});

export const taskIdParamSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
});

export const scheduledDateParamSchema = z.object({
  date: z.string().min(1, 'Date parameter is required'),
});

export const listTasksQuerySchema = z
  .object({
    status: z.enum(['completed', 'pending', 'all']).optional(),
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1))
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM').optional(),
    date: z.string().regex(dateStringRegex, 'Must be YYYY-MM-DD').optional(),
    unscheduled: z.enum(['true', 'false']).optional(),
    goalId: z.string().min(1).optional(),
  })
  .passthrough();
