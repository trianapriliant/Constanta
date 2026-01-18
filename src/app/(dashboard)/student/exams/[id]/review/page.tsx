import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MarkdownViewer } from '@/components/markdown'
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, Clock, Trophy } from 'lucide-react'
import { ReviewQuestionsSection } from './_components/review-questions-section'

interface ReviewPageProps {
    params: Promise<{ id: string }>
}

export default async function ReviewExamPage({ params }: ReviewPageProps) {
    const { id: examId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get the submitted attempt
    const { data: attempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .in('status', ['submitted', 'graded'])
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single()

    if (!attempt) {
        notFound()
    }

    // Get exam details
    const { data: exam } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

    if (!exam) {
        notFound()
    }

    // Check explanation policy
    const canShowExplanation =
        exam.explanation_policy === 'after_submit' ||
        (exam.explanation_policy === 'after_end' && exam.end_at && new Date(exam.end_at) < new Date())

    // Get exam questions with answers
    const { data: examQuestions } = await supabase
        .from('exam_questions')
        .select(`
      *,
      question:questions(*)
    `)
        .eq('exam_id', examId)
        .order('order_index')

    // Get student answers
    const { data: attemptAnswers } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attempt.id)

    const answersMap: Record<string, any> = {}
    attemptAnswers?.forEach((a) => {
        answersMap[a.question_id] = a
    })

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}m ${s}s`
    }

    const percentage = attempt.max_score && attempt.max_score > 0
        ? Math.round((attempt.score || 0) / attempt.max_score * 100)
        : 0

    const getOptionText = (optionsJson: any, optionId: string) => {
        const options = optionsJson as any[]
        const option = options?.find((o) => o.id === optionId)
        return option?.text_md || optionId
    }

    // Check result policy
    const resultPolicy = exam.result_policy || 'immediate'
    const isGraded = attempt.status === 'graded'
    const isExamEnded = exam.end_at && new Date(exam.end_at) < new Date()

    const canShowResults =
        resultPolicy === 'immediate' ||
        (resultPolicy === 'when_graded' && isGraded) ||
        (resultPolicy === 'after_end' && isExamEnded)

    if (!canShowResults) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link
                    href={`/student/classes/${exam.class_id}?tab=exams`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Class
                </Link>

                <Card className="text-center py-12">
                    <CardContent>
                        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Exam Submitted</h1>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Your attempt has been submitted successfully.
                            {resultPolicy === 'when_graded'
                                ? " Scores will be available once the teacher has finished grading."
                                : " Results will be available after the exam period ends."}
                        </p>
                        <Link href={`/student/classes/${exam.class_id}?tab=exams`}>
                            <Button className="mt-8">Return to Class</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link
                href={`/student/classes/${exam.class_id}?tab=exams`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
            </Link>

            {/* Results Summary */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full gradient-teal mx-auto flex items-center justify-center mb-4">
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
                        <p className="text-muted-foreground mb-6">
                            {isGraded ? 'Exam Graded' : 'Exam Completed (Pending Manual Review)'}
                        </p>

                        <div className="flex justify-center gap-8">
                            <div>
                                <div className="text-4xl font-bold gradient-teal-text">
                                    {attempt.score?.toFixed(1) || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    out of {attempt.max_score}
                                </div>
                            </div>
                            <Separator orientation="vertical" className="h-16" />
                            <div>
                                <div className="text-4xl font-bold">
                                    {percentage}%
                                </div>
                                <div className="text-sm text-muted-foreground">Score</div>
                            </div>
                            <Separator orientation="vertical" className="h-16" />
                            <div>
                                <div className="text-4xl font-bold flex items-center gap-1">
                                    <Clock className="w-6 h-6" />
                                    {formatTime(attempt.time_taken_seconds || 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Time Taken</div>
                            </div>
                        </div>

                        {exam.passing_score && isGraded && (
                            <div className="mt-6">
                                <Badge variant={percentage >= exam.passing_score ? 'default' : 'destructive'}>
                                    {percentage >= exam.passing_score ? 'PASSED' : 'NOT PASSED'}
                                    {' '}(Passing: {exam.passing_score}%)
                                </Badge>
                            </div>
                        )}
                        {exam.passing_score && !isGraded && (
                            <div className="mt-6">
                                <Badge variant="outline">
                                    Pending Grading
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Questions Review */}
            <ReviewQuestionsSection
                questions={examQuestions || []}
                answers={answersMap}
                canShowExplanation={canShowExplanation}
            />

            {/* Back button */}
            <div className="mt-8 text-center bg-transparent">
                <Link href={`/student/classes/${exam.class_id}?tab=exams`}>
                    <Button variant="outline">Back to Class</Button>
                </Link>
            </div>
        </div>
    )
}
