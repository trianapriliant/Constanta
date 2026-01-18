import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FileQuestion } from 'lucide-react'
import { QuestionActions } from '../questions/_components/question-actions'

interface ClassQuestionsProps {
    classId: string
}

export async function ClassQuestions({ classId }: ClassQuestionsProps) {
    const supabase = await createClient()

    // Get questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

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
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Question Bank</CardTitle>
                    <CardDescription>{questions?.length || 0} questions available</CardDescription>
                </div>
                <Link href={`/teacher/classes/${classId}/questions/new`}>
                    <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                        <Plus className="w-4 h-4" />
                        Add Question
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {!questions || questions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No questions yet. Create your first question!</p>
                        <p className="text-sm mt-2">
                            Questions created here can be used in your exams.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((q: any) => (
                            <div key={q.id} className="p-4 rounded-xl border hover:bg-muted/50 transition-colors bg-card">
                                <div className="flex items-start justify-between gap-4">
                                    <Link
                                        href={`/teacher/classes/${classId}/questions/${q.id}`}
                                        className="flex-1 min-w-0 group"
                                    >
                                        <p className="font-medium line-clamp-2 text-sm group-hover:text-teal-700 transition-colors">
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
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <QuestionActions classId={classId} questionId={q.id} variant="icon" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
