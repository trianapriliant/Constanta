import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Clock, Users, Calendar, Eye, EyeOff, FileQuestion, BarChart3 } from 'lucide-react'
import { MarkdownViewer } from '@/components/markdown'

interface ExamDetailPageProps {
    params: Promise<{ id: string; examId: string }>
}

export default async function TeacherExamDetailPage({ params }: ExamDetailPageProps) {
    const { id, examId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify teacher access
    const { data: membership } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'teacher'])
        .eq('status', 'active')
        .single() as { data: any }

    if (!membership) {
        notFound()
    }

    // Get exam details with questions
    const { data: exam } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .eq('class_id', id)
        .single() as { data: any }

    if (!exam) {
        notFound()
    }

    // Get exam questions
    const { data: examQuestions } = await supabase
        .from('exam_questions')
        .select('*, question:questions(*)')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true }) as { data: any[] | null }

    // Get attempts
    const { data: attempts } = await supabase
        .from('attempts')
        .select('*, student:profiles(name, email)')
        .eq('exam_id', examId)
        .order('created_at', { ascending: false }) as { data: any[] | null }

    // Get class name
    const { data: classData } = await supabase
        .from('classes')
        .select('title')
        .eq('id', id)
        .single() as { data: any }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const typeLabels: Record<string, string> = {
        mcq_single: 'Multiple Choice',
        mcq_multi: 'Multi-Select',
        true_false: 'True/False',
        numeric: 'Numeric',
        short_text: 'Short Answer',
        essay: 'Essay',
    }

    const totalPoints = examQuestions?.reduce((sum, eq) => sum + eq.points, 0) || 0
    const completedAttempts = attempts?.filter(a => a.status === 'submitted' || a.status === 'graded') || []
    const avgScore = completedAttempts.length > 0
        ? (completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length).toFixed(1)
        : '-'

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link href={`/teacher/classes/${id}`} className="hover:text-foreground">
                    {classData?.title}
                </Link>
                <span>/</span>
                <span>Exams</span>
                <span>/</span>
                <span className="text-foreground">{exam.title}</span>
            </div>

            <Link
                href={`/teacher/classes/${id}?tab=exams`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
            </Link>

            {/* Exam Header */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-3">
                                {exam.title}
                                <Badge variant={exam.published ? 'default' : 'secondary'}>
                                    {exam.published ? (
                                        <><Eye className="w-3 h-3 mr-1" /> Published</>
                                    ) : (
                                        <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                                    )}
                                </Badge>
                            </CardTitle>
                            {exam.description_md && (
                                <div className="mt-2 text-muted-foreground">
                                    <MarkdownViewer content={exam.description_md} />
                                </div>
                            )}
                        </div>
                        <Link href={`/teacher/classes/${id}/exams/${examId}/edit`}>
                            <Button variant="outline">Edit Exam</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Duration</span>
                            </div>
                            <p className="font-semibold">{exam.duration_minutes} minutes</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <FileQuestion className="w-4 h-4" />
                                <span className="text-sm">Questions</span>
                            </div>
                            <p className="font-semibold">{examQuestions?.length || 0} ({totalPoints} pts)</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Attempts</span>
                            </div>
                            <p className="font-semibold">{attempts?.length || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-sm">Avg Score</span>
                            </div>
                            <p className="font-semibold">{avgScore}</p>
                        </div>
                    </div>
                    {(exam.start_at || exam.end_at) && (
                        <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                            {exam.start_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Starts: {formatDate(exam.start_at)}
                                </span>
                            )}
                            {exam.end_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Ends: {formatDate(exam.end_at)}
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="questions">
                <TabsList className="mb-4">
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="attempts">Student Attempts</TabsTrigger>
                </TabsList>

                <TabsContent value="questions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Exam Questions</CardTitle>
                            <CardDescription>
                                {examQuestions?.length || 0} questions totaling {totalPoints} points
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!examQuestions || examQuestions.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">
                                    No questions added to this exam yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {examQuestions.map((eq, index) => (
                                        <div key={eq.id} className="p-4 rounded-lg border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            Q{index + 1}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {typeLabels[eq.question?.type] || eq.question?.type}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {eq.points} pts
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm line-clamp-2">
                                                        {eq.question?.prompt_md?.replace(/[#*`]/g, '').substring(0, 150)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attempts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Attempts</CardTitle>
                            <CardDescription>
                                {attempts?.length || 0} total attempts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!attempts || attempts.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">
                                    No students have attempted this exam yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {attempts.map((attempt) => (
                                        <Link
                                            key={attempt.id}
                                            href={`/teacher/classes/${id}/exams/${examId}/attempts/${attempt.id}`}
                                            className="block"
                                        >
                                            <div className="p-4 rounded-lg border flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                <div>
                                                    <p className="font-medium">{attempt.student?.name}</p>
                                                    <p className="text-sm text-muted-foreground">{attempt.student?.email}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Started: {formatDate(attempt.started_at)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={
                                                        attempt.status === 'graded' ? 'default' :
                                                            attempt.status === 'submitted' ? 'secondary' : 'outline'
                                                    }>
                                                        {attempt.status}
                                                    </Badge>
                                                    {(attempt.status === 'submitted' || attempt.status === 'graded') && (
                                                        <p className="text-lg font-semibold mt-1">
                                                            {attempt.score}/{attempt.max_score}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
