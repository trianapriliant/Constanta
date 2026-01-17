import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowLeft, FileQuestion, Filter } from 'lucide-react'

interface QuestionsPageProps {
    params: Promise<{ id: string }>
}

export default async function QuestionsPage({ params }: QuestionsPageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify teacher access
    const { data: membership } = await supabase
        .from('class_members')
        .select('role, classes(title)')
        .eq('class_id', id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'teacher'])
        .eq('status', 'active')
        .single() as { data: any }

    if (!membership) {
        notFound()
    }

    const className = (membership.classes as any)?.title

    // Get questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('class_id', id)
        .order('created_at', { ascending: false }) as { data: any[] | null }

    const difficultyColors = {
        easy: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        hard: 'bg-red-100 text-red-700',
    }

    const typeLabels = {
        mcq_single: 'Multiple Choice',
        mcq_multi: 'Multi-Select',
        true_false: 'True/False',
        numeric: 'Numeric',
        short_text: 'Short Answer',
        essay: 'Essay',
    }

    return (
        <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link href={`/teacher/classes/${id}`} className="hover:text-foreground">
                    {className}
                </Link>
                <span>/</span>
                <span>Question Bank</span>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Question Bank</h1>
                    <p className="text-muted-foreground">
                        {questions?.length || 0} questions
                    </p>
                </div>
                <Link href={`/teacher/classes/${id}/questions/new`}>
                    <Button className="gap-2 gradient-teal text-white border-0">
                        <Plus className="w-4 h-4" />
                        Add Question
                    </Button>
                </Link>
            </div>

            {!questions || questions.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create questions to use in your exams
                        </p>
                        <Link href={`/teacher/classes/${id}/questions/new`}>
                            <Button className="gap-2 gradient-teal text-white border-0">
                                <Plus className="w-4 h-4" />
                                Create First Question
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {questions.map((q: any) => (
                        <Link key={q.id} href={`/teacher/classes/${id}/questions/${q.id}`}>
                            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium line-clamp-2">
                                                {q.prompt_md.replace(/[#*`]/g, '').substring(0, 150)}
                                                {q.prompt_md.length > 150 ? '...' : ''}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <Badge variant="outline" className="text-xs">
                                                    {typeLabels[q.type as keyof typeof typeLabels]}
                                                </Badge>
                                                <Badge className={`text-xs ${difficultyColors[q.difficulty as keyof typeof difficultyColors]}`}>
                                                    {q.difficulty}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {q.points} pts
                                                </Badge>
                                                {q.tags.slice(0, 3).map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
