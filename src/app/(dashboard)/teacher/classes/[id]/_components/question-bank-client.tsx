'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileQuestion, LayoutGrid, List, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuestionActions } from '../questions/_components/question-actions'
import { QuestionsTable } from '../questions/_components/questions-table'
import { Checkbox } from '@/components/ui/checkbox'
import { exportQuestionsToWord } from '@/lib/docx/export-questions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuestionExportDialog } from './question-export-dialog'

interface QuestionBankClientProps {
    classId: string
    questions: any[]
}

export function QuestionBankClient({ classId, questions }: QuestionBankClientProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

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

    const toggleSelection = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedQuestions(prev => [...prev, id])
        } else {
            setSelectedQuestions(prev => prev.filter(qId => qId !== id))
        }
    }

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedQuestions(questions.map(q => q.id))
        } else {
            setSelectedQuestions([])
        }
    }

    // Prepare data for export dialog
    const selectedQuestionData = questions.filter(q => selectedQuestions.includes(q.id))

    return (
        <div className="space-y-4">
            <Card className="min-h-[500px]">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <div>
                        <CardTitle>Question Bank</CardTitle>
                        <CardDescription>{questions?.length || 0} questions available</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedQuestions.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                onClick={() => setIsExportDialogOpen(true)}
                            >
                                <FileDown className="w-4 h-4" />
                                Export ({selectedQuestions.length})
                            </Button>
                        )}

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
                                    <div className="flex items-center gap-2 pb-2">
                                        <Checkbox
                                            id="select-all"
                                            checked={questions.length > 0 && selectedQuestions.length === questions.length}
                                            onCheckedChange={(checked) => toggleAll(checked as boolean)}
                                        />
                                        <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer select-none">
                                            Select All
                                        </label>
                                    </div>
                                    {questions.map((q: any) => {
                                        // Derive usage count for grid view too if needed, though usually tables show it clearly
                                        const usageCount = q.exam_questions?.[0]?.count ?? 0
                                        const isSelected = selectedQuestions.includes(q.id)

                                        return (
                                            <div key={q.id} className={`p-4 rounded-xl border transition-colors bg-card group relative ${isSelected ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'}`}>
                                                <div className="absolute top-4 left-4 z-10">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => toggleSelection(q.id, checked as boolean)}
                                                    />
                                                </div>
                                                <div className="flex items-start justify-between gap-4 pl-8">
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
                                                                <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-dashed">
                                                                    Used {usageCount > 1 ? `(${usageCount})` : ''}
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
                                <QuestionsTable
                                    questions={questions}
                                    classId={classId}
                                    selectedQuestions={selectedQuestions}
                                    onToggleSelection={toggleSelection}
                                    onToggleAll={toggleAll}
                                />
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <QuestionExportDialog
                open={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                questions={selectedQuestionData}
            />
        </div>
    )
}
