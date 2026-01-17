'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Plus, X, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MarkdownEditor } from '@/components/markdown'
import { questionSchema, type QuestionFormData } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function EditQuestionPage() {
    const router = useRouter()
    const params = useParams()
    const classId = params.id as string
    const questionId = params.questionId as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [promptMd, setPromptMd] = useState('')
    const [explanationMd, setExplanationMd] = useState('')
    const [options, setOptions] = useState([
        { id: uuidv4(), text_md: '' },
        { id: uuidv4(), text_md: '' },
    ])
    const [correctAnswer, setCorrectAnswer] = useState<string | string[] | boolean | number>('')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])

    const form = useForm<QuestionFormData>({
        resolver: zodResolver(questionSchema) as any,
        defaultValues: {
            type: 'mcq_single',
            difficulty: 'medium',
            points: 1,
            tags: [],
            prompt_md: '',
            explanation_md: '',
            numeric_tolerance: 0,
        },
    })

    const questionType = form.watch('type')

    useEffect(() => {
        const fetchQuestion = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('id', questionId)
                .single()

            if (error || !data) {
                toast.error('Failed to load question')
                router.push(`/teacher/classes/${classId}/questions`)
                return
            }

            // Populate form
            form.reset({
                type: data.type,
                difficulty: data.difficulty,
                points: data.points,
                tags: data.tags || [],
                prompt_md: data.prompt_md,
                explanation_md: data.explanation_md || '',
                numeric_tolerance: data.numeric_tolerance || 0,
            })

            setPromptMd(data.prompt_md)
            setExplanationMd(data.explanation_md || '')
            setTags(data.tags || [])

            if (data.options_json) {
                setOptions(data.options_json.map((o: any) => ({ ...o, id: o.id || uuidv4() })))
            } else {
                setOptions([
                    { id: uuidv4(), text_md: '' },
                    { id: uuidv4(), text_md: '' },
                ])
            }

            setCorrectAnswer(data.correct_answer_json)
            setIsLoading(false)
        }

        fetchQuestion()
    }, [questionId, classId, router, form])

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    const addOption = () => {
        setOptions([...options, { id: uuidv4(), text_md: '' }])
    }

    const removeOption = (id: string) => {
        if (options.length > 2) {
            setOptions(options.filter(o => o.id !== id))
        }
    }

    const updateOption = (id: string, text: string) => {
        setOptions(options.map(o => o.id === id ? { ...o, text_md: text } : o))
    }

    async function onSubmit(data: QuestionFormData) {
        if (!promptMd.trim()) {
            toast.error('Question prompt is required')
            return
        }

        setIsSaving(true)

        try {
            const supabase = createClient()

            let optionsJson = null
            let correctAnswerJson = correctAnswer

            if (data.type === 'mcq_single' || data.type === 'mcq_multi') {
                optionsJson = options.filter(o => o.text_md.trim()) as any
            }

            const { error } = await supabase
                .from('questions')
                .update({
                    type: data.type,
                    difficulty: data.difficulty,
                    tags: tags,
                    points: data.points,
                    prompt_md: promptMd,
                    options_json: optionsJson,
                    correct_answer_json: correctAnswerJson,
                    explanation_md: explanationMd || null,
                    numeric_tolerance: data.type === 'numeric' ? data.numeric_tolerance : null,
                })
                .eq('id', questionId)

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Question updated!')
            router.push(`/teacher/classes/${classId}/questions`)
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', questionId)

        if (error) {
            toast.error('Failed to delete question')
            setIsDeleting(false)
        } else {
            toast.success('Question deleted')
            router.push(`/teacher/classes/${classId}/questions`)
            router.refresh()
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <Link
                    href={`/teacher/classes/${classId}/questions`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Question Bank
                </Link>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete Question
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the question.
                                If this question is already used in an exam, it might cause issues.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <h1 className="text-2xl font-bold mb-6">Edit Question</h1>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit(form.getValues()); }} className="space-y-6">
                {/* Question Type & Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Question Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={form.watch('type')}
                                onValueChange={(v) => form.setValue('type', v as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mcq_single">Multiple Choice</SelectItem>
                                    <SelectItem value="mcq_multi">Multi-Select</SelectItem>
                                    <SelectItem value="true_false">True/False</SelectItem>
                                    <SelectItem value="numeric">Numeric</SelectItem>
                                    <SelectItem value="short_text">Short Answer</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select
                                value={form.watch('difficulty')}
                                onValueChange={(v) => form.setValue('difficulty', v as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                                type="number"
                                min={1}
                                {...form.register('points', { valueAsNumber: true })}
                            />
                        </div>

                        {questionType === 'numeric' && (
                            <div className="space-y-2">
                                <Label>Tolerance</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...form.register('numeric_tolerance', { valueAsNumber: true })}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="Add a tag..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <Button type="button" variant="outline" onClick={addTag}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Question Prompt */}
                <Card>
                    <CardHeader>
                        <CardTitle>Question Prompt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MarkdownEditor
                            value={promptMd}
                            onChange={setPromptMd}
                            placeholder="Write your question here..."
                            minHeight="200px"
                        />
                    </CardContent>
                </Card>

                {/* Answer Options (for MCQ types) */}
                {(questionType === 'mcq_single' || questionType === 'mcq_multi') && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Answer Options</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addOption}>
                                <Plus className="w-4 h-4 mr-1" />
                                Add Option
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {options.map((option, index) => (
                                <div key={option.id} className="flex gap-3 items-start">
                                    <div className="flex-shrink-0 pt-2">
                                        {questionType === 'mcq_single' ? (
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={correctAnswer === option.id}
                                                onChange={() => setCorrectAnswer(option.id)}
                                                className="w-4 h-4 accent-primary"
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={Array.isArray(correctAnswer) && correctAnswer.includes(option.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setCorrectAnswer([...(Array.isArray(correctAnswer) ? correctAnswer : []), option.id])
                                                    } else {
                                                        setCorrectAnswer((Array.isArray(correctAnswer) ? correctAnswer : []).filter(id => id !== option.id))
                                                    }
                                                }}
                                                className="w-4 h-4 accent-primary"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            value={option.text_md}
                                            onChange={(e) => updateOption(option.id, e.target.value)}
                                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                        />
                                    </div>
                                    {options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(option.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <p className="text-sm text-muted-foreground">
                                {questionType === 'mcq_single'
                                    ? 'Select the correct answer'
                                    : 'Check all correct answers'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* True/False */}
                {questionType === 'true_false' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Correct Answer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trueFalse"
                                        checked={correctAnswer === true}
                                        onChange={() => setCorrectAnswer(true)}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    True
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trueFalse"
                                        checked={correctAnswer === false}
                                        onChange={() => setCorrectAnswer(false)}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    False
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Numeric / Short Text Answer */}
                {(questionType === 'numeric' || questionType === 'short_text') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Correct Answer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type={questionType === 'numeric' ? 'number' : 'text'}
                                step={questionType === 'numeric' ? 'any' : undefined}
                                value={correctAnswer as string}
                                onChange={(e) => setCorrectAnswer(
                                    questionType === 'numeric' ? parseFloat(e.target.value) : e.target.value
                                )}
                                placeholder={questionType === 'numeric' ? 'Enter the correct number' : 'Enter the correct answer'}
                            />
                            {questionType === 'short_text' && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Tip: Wrap in /.../ for regex matching
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Explanation */}
                <Card>
                    <CardHeader>
                        <CardTitle>Explanation (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MarkdownEditor
                            value={explanationMd}
                            onChange={setExplanationMd}
                            placeholder="Explain the correct answer..."
                            minHeight="150px"
                        />
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-3 pb-8">
                    <Link href={`/teacher/classes/${classId}/questions`}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        className="gradient-teal text-white border-0"
                        disabled={isSaving}
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    )
}
