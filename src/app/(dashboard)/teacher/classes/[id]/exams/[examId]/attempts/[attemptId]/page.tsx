import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User } from 'lucide-react'
import { GradingQuestionsSection } from './_components/grading-questions-section'

interface GradingPageProps {
    params: Promise<{ id: string; examId: string; attemptId: string }>
}

export default async function GradingPage({ params }: GradingPageProps) {
    const { id: classId, examId, attemptId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify teacher access
    const { data: membership } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', classId)
        .eq('user_id', user.id)
        .in('role', ['owner', 'teacher'])
        .single() as { data: any }

    if (!membership) {
        notFound()
    }

    // Get attempt with student info
    const { data: attempt } = await supabase
        .from('attempts')
        .select('*, student:profiles(*)')
        .eq('id', attemptId)
        .single() as { data: any }

    if (!attempt) {
        notFound()
    }

    // Get exam details
    const { data: exam } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single() as { data: any }

    // Get questions with structure
    const { data: examQuestions } = await supabase
        .from('exam_questions')
        .select('*, question:questions(*)')
        .eq('exam_id', examId)
        .order('order_index') as { data: any[] }

    // Get answers
    const { data: attemptAnswers } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attemptId) as { data: any[] }

    const answersMap: Record<string, any> = {}
    attemptAnswers?.forEach((a) => {
        answersMap[a.question_id] = a
    })

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Link
                href={`/teacher/classes/${classId}/exams/${examId}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exam Details
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Grading: {attempt.student?.name}</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <span>{exam.title}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(attempt.submitted_at || attempt.updated_at).toLocaleString()}
                        </span>
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant={
                        attempt.status === 'graded' ? 'default' :
                            attempt.status === 'submitted' ? 'secondary' : 'outline'
                    }>
                        {attempt.status.toUpperCase()}
                    </Badge>
                    <div className="font-bold text-xl">
                        {attempt.score || 0} / {attempt.max_score}
                    </div>
                </div>
            </div>

            <GradingQuestionsSection
                questions={examQuestions}
                answers={answersMap}
                attemptId={attemptId}
            />
        </div>
    )
}
