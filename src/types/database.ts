export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'teacher' | 'student'
export type ClassMemberRole = 'owner' | 'teacher' | 'student'
export type ClassMemberStatus = 'active' | 'removed' | 'pending'
export type QuestionType = 'mcq_single' | 'mcq_multi' | 'true_false' | 'numeric' | 'short_text' | 'essay' | 'canvas'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded'
export type ExplanationPolicy = 'after_submit' | 'after_end' | 'never'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    name: string
                    role: UserRole
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    name: string
                    role?: UserRole
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    role?: UserRole
                    avatar_url?: string | null
                    updated_at?: string
                }
            }
            classes: {
                Row: {
                    id: string
                    created_by: string
                    title: string
                    description: string | null
                    subject: string | null
                    class_code: string
                    cover_image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_by: string
                    title: string
                    description?: string | null
                    subject?: string | null
                    class_code?: string
                    cover_image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    title?: string
                    description?: string | null
                    subject?: string | null
                    cover_image_url?: string | null
                    updated_at?: string
                }
            }
            class_members: {
                Row: {
                    id: string
                    class_id: string
                    user_id: string
                    role: ClassMemberRole
                    status: ClassMemberStatus
                    joined_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    user_id: string
                    role?: ClassMemberRole
                    status?: ClassMemberStatus
                    joined_at?: string
                }
                Update: {
                    role?: ClassMemberRole
                    status?: ClassMemberStatus
                }
            }
            materials: {
                Row: {
                    id: string
                    class_id: string
                    created_by: string
                    title: string
                    content_md: string
                    tags: string[]
                    chapter: string | null
                    topic: string | null
                    category: string | null
                    published: boolean
                    published_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    created_by: string
                    title: string
                    content_md: string
                    tags?: string[]
                    chapter?: string | null
                    topic?: string | null
                    category?: string | null
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    title?: string
                    content_md?: string
                    tags?: string[]
                    chapter?: string | null
                    topic?: string | null
                    category?: string | null
                    published?: boolean
                    published_at?: string | null
                    updated_at?: string
                }
            }
            material_attachments: {
                Row: {
                    id: string
                    material_id: string
                    storage_path: string
                    file_name: string
                    mime_type: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    material_id: string
                    storage_path: string
                    file_name: string
                    mime_type: string
                    created_at?: string
                }
                Update: {
                    storage_path?: string
                    file_name?: string
                    mime_type?: string
                }
            }
            questions: {
                Row: {
                    id: string
                    class_id: string
                    created_by: string
                    type: QuestionType
                    difficulty: Difficulty
                    tags: string[]
                    points: number
                    prompt_md: string
                    options_json: Json | null
                    correct_answer_json: Json
                    explanation_md: string | null
                    numeric_tolerance: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    created_by: string
                    type: QuestionType
                    difficulty?: Difficulty
                    tags?: string[]
                    points?: number
                    prompt_md: string
                    options_json?: Json | null
                    correct_answer_json: Json
                    explanation_md?: string | null
                    numeric_tolerance?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    type?: QuestionType
                    difficulty?: Difficulty
                    tags?: string[]
                    points?: number
                    prompt_md?: string
                    options_json?: Json | null
                    correct_answer_json?: Json
                    explanation_md?: string | null
                    numeric_tolerance?: number | null
                    updated_at?: string
                }
            }
            exams: {
                Row: {
                    id: string
                    class_id: string
                    created_by: string
                    title: string
                    description_md: string | null
                    duration_minutes: number
                    shuffle_questions: boolean
                    shuffle_options: boolean
                    max_attempts: number
                    passing_score: number | null
                    explanation_policy: ExplanationPolicy
                    start_at: string | null
                    end_at: string | null
                    published: boolean
                    published_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    created_by: string
                    title: string
                    description_md?: string | null
                    duration_minutes?: number
                    shuffle_questions?: boolean
                    shuffle_options?: boolean
                    max_attempts?: number
                    passing_score?: number | null
                    explanation_policy?: ExplanationPolicy
                    start_at?: string | null
                    end_at?: string | null
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    title?: string
                    description_md?: string | null
                    duration_minutes?: number
                    shuffle_questions?: boolean
                    shuffle_options?: boolean
                    max_attempts?: number
                    passing_score?: number | null
                    explanation_policy?: ExplanationPolicy
                    start_at?: string | null
                    end_at?: string | null
                    published?: boolean
                    published_at?: string | null
                    updated_at?: string
                }
            }
            exam_questions: {
                Row: {
                    id: string
                    exam_id: string
                    question_id: string
                    order_index: number
                    points: number
                }
                Insert: {
                    id?: string
                    exam_id: string
                    question_id: string
                    order_index: number
                    points: number
                }
                Update: {
                    order_index?: number
                    points?: number
                }
            }
            attempts: {
                Row: {
                    id: string
                    exam_id: string
                    student_id: string
                    status: AttemptStatus
                    started_at: string
                    submitted_at: string | null
                    score: number | null
                    max_score: number | null
                    time_taken_seconds: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    exam_id: string
                    student_id: string
                    status?: AttemptStatus
                    started_at?: string
                    submitted_at?: string | null
                    score?: number | null
                    max_score?: number | null
                    time_taken_seconds?: number | null
                    created_at?: string
                }
                Update: {
                    status?: AttemptStatus
                    submitted_at?: string | null
                    score?: number | null
                    max_score?: number | null
                    time_taken_seconds?: number | null
                }
            }
            attempt_answers: {
                Row: {
                    id: string
                    attempt_id: string
                    question_id: string
                    answer_json: Json | null
                    is_correct: boolean | null
                    points_awarded: number | null
                    flagged: boolean
                    updated_at: string
                }
                Insert: {
                    id?: string
                    attempt_id: string
                    question_id: string
                    answer_json?: Json | null
                    is_correct?: boolean | null
                    points_awarded?: number | null
                    flagged?: boolean
                    updated_at?: string
                }
                Update: {
                    answer_json?: Json | null
                    is_correct?: boolean | null
                    points_awarded?: number | null
                    flagged?: boolean
                    updated_at?: string
                }
            }
            audit_events: {
                Row: {
                    id: string
                    class_id: string | null
                    exam_id: string | null
                    attempt_id: string | null
                    user_id: string
                    event_type: string
                    payload: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    class_id?: string | null
                    exam_id?: string | null
                    attempt_id?: string | null
                    user_id: string
                    event_type: string
                    payload?: Json | null
                    created_at?: string
                }
                Update: never
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            generate_class_code: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            user_role: UserRole
            class_member_role: ClassMemberRole
            class_member_status: ClassMemberStatus
            question_type: QuestionType
            difficulty: Difficulty
            attempt_status: AttemptStatus
            explanation_policy: ExplanationPolicy
        }
    }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type ClassMember = Database['public']['Tables']['class_members']['Row']
export type Material = Database['public']['Tables']['materials']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Exam = Database['public']['Tables']['exams']['Row']
export type ExamQuestion = Database['public']['Tables']['exam_questions']['Row']
export type Attempt = Database['public']['Tables']['attempts']['Row']
export type AttemptAnswer = Database['public']['Tables']['attempt_answers']['Row']
export type AuditEvent = Database['public']['Tables']['audit_events']['Row']

// Question option types
export interface McqOption {
    id: string
    text_md: string
}

export interface QuestionWithDetails extends Question {
    options?: McqOption[]
}

// Exam with related data
export interface ExamWithQuestions extends Exam {
    exam_questions: (ExamQuestion & { question: Question })[]
}

// Attempt with answers
export interface AttemptWithAnswers extends Attempt {
    attempt_answers: AttemptAnswer[]
    exam: Exam
}

// Class with membership info
export interface ClassWithMembership extends Class {
    class_members: ClassMember[]
    member_count?: number
}
