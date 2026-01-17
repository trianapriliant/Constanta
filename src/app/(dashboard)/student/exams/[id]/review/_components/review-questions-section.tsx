'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkdownViewer } from '@/components/markdown'
import { CheckCircle, XCircle, HelpCircle, LayoutList, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { QuestionNavigator } from '@/components/exam/question-navigator'
import { cn } from '@/lib/utils'

interface ReviewQuestionsSectionProps {
    questions: any[]
    answers: Record<string, any>
    canShowExplanation: boolean
}

export function ReviewQuestionsSection({
    questions,
    answers,
    canShowExplanation
}: ReviewQuestionsSectionProps) {
    const [viewMode, setViewMode] = useState<'scroll' | 'pagination'>('scroll')
    const [currentIndex, setCurrentIndex] = useState(0)

    const handleNavigate = (index: number) => {
        setCurrentIndex(index)
        if (viewMode === 'scroll') {
            const element = document.getElementById(`question-${index}`)
            if (element) {
                // Offset for sticky header/nav if needed
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

    const renderQuestionCard = (eq: any, index: number) => {
        const question = eq.question
        const answer = answers[question.id]
        const isCorrect = answer?.is_correct
        const isEssay = question.type === 'essay'

        return (
            <Card key={eq.id} id={`question-${index}`} className={cn("transition-all duration-300", currentIndex === index && viewMode === 'scroll' ? "ring-2 ring-primary ring-offset-2" : "")}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">Q{index + 1}</Badge>
                            {isEssay ? (
                                <Badge variant="secondary">
                                    <HelpCircle className="w-3 h-3 mr-1" />
                                    Pending Review
                                </Badge>
                            ) : isCorrect ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Correct
                                </Badge>
                            ) : (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Incorrect
                                </Badge>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {answer?.points_awarded ?? 0} / {eq.points} pts
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Question */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <MarkdownViewer content={question.prompt_md} />
                    </div>

                    {/* Student Answer */}
                    <div>
                        <h4 className="text-sm font-medium mb-2">Your Answer:</h4>
                        <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : isCorrect === false ? 'bg-red-50 border-red-200' : 'bg-muted border-muted-foreground/20'}`}>
                            {!answer?.answer_json ? (
                                <span className="text-muted-foreground italic">No answer</span>
                            ) : question.type === 'mcq_single' ? (
                                <span>{getOptionText(question.options_json, answer.answer_json)}</span>
                            ) : question.type === 'mcq_multi' ? (
                                <span>{(answer.answer_json as string[]).map(id => getOptionText(question.options_json, id)).join(', ')}</span>
                            ) : question.type === 'true_false' ? (
                                <span>{answer.answer_json ? 'True' : 'False'}</span>
                            ) : (
                                <span>{String(answer.answer_json)}</span>
                            )}
                        </div>
                    </div>

                    {/* Correct Answer (if not essay and explanation allowed) */}
                    {canShowExplanation && !isEssay && !isCorrect && isCorrect !== undefined && (
                        <div>
                            <h4 className="text-sm font-medium mb-2">Correct Answer:</h4>
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
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
                    )}

                    {/* Explanation */}
                    {canShowExplanation && question.explanation_md && (
                        <div>
                            <h4 className="text-sm font-medium mb-2">Explanation:</h4>
                            <div className="p-4 rounded-lg bg-accent/50 border">
                                <MarkdownViewer content={question.explanation_md} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div>
            {/* View Mode Toggle */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Review Answers</h2>
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

                            {/* Pagination Controls */}
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

                {/* Navigation Sidebar (Right on Desktop) */}
                <div className="lg:col-span-1 order-1 lg:order-2 mb-6 lg:mb-0">
                    <QuestionNavigator
                        questions={questions}
                        answers={answers}
                        currentIndex={currentIndex}
                        onNavigate={handleNavigate}
                        mode="review"
                    />
                </div>
            </div>
        </div>
    )
}
