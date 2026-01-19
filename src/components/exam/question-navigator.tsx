'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Flag, Check, X, HelpCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionNavigatorProps {
    questions: any[]
    answers: Record<string, any>
    currentIndex: number
    onNavigate: (index: number) => void
    flagged?: Record<string, boolean>
    mode: 'take' | 'review'
    className?: string
}

export function QuestionNavigator({
    questions,
    answers,
    currentIndex,
    onNavigate,
    flagged = {},
    mode = 'take',
    className
}: QuestionNavigatorProps) {
    const answeredCount = mode === 'take'
        ? Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== undefined && answers[k] !== '').length
        : questions.length // In review, usually all are considered 'processed' or we count actual answers

    return (
        <Card className={cn("sticky top-20 shadow-sm border-muted", className)}>
            <CardContent className="p-2 lg:p-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs lg:text-sm font-medium">Questions</span>
                    <span className="text-[10px] lg:text-xs text-muted-foreground">
                        {mode === 'take' ? `${answeredCount}/${questions.length} answered` : `${questions.length} questions`}
                    </span>
                </div>
                <div className="grid grid-cols-10 sm:grid-cols-12 lg:grid-cols-5 gap-1 lg:gap-2">
                    {questions.map((q, i) => {
                        const questionId = q.question_id || q.id

                        let statusColor = 'bg-muted hover:bg-muted/80 text-foreground'
                        let IndicatorIcon: React.ReactNode = null

                        if (mode === 'take') {
                            const isAnswered = answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== ''
                            if (isAnswered) statusColor = 'bg-primary text-white'

                            if (flagged[questionId]) {
                                IndicatorIcon = (
                                    <div className={cn(
                                        "absolute top-0 right-0 w-2 h-2 rounded-full transform translate-x-1/3 -translate-y-1/3 lg:translate-x-0 lg:-translate-y-0 lg:static lg:w-3 lg:h-3",
                                        isAnswered ? "bg-yellow-400" : "text-yellow-500"
                                    )}>
                                        <Flag className="w-full h-full lg:block hidden fill-current" />
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full lg:hidden block" />
                                    </div>
                                )
                            }
                        } else {
                            // Review Mode
                            const answer = answers[questionId]
                            const isCorrect = answer?.is_correct
                            const isEssay = q.question?.type === 'essay' // Handling nested question object structure

                            if (isEssay) {
                                statusColor = 'bg-yellow-100 text-yellow-700 border-yellow-200 border'
                            } else if (isCorrect === true) {
                                statusColor = 'bg-green-100 text-green-700 border-green-200 border'
                            } else if (isCorrect === false) {
                                statusColor = 'bg-red-100 text-red-700 border-red-200 border'
                            } else {
                                statusColor = 'bg-muted text-muted-foreground' // Unanswered or unknown
                            }
                        }

                        const isCurrent = i === currentIndex

                        return (
                            <button
                                key={questionId}
                                onClick={() => onNavigate(i)}
                                className={cn(
                                    "relative flex items-center justify-center font-medium transition-all h-8 lg:h-auto lg:aspect-square text-xs lg:text-sm rounded select-none",
                                    statusColor,
                                    isCurrent && "ring-2 ring-primary z-10"
                                )}
                            >
                                {i + 1}
                                {IndicatorIcon}
                            </button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
