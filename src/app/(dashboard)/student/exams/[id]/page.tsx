import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, FileQuestion, Calendar, AlertCircle, ArrowLeft, Play } from 'lucide-react'
import { MarkdownViewer } from '@/components/markdown'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ExamOverviewPageProps {
    params: Promise<{ id: string }>
}

export default async function ExamOverviewPage({ params }: ExamOverviewPageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get exam details
    const { data: exam } = await supabase
        .from('exams')
        .select(`
            *,
            classes (
                id,
                title,
                class_code
            )
        `)
        .eq('id', id)
        .eq('published', true)
        .single() as { data: any }

    if (!exam) {
        notFound()
    }

    // Verify student membership
    const { data: membership } = await supabase
        .from('class_members')
        .select('status')
        .eq('class_id', exam.class_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

    if (!membership) {
        redirect('/student')
    }

    // Check existing attempt
    const { data: attempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('exam_id', id)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    // Redirect based on status
    if (attempt) {
        if (attempt.status === 'in_progress') {
            redirect(`/student/exams/${id}/take`)
        } else if (attempt.status === 'submitted' || attempt.status === 'graded') {
            redirect(`/student/exams/${id}/review`)
        }
    }

    // Check if exam schedule allows entry
    const now = new Date()
    const startAt = exam.start_at ? new Date(exam.start_at) : null
    const endAt = exam.end_at ? new Date(exam.end_at) : null

    const isTooEarly = startAt && now < startAt
    const isTooLate = endAt && now > endAt

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link
                href="/student"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            <Card>
                <CardHeader>
                    <div className="mb-2">
                        <span className="text-sm text-muted-foreground">{exam.classes?.title}</span>
                    </div>
                    <CardTitle className="text-3xl">{exam.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Status Alerts */}
                    {isTooEarly && (
                        <Alert>
                            <Clock className="h-4 w-4" />
                            <AlertTitle>Not Started Yet</AlertTitle>
                            <AlertDescription>
                                This exam will be available on {formatDate(exam.start_at)}.
                            </AlertDescription>
                        </Alert>
                    )}
                    {isTooLate && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Exam Ended</AlertTitle>
                            <AlertDescription>
                                This exam ended on {formatDate(exam.end_at)}.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Description */}
                    {exam.description_md && (
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-lg">
                            <MarkdownViewer content={exam.description_md} />
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Duration</span>
                            </div>
                            <p className="font-semibold text-lg">{exam.duration_minutes} Minutes</p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <FileQuestion className="w-4 h-4" />
                                <span className="text-sm">Attempts Allowed</span>
                            </div>
                            <p className="font-semibold text-lg">{exam.max_attempts}</p>
                        </div>

                        {(exam.start_at || exam.end_at) && (
                            <div className="col-span-2 p-4 rounded-lg border bg-card">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">Schedule</span>
                                </div>
                                <div className="space-y-1">
                                    {exam.start_at && <p>Starts: {formatDate(exam.start_at)}</p>}
                                    {exam.end_at && <p>Ends: {formatDate(exam.end_at)}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <Link href={`/student/exams/${id}/take`}>
                            <Button
                                className="w-full h-12 text-lg gradient-teal text-white border-0"
                                disabled={isTooEarly || isTooLate}
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Start Exam
                            </Button>
                        </Link>
                        <p className="text-center text-xs text-muted-foreground mt-3">
                            Once you start, the timer will begin and cannot be paused.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
