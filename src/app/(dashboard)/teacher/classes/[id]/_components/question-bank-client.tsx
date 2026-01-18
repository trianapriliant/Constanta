'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileQuestion, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuestionActions } from '../questions/_components/question-actions'
import { QuestionsTable } from '../questions/_components/questions-table'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface QuestionBankClientProps {
    classId: string
    questions: any[]
}

export function QuestionBankClient({ classId, questions }: QuestionBankClientProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

    const difficultyColors = {
        easy: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        hard: 'bg-red-100 text-red-700',
    }

    const typeLabels: Record<string, string> = {
        mcq_single: 'Multiple Choice',
        mcq_multi: 'Multi-Select',
        true_false: 'True/False',
        numeric: 'Numeric',
        short_text: 'Short Answer',
        essay: 'Essay',
        canvas: 'Canvas / Drawing',
    }

    return (
        <Card className="min-h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                    <CardTitle>Question Bank</CardTitle>
                    <CardDescription>{questions?.length || 0} questions available</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <div className="border rounded-lg p-0.5 bg-muted/50 hidden sm:flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`h-7 px-2 ${viewMode === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:bg-transparent hover:text-foreground'}`}
                        >
                            <LayoutGrid className="w-4 h-4 mr-1" />
                            Grid
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className={`h-7 px-2 ${viewMode === 'table' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:bg-transparent hover:text-foreground'}`}
                        >
                            <List className="w-4 h-4 mr-1" />
                            Table
                        </Button>
                    </div>

                    <Link href={`/teacher/classes/${classId}/questions/new`}>
                        <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                            <Plus className="w-4 h-4" />
                            Add Question
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {!questions || questions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No questions yet. Create your first question!</p>
                        <p className="text-sm mt-2">
                            Questions created here can be used in your exams.
                        </p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="space-y-3">
                                {questions.map((q: any) => {
                                    // Derive usage count for grid view too if needed, though usually tables show it clearly
                                    const usageCount = q.exam_questions?.[0]?.count ?? 0

                                    return (
                                        <div key={q.id} className="p-4 rounded-xl border hover:bg-muted/50 transition-colors bg-card group">
                                            <div className="flex items-start justify-between gap-4">
                                                <Link
                                                    href={`/teacher/classes/${classId}/questions/${q.id}`}
                                                    className="flex-1 min-w-0"
                                                >
                                                    <p className="font-medium line-clamp-2 text-sm text-foreground group-hover:text-teal-700 transition-colors">
                                                        {q.prompt_md.replace(/[#*`]/g, '').substring(0, 150)}
                                                        {q.prompt_md.length > 150 ? '...' : ''}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <Badge variant="outline" className="text-xs">
                                                            {typeLabels[q.type as string] || q.type}
                                                        </Badge>
                                                        <Badge className={`text-xs ${difficultyColors[q.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-700'}`}>
                                                            {q.difficulty}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {q.points} pts
                                                        </Badge>
                                                        {q.tags && q.tags.slice(0, 3).map((tag: string) => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                        {usageCount > 0 && (
                                                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-slate-200">
                                                                Used {usageCount}x
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <QuestionActions classId={classId} questionId={q.id} variant="icon" />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <QuestionsTable questions={questions} classId={classId} />
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
