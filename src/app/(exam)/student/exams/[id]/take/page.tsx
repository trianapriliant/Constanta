'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Clock, Flag, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { MarkdownViewer } from '@/components/markdown'
import { createClient } from '@/lib/supabase/client'
import { QuestionNavigator } from '@/components/exam/question-navigator'
import type { Question, Attempt, AttemptAnswer, Exam, ExamQuestion } from '@/types/database'

interface ExamData {
    exam: Exam
    attempt: Attempt
    questions: (ExamQuestion & { question: Question })[]
    answers: Record<string, AttemptAnswer>
}

export default function TakeExamPage() {
    const router = useRouter()
    const params = useParams()
    const examId = params.id as string

    const [loading, setLoading] = useState(true)
    const [examData, setExamData] = useState<ExamData | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [flagged, setFlagged] = useState<Record<string, boolean>>({})
    const [timeLeft, setTimeLeft] = useState(0)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [saving, setSaving] = useState(false)

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastSavedRef = useRef<string>('')

    // Load exam and attempt data
    useEffect(() => {
        let isActive = true

        async function loadExam() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!isActive) return

            if (!user) {
                router.push('/login')
                return
            }

            // Get or find existing attempt (any status)
            let { data: existingAttempts } = await supabase
                .from('attempts')
                .select('*')
                .eq('exam_id', examId)
                .eq('student_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            if (!isActive) return

            let attempt = existingAttempts?.[0] || null

            // Get exam details
            const { data: exam } = await supabase
                .from('exams')
                .select('*')
                .eq('id', examId)
                .single()

            if (!isActive) return

            if (!exam) {
                toast.error('Exam not found')
                router.push('/student')
                return
            }

            // If already submitted/graded, redirect to review
            if (attempt && (attempt.status === 'submitted' || attempt.status === 'graded')) {
                router.push(`/student/exams/${examId}/review`)
                return
            }

            // If no in_progress attempt exists, create one
            if (!attempt) {
                const { data: newAttempt, error } = await supabase
                    .from('attempts')
                    .insert({
                        exam_id: examId,
                        student_id: user.id,
                        status: 'in_progress',
                    })
                    .select()
                    .single()

                if (!isActive) return // If cancelled during insert, stop here (though insert might have happened, redundancy minimized by earlier checks)

                if (error) {
                    toast.error('Failed to start exam')
                    console.error('Create attempt error:', error)
                    return
                }

                attempt = newAttempt
            }

            if (!isActive) return

            // Get exam questions
            const { data: examQuestions } = await supabase
                .from('exam_questions')
                .select(`
          *,
          question:questions(*)
        `)
                .eq('exam_id', examId)
                .order('order_index')

            if (!isActive) return

            // Get existing answers
            const { data: existingAnswers } = await supabase
                .from('attempt_answers')
                .select('*')
                .eq('attempt_id', attempt.id)

            if (!isActive) return

            const answersMap: Record<string, AttemptAnswer> = {}
            existingAnswers?.forEach((a) => {
                answersMap[a.question_id] = a
            })

            // Restore answers
            const restoredAnswers: Record<string, any> = {}
            const restoredFlags: Record<string, boolean> = {}
            existingAnswers?.forEach((a) => {
                restoredAnswers[a.question_id] = a.answer_json
                restoredFlags[a.question_id] = a.flagged
            })

            setAnswers(restoredAnswers)
            setFlagged(restoredFlags)

            // Calculate time left
            const startTime = new Date(attempt.started_at).getTime()
            const durationMs = exam.duration_minutes * 60 * 1000
            const elapsed = Date.now() - startTime
            const remaining = Math.max(0, durationMs - elapsed)

            setTimeLeft(Math.floor(remaining / 1000))

            setExamData({
                exam,
                attempt,
                questions: examQuestions as any || [],
                answers: answersMap,
            })

            setLoading(false)
        }

        loadExam()

        return () => {
            isActive = false
        }
    }, [examId, router])

    // Timer
    useEffect(() => {
        if (timeLeft <= 0) return

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Auto-submit when time runs out
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [timeLeft])

    // Debounced autosave
    const saveAnswer = useCallback(async (questionId: string, answer: any, flag: boolean) => {
        if (!examData) return

        setSaving(true)
        const supabase = createClient()

        // Check if answer already exists
        const { data: existing } = await supabase
            .from('attempt_answers')
            .select('id')
            .eq('attempt_id', examData.attempt.id)
            .eq('question_id', questionId)
            .single()

        let error;
        if (existing) {
            // Update existing answer
            const result = await supabase
                .from('attempt_answers')
                .update({
                    answer_json: answer,
                    flagged: flag,
                })
                .eq('id', existing.id)
            error = result.error
        } else {
            // Insert new answer
            const result = await supabase
                .from('attempt_answers')
                .insert({
                    attempt_id: examData.attempt.id,
                    question_id: questionId,
                    answer_json: answer,
                    flagged: flag,
                })
            error = result.error
        }

        if (error) {
            console.error('Save error:', error)
            toast.error('Failed to save answer')
        }

        setSaving(false)
    }, [examData])

    const debouncedSave = useCallback((questionId: string, answer: any, flag: boolean) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveAnswer(questionId, answer, flag)
        }, 800)
    }, [saveAnswer])

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
        debouncedSave(questionId, value, flagged[questionId] || false)
    }

    const handleFlagToggle = (questionId: string) => {
        const newFlag = !flagged[questionId]
        setFlagged((prev) => ({ ...prev, [questionId]: newFlag }))
        saveAnswer(questionId, answers[questionId], newFlag)
    }

    const handleSubmit = async () => {
        if (!examData) return
        setSubmitting(true)

        try {
            const supabase = createClient()

            // Save all answers first
            for (const q of examData.questions) {
                await saveAnswer(q.question_id, answers[q.question_id], flagged[q.question_id] || false)
            }

            // Call submit API
            const res = await fetch(`/api/exams/${examId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId: examData.attempt.id }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit')
            }

            toast.success('Exam submitted successfully!')
            router.push(`/student/exams/${examId}/review`)
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit exam')
        } finally {
            setSubmitting(false)
            setShowSubmitDialog(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!examData) {
        return null
    }

    const currentQuestion = examData.questions[currentIndex]
    const question = currentQuestion?.question

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== undefined && answers[k] !== '').length

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Timer Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <h1 className="font-semibold truncate">{examData.exam.title}</h1>
                    <div className="flex items-center gap-4">
                        {saving && (
                            <span className="text-sm text-muted-foreground">Saving...</span>
                        )}
                        <Badge variant={timeLeft < 300 ? 'destructive' : 'secondary'} className="gap-1 text-base font-mono">
                            <Clock className="w-4 h-4" />
                            {formatTime(timeLeft)}
                        </Badge>
                        <Button
                            onClick={() => setShowSubmitDialog(true)}
                            className="gradient-teal text-white border-0"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Submit
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Question Navigation */}
                    <div className="lg:col-span-1 order-1 lg:order-1 mb-1 lg:mb-0">
                        <QuestionNavigator
                            questions={examData.questions}
                            answers={answers}
                            currentIndex={currentIndex}
                            onNavigate={setCurrentIndex}
                            flagged={flagged}
                            mode="take"
                        />
                    </div>

                    {/* Question Content */}
                    <div className="lg:col-span-3 order-2 lg:order-2">
                        <Card>
                            <CardContent className="p-6">
                                {/* Question Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Question {currentIndex + 1}</Badge>
                                        <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                                    </div>
                                    <Button
                                        variant={flagged[question.id] ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleFlagToggle(question.id)}
                                        className={flagged[question.id] ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                                    >
                                        <Flag className="w-4 h-4 mr-1" />
                                        {flagged[question.id] ? 'Flagged' : 'Flag'}
                                    </Button>
                                </div>

                                {/* Question Prompt */}
                                <div className="mb-6">
                                    <MarkdownViewer content={question.prompt_md} />
                                </div>

                                {/* Answer Input */}
                                <div className="space-y-4">
                                    {question.type === 'mcq_single' && question.options_json && (
                                        <RadioGroup
                                            value={answers[question.id] || ''}
                                            onValueChange={(v) => handleAnswerChange(question.id, v)}
                                        >
                                            {(question.options_json as any[]).map((opt) => (
                                                <div key={opt.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                                                    <RadioGroupItem value={opt.id} id={opt.id} className="mt-1" />
                                                    <Label htmlFor={opt.id} className="flex-1 cursor-pointer">
                                                        {opt.text_md}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}

                                    {question.type === 'mcq_multi' && question.options_json && (
                                        <div className="space-y-2">
                                            {(question.options_json as any[]).map((opt) => {
                                                const selected = Array.isArray(answers[question.id]) && answers[question.id].includes(opt.id)
                                                return (
                                                    <div key={opt.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                                                        <Checkbox
                                                            id={opt.id}
                                                            checked={selected}
                                                            onCheckedChange={(checked) => {
                                                                const current = Array.isArray(answers[question.id]) ? answers[question.id] : []
                                                                if (checked) {
                                                                    handleAnswerChange(question.id, [...current, opt.id])
                                                                } else {
                                                                    handleAnswerChange(question.id, current.filter((id: string) => id !== opt.id))
                                                                }
                                                            }}
                                                            className="mt-1"
                                                        />
                                                        <Label htmlFor={opt.id} className="flex-1 cursor-pointer">
                                                            {opt.text_md}
                                                        </Label>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {question.type === 'true_false' && (
                                        <RadioGroup
                                            value={answers[question.id]?.toString() || ''}
                                            onValueChange={(v) => handleAnswerChange(question.id, v === 'true')}
                                        >
                                            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                                                <RadioGroupItem value="true" id="true" />
                                                <Label htmlFor="true" className="cursor-pointer">True</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                                                <RadioGroupItem value="false" id="false" />
                                                <Label htmlFor="false" className="cursor-pointer">False</Label>
                                            </div>
                                        </RadioGroup>
                                    )}

                                    {question.type === 'numeric' && (
                                        <Input
                                            type="number"
                                            step="any"
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))}
                                            placeholder="Enter your answer"
                                            className="max-w-xs"
                                        />
                                    )}

                                    {question.type === 'short_text' && (
                                        <Input
                                            type="text"
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            placeholder="Enter your answer"
                                        />
                                    )}

                                    {question.type === 'essay' && (
                                        <Textarea
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            placeholder="Write your essay here..."
                                            rows={10}
                                        />
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between mt-8 pt-6 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                        disabled={currentIndex === 0}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentIndex(Math.min(examData.questions.length - 1, currentIndex + 1))}
                                        disabled={currentIndex === examData.questions.length - 1}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Dialog */}
            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Exam?</DialogTitle>
                        <DialogDescription>
                            You have answered {answeredCount} of {examData.questions.length} questions.
                            {answeredCount < examData.questions.length && (
                                <span className="text-yellow-600 flex items-center gap-1 mt-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Some questions are unanswered!
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="gradient-teal text-white border-0"
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Exam
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
