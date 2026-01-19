'use client'

import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { QuestionActions } from './question-actions'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { MarkdownViewer } from '@/components/markdown/viewer'
import { Checkbox } from '@/components/ui/checkbox'

interface QuestionsTableProps {
    questions: any[]
    classId: string
    selectedQuestions?: string[]
    onToggleSelection?: (id: string, checked: boolean) => void
    onToggleAll?: (checked: boolean) => void
}

export function QuestionsTable({
    questions,
    classId,
    selectedQuestions = [],
    onToggleSelection,
    onToggleAll
}: QuestionsTableProps) {
    const difficultyColors = {
        easy: 'bg-green-100 text-green-700 border-green-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        hard: 'bg-red-100 text-red-700 border-red-200',
    }

    const typeLabels: Record<string, string> = {
        mcq_single: 'Multiple Choice',
        mcq_multi: 'Multi-Select',
        true_false: 'True/False',
        numeric: 'Numeric',
        short_text: 'Short Answer',
        essay: 'Essay',
        canvas: 'Canvas',
    }

    const allSelected = questions.length > 0 && selectedQuestions.length === questions.length

    return (
        <div className="rounded-md border bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[40px] text-center">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={(checked) => onToggleAll?.(checked as boolean)}
                            />
                        </TableHead>
                        <TableHead className="w-[350px]">Question</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead className="text-center">Used</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {questions.map((q) => {
                        // Safely extract usage count
                        const usageCount = q.exam_questions?.[0]?.count ?? 0
                        const isSelected = selectedQuestions.includes(q.id)

                        return (
                            <TableRow key={q.id} className={`group hover:bg-muted/30 ${isSelected ? 'bg-muted/30' : ''}`}>
                                <TableCell className="text-center">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => onToggleSelection?.(q.id, checked as boolean)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium max-w-[350px]">
                                    <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={`/teacher/classes/${classId}/questions/${q.id}`}
                                                    className="block hover:text-teal-600 transition-colors truncate"
                                                >
                                                    {q.prompt_md.replace(/[#*`]/g, '')}
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[500px] p-4 bg-white text-slate-900 border shadow-xl">
                                                <div className="max-h-[300px] overflow-y-auto">
                                                    <MarkdownViewer content={q.prompt_md} className="text-xs" />
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
                                        {typeLabels[q.type as string] || q.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("text-xs shadow-none", difficultyColors[q.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-700')}>
                                        {q.difficulty}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">{q.points} pts</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {q.tags && q.tags.slice(0, 2).map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1 bg-slate-100 text-slate-600 border-slate-200">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {q.tags && q.tags.length > 2 && (
                                            <span className="text-[10px] text-muted-foreground">+{q.tags.length - 2}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
                                        {usageCount}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <QuestionActions classId={classId} questionId={q.id} variant="icon" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
