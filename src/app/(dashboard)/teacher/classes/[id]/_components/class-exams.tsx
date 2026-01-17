'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, FileQuestion, Clock, Eye, EyeOff, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Exam } from '@/types/database'

interface ClassExamsProps {
    classId: string
}

export function ClassExams({ classId }: ClassExamsProps) {
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchExams() {
            const supabase = createClient()
            const { data } = await supabase
                .from('exams')
                .select(`
                    *,
                    attempts (
                        id,
                        status,
                        score
                    )
                `)
                .eq('class_id', classId)
                .order('created_at', { ascending: false })

            // Transform data to include stats
            const examsWithStats = data?.map((exam: any) => {
                const attempts = exam.attempts || []
                const submittedCount = attempts.filter((a: any) => a.status === 'submitted' || a.status === 'graded').length
                const ungradedCount = attempts.filter((a: any) => a.status === 'submitted').length // Assuming 'submitted' means waiting for grade if manual? Or just status check.

                const gradedAttempts = attempts.filter((a: any) => a.status === 'graded')
                const totalScore = gradedAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0)
                const avgScore = gradedAttempts.length > 0 ? Math.round((totalScore / gradedAttempts.length) * 10) / 10 : null

                return {
                    ...exam,
                    stats: {
                        totalAttempts: attempts.length,
                        submittedCount,
                        ungradedCount,
                        avgScore
                    }
                }
            })

            setExams(examsWithStats || [])
            setLoading(false)
        }

        fetchExams()
    }, [classId])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Exams</CardTitle>
                    <CardDescription>Assessments and quizzes</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Link href={`/teacher/classes/${classId}/exams/new`}>
                        <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                            <Plus className="w-4 h-4" />
                            Create Exam
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {exams.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No exams yet. Create your first exam!</p>
                        <p className="text-sm mt-2">
                            Tip: Add questions to your question bank first, then create an exam.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {exams.map((exam) => (
                            <Link
                                key={exam.id}
                                href={`/teacher/classes/${classId}/exams/${exam.id}`}
                            >
                                <div className="p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border flex items-center justify-center shrink-0">
                                                <FileQuestion className="w-6 h-6 text-teal-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-lg group-hover:text-teal-700 transition-colors">{exam.title}</h4>
                                                    <Badge variant={exam.published ? 'default' : 'secondary'} className="h-5 text-[10px] px-1.5">
                                                        {exam.published ? (
                                                            <><Eye className="w-3 h-3 mr-1" /> Published</>
                                                        ) : (
                                                            <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                                                        )}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {exam.duration_minutes} min
                                                    </span>
                                                    {(exam as any).stats?.submittedCount > 0 && (
                                                        <span className="flex items-center gap-1.5 text-foreground font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                            {(exam as any).stats?.submittedCount} students attempted
                                                        </span>
                                                    )}
                                                    {(exam as any).stats?.avgScore !== null && (exam as any).stats?.avgScore > 0 && (
                                                        <span className="flex items-center gap-1.5 text-foreground font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            Avg: {(exam as any).stats?.avgScore}%
                                                        </span>
                                                    )}
                                                    {exam.start_at && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(exam.start_at).toLocaleDateString()}
                                                            {exam.end_at && ` - ${new Date(exam.end_at).toLocaleDateString()}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start">
                                            {(exam as any).stats?.ungradedCount > 0 && (
                                                <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 border-orange-600 text-white">
                                                    {(exam as any).stats?.ungradedCount} Needs Grading
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar for Grading? Optional, maybe later */}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
