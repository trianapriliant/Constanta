import { z } from 'zod'

// Login schema
export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Register schema
export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['teacher', 'student']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// Profile update schema
export const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    avatar_url: z.string().url().optional().or(z.literal('')),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Class schemas
export const classSchema = z.object({
    title: z.string().min(1, 'Class title is required'),
    description: z.string().optional(),
    subject: z.string().optional(),
})

export type ClassFormData = z.infer<typeof classSchema>

export const joinClassSchema = z.object({
    classCode: z.string().length(6, 'Class code must be 6 characters'),
})

export type JoinClassFormData = z.infer<typeof joinClassSchema>

// Material schemas
export const materialSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content_md: z.string(),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(false),
})

export type MaterialFormData = z.infer<typeof materialSchema>

// Question schemas
export const mcqOptionSchema = z.object({
    id: z.string(),
    text_md: z.string(),
})

export const questionSchema = z.object({
    type: z.enum(['mcq_single', 'mcq_multi', 'true_false', 'numeric', 'short_text', 'essay', 'canvas']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.array(z.string()).default([]),
    points: z.number().min(1).default(1),
    prompt_md: z.string().min(1, 'Question prompt is required'),
    options_json: z.array(mcqOptionSchema).optional(),
    correct_answer_json: z.any(),
    explanation_md: z.string().optional(),
    numeric_tolerance: z.number().optional(),
})

export type QuestionFormData = z.infer<typeof questionSchema>

// Exam schemas
export const examSchema = z.object({
    title: z.string().min(1, 'Exam title is required'),
    description_md: z.string().optional(),
    duration_minutes: z.number().min(1).default(60),
    shuffle_questions: z.boolean().default(false),
    shuffle_options: z.boolean().default(false),
    max_attempts: z.number().min(1).default(1),
    passing_score: z.number().optional(),
    explanation_policy: z.enum(['after_submit', 'after_end', 'never']).default('after_submit'),
    start_at: z.string().optional(),
    end_at: z.string().optional(),
})

export type ExamFormData = z.infer<typeof examSchema>

// Answer schema
export const attemptAnswerSchema = z.object({
    question_id: z.string().uuid(),
    answer_json: z.any(),
    flagged: z.boolean().default(false),
})

export type AttemptAnswerFormData = z.infer<typeof attemptAnswerSchema>
