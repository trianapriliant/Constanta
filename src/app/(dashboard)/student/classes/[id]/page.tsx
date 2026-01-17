import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, BookOpen, FileText, Clock, Calendar, Play, Megaphone } from 'lucide-react'
import { StudentClassFeed } from './_components/student-class-feed'

interface StudentClassPageProps {
    params: Promise<{ id: string }>
}

export default async function StudentClassPage({ params }: StudentClassPageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify student is a member of this class
    const { data: membership } = await supabase
        .from('class_members')
        .select('role, status')
        .eq('class_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single() as { data: any }

    if (!membership) {
        notFound()
    }

    // Get class details
    const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single() as { data: any }

    if (!classData) {
        notFound()
    }

    // Get published materials
    const { data: materials } = await supabase
        .from('materials')
        .select('*')
        .eq('class_id', id)
        .eq('published', true)
        .not('tags', 'cs', '{"announcement"}')
        .order('published_at', { ascending: false }) as { data: any[] | null }

    // Get published exams
    const { data: exams } = await supabase
        .from('exams')
        .select('*')
        .eq('class_id', id)
        .eq('published', true)
        .order('created_at', { ascending: false }) as { data: any[] | null }

    // Get user's attempts for each exam
    const { data: attempts } = await supabase
        .from('attempts')
        .select('exam_id, status, score, max_score')
        .eq('student_id', user.id) as { data: any[] | null }

    const attemptMap: Record<string, any> = {}
    attempts?.forEach((a: any) => {
        attemptMap[a.exam_id] = a
    })

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const getExamStatus = (exam: any) => {
        const now = new Date()
        const start = exam.start_at ? new Date(exam.start_at) : null
        const end = exam.end_at ? new Date(exam.end_at) : null
        const attempt = attemptMap[exam.id]

        if (attempt?.status === 'graded' || attempt?.status === 'submitted') {
            return { label: 'Completed', color: 'bg-green-100 text-green-700', canTake: false }
        }
        if (attempt?.status === 'in_progress') {
            return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', canTake: true }
        }
        if (start && now < start) {
            return { label: 'Not Started', color: 'bg-gray-100 text-gray-700', canTake: false }
        }
        if (end && now > end) {
            return { label: 'Ended', color: 'bg-red-100 text-red-700', canTake: false }
        }
        return { label: 'Available', color: 'bg-blue-100 text-blue-700', canTake: true }
    }

    return (
        <div>
            <Link
                href="/student"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            {/* Class Header */}
            <div className="mb-8">
                <div className="h-3 gradient-teal rounded-t-xl" />
                <Card className="rounded-t-none">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{classData.title}</CardTitle>
                                {classData.subject && (
                                    <CardDescription className="mt-1">{classData.subject}</CardDescription>
                                )}
                            </div>
                            <Badge variant="secondary" className="font-mono">
                                {classData.class_code}
                            </Badge>
                        </div>
                        {classData.description && (
                            <p className="text-muted-foreground mt-2">{classData.description}</p>
                        )}
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="feed">
                <TabsList className="mb-6">
                    <TabsTrigger value="feed" className="gap-2">
                        <Megaphone className="w-4 h-4" />
                        Feed
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Materials
                    </TabsTrigger>
                    <TabsTrigger value="exams" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        Exams
                    </TabsTrigger>
                </TabsList>

                {/* Feed Tab */}
                <TabsContent value="feed">
                    <StudentClassFeed classId={id} />
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent value="materials">
                    {!materials || materials.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No materials yet</h3>
                                <p className="text-muted-foreground">
                                    Your teacher hasn&apos;t published any materials yet.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {materials.map((material: any) => (
                                <Card key={material.id} className="hover:shadow-sm transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium">{material.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Published {formatDate(material.published_at)}
                                                </p>
                                            </div>
                                            <Link href={`/student/classes/${id}/materials/${material.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                        {material.tags?.length > 0 && (
                                            <div className="flex gap-2 mt-3">
                                                {material.tags.slice(0, 3).map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Exams Tab */}
                <TabsContent value="exams">
                    {!exams || exams.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No exams yet</h3>
                                <p className="text-muted-foreground">
                                    Your teacher hasn&apos;t published any exams yet.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {exams.map((exam: any) => {
                                const status = getExamStatus(exam)
                                const attempt = attemptMap[exam.id]

                                return (
                                    <Card key={exam.id} className="hover:shadow-sm transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium">{exam.title}</h3>
                                                        <Badge className={status.color}>
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {exam.duration_minutes} min
                                                        </span>
                                                        {exam.start_at && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatDate(exam.start_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {attempt && (attempt.status === 'graded' || attempt.status === 'submitted') && (
                                                        <p className="text-sm mt-2">
                                                            Score: <span className="font-medium">{attempt.score}/{attempt.max_score}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    {status.canTake ? (
                                                        <Link href={`/student/exams/${exam.id}/take`}>
                                                            <Button className="gap-2 gradient-teal text-white border-0">
                                                                <Play className="w-4 h-4" />
                                                                {attempt?.status === 'in_progress' ? 'Continue' : 'Start'}
                                                            </Button>
                                                        </Link>
                                                    ) : attempt ? (
                                                        <Link href={`/student/exams/${exam.id}/review`}>
                                                            <Button variant="outline">
                                                                Review
                                                            </Button>
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
