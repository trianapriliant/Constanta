'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownViewer } from '@/components/markdown'
import { CheckCircle, XCircle, HelpCircle, LayoutList, BookOpen, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { QuestionNavigator } from '@/components/exam/question-navigator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Question, AttemptAnswer } from '@/types/database'

interface GradingQuestionsSectionProps {
    questions: any[]
    answers: Record<string, AttemptAnswer>
    attemptId: string
}

export function GradingQuestionsSection({
    questions,
    answers,
    attemptId
}: GradingQuestionsSectionProps) {
    const [viewMode, setViewMode] = useState<'scroll' | 'pagination'>('scroll')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [scores, setScores] = useState<Record<string, number>>({})
    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const router = useRouter()

    const params = useParams()
    const { id: classId, examId } = params as { id: string; examId: string }

    const handleNavigate = (index: number) => {
        setCurrentIndex(index)
        if (viewMode === 'scroll') {
            const element = document.getElementById(`question-${index}`)
            if (element) {
                const y = element.getBoundingClientRect().top + window.scrollY - 100
                window.scrollTo({ top: y, behavior: 'smooth' })
            }
        }
    }

    const getOptionText = (optionsJson: any, optionId: string) => {
        const options = optionsJson as any[]
        const option = options?.find((o) => o.id === optionId)
        return option?.text_md || optionId
    }

    const handleScoreChange = (questionId: string, val: string) => {
        const num = parseFloat(val)
        if (!isNaN(num)) {
            setScores(prev => ({ ...prev, [questionId]: num }))
        }
    }

    const saveScore = async (questionId: string, maxPoints: number) => {
        const score = scores[questionId]
        if (score === undefined) return
        if (score < 0 || score > maxPoints) {
            toast.error(`Score must be between 0 and ${maxPoints}`)
            return
        }

        setSaving(prev => ({ ...prev, [questionId]: true }))
        const supabase = createClient()

        try {
            // Update attempt_answers
            const { error } = await supabase
                .from('attempt_answers')
                .update({
                    points_awarded: score,
                    is_correct: score === maxPoints, // Simple logic, maybe partial?
                    // status: 'graded' // attempt_answers doesn't have status, but attempt does
                })
                .eq('attempt_id', attemptId)
                .eq('question_id', questionId)

            if (error) throw error

            toast.success('Score saved')
            router.refresh()

            // Also update local state to reflect checking/x status immediately?
            // For now just success toast.
        } catch (error) {
            toast.error('Failed to save score')
            console.error(error)
        } finally {
            setSaving(prev => ({ ...prev, [questionId]: false }))
        }
    }

    const finishGrading = async () => {
        setSaving(prev => ({ ...prev, global: true }))
        const supabase = createClient()
        try {
            const { error } = await supabase
                .from('attempts')
                .update({ status: 'graded' })
                .eq('id', attemptId)

            if (error) throw error

            toast.success('Grading completed')
            router.push(`/teacher/classes/${classId}/exams/${examId}`)
            router.refresh()
        } catch (error) {
            toast.error('Failed to finish grading')
            console.error(error)
        } finally {
            setSaving(prev => ({ ...prev, global: false }))
        }
    }

    const renderQuestionCard = (eq: any, index: number) => {
        const question = eq.question
        const answer = answers[question.id]
        const currentScore = scores[question.id] ?? answer?.points_awarded ?? 0
        const isEssayOrCanvas = question.type === 'essay' || question.type === 'canvas'
        const isManualGrading = isEssayOrCanvas // Simplified logic

        return (
            <Card key={eq.id} id={`question-${index}`} className={cn("transition-all duration-300", currentIndex === index && viewMode === 'scroll' ? "ring-2 ring-primary ring-offset-2" : "")}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">Q{index + 1}</Badge>
                            <Badge variant="secondary">{question.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground mr-2">
                                Max: {eq.points} pts
                            </span>
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    min="0"
                                    max={eq.points}
                                    className="w-20 h-8"
                                    value={currentScore}
                                    onChange={(e) => handleScoreChange(question.id, e.target.value)}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={saving[question.id]}
                                    onClick={() => saveScore(question.id, eq.points)}
                                >
                                    <Save className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Question */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <MarkdownViewer content={question.prompt_md} />
                    </div>

                    {/* Student Answer */}
                    <div>
                        <h4 className="text-sm font-medium mb-2">Student Answer:</h4>
                        <div className="p-3 rounded-lg border bg-muted/20">
                            {!answer?.answer_json ? (
                                <span className="text-muted-foreground italic">No answer provided</span>
                            ) : question.type === 'canvas' ? (
                                <div className="border rounded bg-white">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={answer.answer_json as string}
                                        alt="Student Drawing"
                                        className="w-full h-auto max-h-[500px] object-contain"
                                    />
                                </div>
                            ) : question.type === 'mcq_single' ? (
                                <span>{getOptionText(question.options_json, answer.answer_json as string)}</span>
                            ) : question.type === 'mcq_multi' ? (
                                <span>{(answer.answer_json as string[]).map(id => getOptionText(question.options_json, id)).join(', ')}</span>
                            ) : question.type === 'true_false' ? (
                                <span>{answer.answer_json ? 'True' : 'False'}</span>
                            ) : (
                                <span>{String(answer.answer_json)}</span>
                            )}
                        </div>
                    </div>

                    {/* Correct Answer Reference (for teacher) */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Correct Answer (Ref):</h4>
                        <div className="p-3 rounded-lg border border-dashed text-muted-foreground text-sm">
                            {question.type === 'mcq_single' ? (
                                <span>{getOptionText(question.options_json, question.correct_answer_json)}</span>
                            ) : question.type === 'mcq_multi' ? (
                                <span>{(question.correct_answer_json as string[]).map((id: string) => getOptionText(question.options_json, id)).join(', ')}</span>
                            ) : question.type === 'true_false' ? (
                                <span>{question.correct_answer_json ? 'True' : 'False'}</span>
                            ) : (
                                <span>{String(question.correct_answer_json)}</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div>
            {/* View Mode Toggle */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Grading</h2>
                <div className="bg-muted p-1 rounded-lg flex items-center">
                    <Button
                        variant={viewMode === 'scroll' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('scroll')}
                        size="sm"
                        className="h-8 text-xs"
                    >
                        <LayoutList className="w-3.5 h-3.5 mr-1.5" /> Scroll
                    </Button>
                    <Button
                        variant={viewMode === 'pagination' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('pagination')}
                        size="sm"
                        className="h-8 text-xs"
                    >
                        <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Paging
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Content Area */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    {viewMode === 'scroll' ? (
                        <div className="space-y-6">
                            {questions.map((q, i) => renderQuestionCard(q, i))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {renderQuestionCard(questions[currentIndex], currentIndex)}
                            <div className="flex justify-between pt-4">
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
                                    onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                                    disabled={currentIndex === questions.length - 1}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 order-1 lg:order-2 mb-6 lg:mb-0 sticky top-24 h-fit">
                    <QuestionNavigator
                        questions={questions}
                        answers={answers}
                        currentIndex={currentIndex}
                        onNavigate={handleNavigate}
                        mode="review" // Use review mode style for now
                        className="!static"
                    />

                    <div className="mt-6 space-y-3">
                        <Button
                            className="w-full gradient-teal text-white border-0"
                            size="lg"
                            onClick={finishGrading}
                            disabled={saving.global}
                        >
                            {saving.global ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Finish & Release Result
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Marks attempt as "Graded" and makes results visible to student (if configured).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
