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
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: false })

            setExams(data || [])
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
                    <Link href={`/teacher/classes/${classId}/questions`}>
                        <Button size="sm" variant="outline" className="gap-2">
                            Question Bank
                        </Button>
                    </Link>
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
                                <div className="p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                                                <FileQuestion className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{exam.title}</h4>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {exam.duration_minutes} min
                                                    </span>
                                                    {exam.start_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(exam.start_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={exam.published ? 'default' : 'secondary'}>
                                            {exam.published ? (
                                                <><Eye className="w-3 h-3 mr-1" /> Published</>
                                            ) : (
                                                <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
