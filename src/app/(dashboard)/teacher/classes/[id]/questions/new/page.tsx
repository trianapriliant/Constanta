'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Plus, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { AutocompleteTags } from '@/components/ui/autocomplete-tags'
import { questionSchema, type QuestionFormData } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'

export default function NewQuestionPage() {
    const router = useRouter()
    const params = useParams()
    const classId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [promptMd, setPromptMd] = useState('')
    const [explanationMd, setExplanationMd] = useState('')
    const [options, setOptions] = useState([
        { id: uuidv4(), text_md: '' },
        { id: uuidv4(), text_md: '' },
        { id: uuidv4(), text_md: '' },
        { id: uuidv4(), text_md: '' },
    ])
    const [correctAnswer, setCorrectAnswer] = useState<string | string[] | boolean | number>('')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [existingTags, setExistingTags] = useState<string[]>([])
    const [isAdvancedScoring, setIsAdvancedScoring] = useState(false)

    // Fetch existing tags
    useEffect(() => {
        const fetchTags = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('questions')
                .select('tags')
                .eq('class_id', classId)

            if (data) {
                // Flatten and unique tags
                const allTags = data.flatMap(q => q.tags || [])
                const uniqueTags = Array.from(new Set(allTags))
                setExistingTags(uniqueTags.sort())
            }
        }
        fetchTags()
    }, [classId])

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
            grading_config: {
                correct_points: 4,
                incorrect_points: -1,
                unanswered_points: 0,
            }
        },
    })

    const questionType = form.watch('type')

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

        setIsLoading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Not authenticated')
                return
            }

            let optionsJson = null
            let correctAnswerJson = correctAnswer

            // Prepare options and correct answer based on type
            if (data.type === 'mcq_single' || data.type === 'mcq_multi') {
                optionsJson = options.filter(o => o.text_md.trim()) as any
            }

            // Handle Advanced Scoring Logic
            let finalPoints = data.points
            let finalGradingConfig = null

            if (isAdvancedScoring && data.grading_config) {
                finalPoints = data.grading_config.correct_points // Sync main points with correct points
                finalGradingConfig = data.grading_config
            }

            const { error } = await supabase
                .from('questions')
                .insert({
                    class_id: classId,
                    created_by: user.id,
                    type: data.type,
                    difficulty: data.difficulty,
                    tags: tags,
                    points: finalPoints,
                    prompt_md: promptMd,
                    options_json: optionsJson,
                    correct_answer_json: correctAnswerJson,
                    explanation_md: explanationMd || null,
                    numeric_tolerance: data.type === 'numeric' ? data.numeric_tolerance : null,
                    grading_config: finalGradingConfig,
                })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Question created!')
            router.push(`/teacher/classes/${classId}?tab=questions`)
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                href={`/teacher/classes/${classId}?tab=questions`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Question Bank
            </Link>

            <h1 className="text-2xl font-bold mb-6">Create New Question</h1>

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
                                    <SelectItem value="canvas">Canvas / Drawing</SelectItem>
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

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="scoring-mode" className="cursor-pointer font-medium">Advanced Scoring</Label>
                                <Switch
                                    id="scoring-mode"
                                    checked={isAdvancedScoring}
                                    onCheckedChange={setIsAdvancedScoring}
                                />
                            </div>

                            {!isAdvancedScoring ? (
                                <div className="space-y-2">
                                    <Label>Points</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        {...form.register('points', { valueAsNumber: true })}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-green-600 font-medium whitespace-nowrap">Correct (+)</Label>
                                        <Input
                                            type="number"
                                            className="h-8"
                                            {...form.register('grading_config.correct_points', { valueAsNumber: true })}
                                            placeholder="4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-red-600 font-medium whitespace-nowrap">Incorrect (-)</Label>
                                        <Input
                                            type="number"
                                            className="h-8"
                                            {...form.register('grading_config.incorrect_points', { valueAsNumber: true })}
                                            placeholder="-1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500 font-medium whitespace-nowrap">No Answer (0)</Label>
                                        <Input
                                            type="number"
                                            className="h-8"
                                            {...form.register('grading_config.unanswered_points', { valueAsNumber: true })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}
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
                        <AutocompleteTags
                            tags={tags}
                            onTagsChange={setTags}
                            suggestions={existingTags}
                            placeholder="Add a tag..."
                        />
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

                {/* Canvas - No Correct Answer Input Needed (Manual Grading) */}
                {questionType === 'canvas' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Canvas Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Students will be provided with a blank canvas to draw their answer. This question type requires manual grading.
                            </p>
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
                <div className="flex justify-end gap-3">
                    <Link href={`/teacher/classes/${classId}?tab=questions`}>
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
                        Create Question
                    </Button>
                </div>
            </form>
        </div>
    )
}
