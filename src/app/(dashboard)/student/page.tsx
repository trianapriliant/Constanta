import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, FileQuestion, CheckCircle } from 'lucide-react'

export default async function StudentDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get classes where user is a student
    const { data: memberships } = await supabase
        .from('class_members')
        .select(`
      class_id,
      role,
      classes (
        id,
        title,
        description,
        subject,
        class_code
      )
    `)
        .eq('user_id', user?.id)
        .eq('role', 'student')
        .eq('status', 'active')

    const classes = memberships?.map(m => m.classes) || []
    const classIds = classes.map((c: any) => c?.id).filter(Boolean)

    // Get all published exams for the student's classes
    let allExams: any[] = []
    if (classIds.length > 0) {
        const { data } = await supabase
            .from('exams')
            .select(`
        *,
        classes (title)
      `)
            .in('class_id', classIds)
            .eq('published', true)
            .order('start_at', { ascending: true, nullsFirst: true })

        allExams = data || []
    }

    // Get user's attempts to determine exam status
    let attempts: any[] = []
    if (user && allExams.length > 0) {
        const { data } = await supabase
            .from('attempts')
            .select('exam_id, status, score, max_score')
            .eq('student_id', user.id)
            .in('exam_id', allExams.map(e => e.id))

        attempts = data || []
    }

    const attemptMap: Record<string, any> = {}
    attempts.forEach(a => {
        attemptMap[a.exam_id] = a
    })

    // Separate upcoming (not completed) and completed exams
    const upcomingExams = allExams.filter(e => {
        const attempt = attemptMap[e.id]
        return !attempt || attempt.status === 'in_progress'
    })

    const completedExams = allExams.filter(e => {
        const attempt = attemptMap[e.id]
        return attempt && (attempt.status === 'submitted' || attempt.status === 'graded')
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">My Classes</h1>
                <p className="text-muted-foreground mt-1">
                    View your enrolled classes and upcoming exams
                </p>
            </div>

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileQuestion className="w-5 h-5 text-primary" />
                            Upcoming Exams
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingExams.map((exam) => {
                                const attempt = attemptMap[exam.id]
                                const isInProgress = attempt?.status === 'in_progress'
                                const link = isInProgress
                                    ? `/student/exams/${exam.id}/take`
                                    : `/student/exams/${exam.id}`

                                return (
                                    <Link key={exam.id} href={link}>
                                        <div className="p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">{exam.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {exam.classes?.title}
                                                    </p>
                                                </div>
                                                <div className="text-right flex items-center gap-2">
                                                    {isInProgress && (
                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                                            In Progress
                                                        </Badge>
                                                    )}
                                                    <Badge>{exam.duration_minutes} min</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Completed Exams */}
            {completedExams.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Completed Exams
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {completedExams.map((exam) => {
                                const attempt = attemptMap[exam.id]
                                const scorePercent = attempt.max_score > 0
                                    ? Math.round((attempt.score / attempt.max_score) * 100)
                                    : 0

                                return (
                                    <Link key={exam.id} href={`/student/exams/${exam.id}/review`}>
                                        <div className="p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">{exam.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {exam.classes?.title}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={scorePercent >= 70 ? 'default' : 'secondary'}
                                                        className={scorePercent >= 70 ? 'bg-green-600' : ''}>
                                                        {attempt.score}/{attempt.max_score} ({scorePercent}%)
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No classes yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Join a class using a class code from your teacher
                        </p>
                        <Link href="/student/join">
                            <Button className="gap-2 gradient-teal text-white border-0">
                                <Plus className="w-4 h-4" />
                                Join Class
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls: any) => (
                        <Link key={cls.id} href={`/student/classes/${cls.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full pt-0 overflow-hidden">
                                <div className="h-2 gradient-teal" />
                                <CardHeader className="pb-3 pt-4">
                                    <CardTitle className="line-clamp-1">{cls.title}</CardTitle>
                                    {cls.subject && (
                                        <CardDescription>{cls.subject}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {cls.description || 'No description'}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
