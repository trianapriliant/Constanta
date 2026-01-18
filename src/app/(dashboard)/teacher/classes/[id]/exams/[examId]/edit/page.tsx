'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Plus, X, GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { MarkdownEditor } from '@/components/markdown'
import { createClient } from '@/lib/supabase/client'

interface QuestionItem {
    id: string
    prompt_md: string
    type: string
    difficulty: string
    points: number
    selected: boolean
    examPoints: number
}

export default function EditExamPage() {
    const router = useRouter()
    const params = useParams()
    const classId = params.id as string
    const examId = params.examId as string

    const [isLoading, setIsLoading] = useState(true)
    const [title, setTitle] = useState('')
    const [descriptionMd, setDescriptionMd] = useState('')
    const [durationMinutes, setDurationMinutes] = useState(60)
    const [shuffleQuestions, setShuffleQuestions] = useState(false)
    const [shuffleOptions, setShuffleOptions] = useState(false)
    const [maxAttempts, setMaxAttempts] = useState(1)
    const [passingScore, setPassingScore] = useState<number | null>(null)
    const [explanationPolicy, setExplanationPolicy] = useState('after_submit')
    const [resultPolicy, setResultPolicy] = useState('immediate')
    const [published, setPublished] = useState(false)
    const [questions, setQuestions] = useState<QuestionItem[]>([])
    const [loadingQuestions, setLoadingQuestions] = useState(true)

    // Load data
    useEffect(() => {
        async function loadData() {
            const supabase = createClient()

            // 1. Fetch Exam Details
            const { data: exam, error: examError } = await supabase
                .from('exams')
                .select('*')
                .eq('id', examId)
                .single()

            if (examError) {
                toast.error('Failed to load exam')
                router.push(`/teacher/classes/${classId}`)
                return
            }

            setTitle(exam.title)
            setDescriptionMd(exam.description_md || '')
            setDurationMinutes(exam.duration_minutes)
            setShuffleQuestions(exam.shuffle_questions)
            setShuffleOptions(exam.shuffle_options)
            setMaxAttempts(exam.max_attempts)
            setPassingScore(exam.passing_score)
            setExplanationPolicy(exam.explanation_policy)
            setResultPolicy(exam.result_policy)
            setPublished(exam.published)

            // 2. Fetch All Questions for this Class
            const { data: allQuestions } = await supabase
                .from('questions')
                .select('id, prompt_md, type, difficulty, points')
                .eq('class_id', classId)
                .order('created_at', { ascending: false })

            // 3. Fetch Existing Exam Questions
            const { data: examQuestions } = await supabase
                .from('exam_questions')
                .select('question_id, points')
                .eq('exam_id', examId)

            if (allQuestions) {
                const existingQuestionMap = new Map()
                examQuestions?.forEach((eq: any) => {
                    existingQuestionMap.set(eq.question_id, eq.points)
                })

                setQuestions(allQuestions.map((q: any) => ({
                    ...q,
                    selected: existingQuestionMap.has(q.id),
                    examPoints: existingQuestionMap.get(q.id) || q.points,
                })))
            }

            setLoadingQuestions(false)
            setIsLoading(false)
        }
        loadData()
    }, [classId, examId, router])

    const toggleQuestion = (id: string) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, selected: !q.selected } : q
        ))
    }

    const updateQuestionPoints = (id: string, points: number) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, examPoints: points } : q
        ))
    }

    const selectedQuestions = questions.filter(q => q.selected)
    const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.examPoints, 0)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!title.trim()) {
            toast.error('Title is required')
            return
        }

        if (selectedQuestions.length === 0) {
            toast.error('Select at least one question')
            return
        }

        setIsLoading(true)

        try {
            const supabase = createClient()

            // Update exam
            const { error: examError } = await supabase
                .from('exams')
                .update({
                    title: title.trim(),
                    description_md: descriptionMd || null,
                    duration_minutes: durationMinutes,
                    shuffle_questions: shuffleQuestions,
                    shuffle_options: shuffleOptions,
                    max_attempts: maxAttempts,
                    passing_score: passingScore,
                    explanation_policy: explanationPolicy,
                    result_policy: resultPolicy,
                    published,
                    published_at: published && !published ? new Date().toISOString() : undefined, // Only update if changing to published? Keep it simple.
                })
                .eq('id', examId)

            if (examError) {
                toast.error(examError.message)
                return
            }

            // Sync questions: Delete all existing and re-insert logic
            // (This is simpler than diffing for now)
            const { error: deleteError } = await supabase
                .from('exam_questions')
                .delete()
                .eq('exam_id', examId)

            if (deleteError) {
                toast.error('Failed to update questions')
                return
            }

            const examQuestionsData = selectedQuestions.map((q, index) => ({
                exam_id: examId,
                question_id: q.id,
                order_index: index,
                points: q.examPoints,
            }))

            const { error: insertError } = await supabase
                .from('exam_questions')
                .insert(examQuestionsData)

            if (insertError) {
                toast.error(insertError.message)
                return
            }

            toast.success('Exam updated!')
            router.push(`/teacher/classes/${classId}`)
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const typeLabels: Record<string, string> = {
        mcq_single: 'MCQ',
        mcq_multi: 'Multi-Select',
        true_false: 'T/F',
        numeric: 'Numeric',
        short_text: 'Short',
        essay: 'Essay',
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <Link
                href={`/teacher/classes/${classId}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
            </Link>

            <h1 className="text-2xl font-bold mb-6">Edit Exam</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Exam Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter exam title..."
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <MarkdownEditor
                                value={descriptionMd}
                                onChange={setDescriptionMd}
                                placeholder="Instructions for students..."
                                minHeight="100px"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Attempts</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={maxAttempts}
                                    onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Passing Score (%)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={passingScore || ''}
                                    onChange={(e) => setPassingScore(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label>Show Explanations</Label>
                                <Select value={explanationPolicy} onValueChange={setExplanationPolicy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="after_submit">After Submit</SelectItem>
                                        <SelectItem value="after_end">After Exam Ends</SelectItem>
                                        <SelectItem value="never">Never</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Show Scores/Results</Label>
                                <Select value={resultPolicy} onValueChange={setResultPolicy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="immediate">Immediately (Partial if not graded)</SelectItem>
                                        <SelectItem value="when_graded">Only when Fully Graded</SelectItem>
                                        <SelectItem value="after_end">After Exam Ends</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="shuffle-questions"
                                    checked={shuffleQuestions}
                                    onCheckedChange={setShuffleQuestions}
                                />
                                <Label htmlFor="shuffle-questions">Shuffle Questions</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="shuffle-options"
                                    checked={shuffleOptions}
                                    onCheckedChange={setShuffleOptions}
                                />
                                <Label htmlFor="shuffle-options">Shuffle Options</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Question Selection */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Select Questions</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            {selectedQuestions.length} selected • {totalPoints} points
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingQuestions ? (
                            <div className="py-8 text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <p>No questions in the bank.</p>
                                <Link href={`/teacher/classes/${classId}/questions/new`}>
                                    <Button variant="link" className="mt-2">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Create Questions First
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {questions.map((q) => (
                                    <div
                                        key={q.id}
                                        className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${q.selected ? 'bg-accent border-primary' : 'hover:bg-muted/50'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={q.selected}
                                            onCheckedChange={() => toggleQuestion(q.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm line-clamp-2">
                                                {q.prompt_md.replace(/[#*`]/g, '').substring(0, 100)}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {typeLabels[q.type] || q.type}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {q.difficulty}
                                                </Badge>
                                            </div>
                                        </div>
                                        {q.selected && (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={q.examPoints}
                                                    onChange={(e) => updateQuestionPoints(q.id, parseInt(e.target.value) || 1)}
                                                    className="w-16 h-8 text-sm"
                                                />
                                                <span className="text-xs text-muted-foreground">pts</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Publish Toggle */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="publish" className="text-base">Publish immediately</Label>
                                <p className="text-sm text-muted-foreground">
                                    Students will be able to take this exam right away
                                </p>
                            </div>
                            <Switch
                                id="publish"
                                checked={published}
                                onCheckedChange={setPublished}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link href={`/teacher/classes/${classId}`}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        className="gradient-teal text-white border-0"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    )
}
