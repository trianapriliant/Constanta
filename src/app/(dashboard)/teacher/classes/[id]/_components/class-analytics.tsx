'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Users, Trophy, TrendingUp, AlertCircle } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface ClassAnalyticsProps {
    classId: string
}

export function ClassAnalytics({ classId }: ClassAnalyticsProps) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<{
        totalStudents: number;
        avgClassScore: number;
        participationRate: number;
        examStats: any[];
        studentStats: any[];
    } | null>(null)

    useEffect(() => {
        const fetchAnalytics = async () => {
            const supabase = createClient()

            // 1. Get stats
            const { count: studentCount } = await supabase
                .from('class_members')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId)
                .eq('role', 'student')
                .eq('status', 'active')

            // 2. Get exams
            const { data: exams } = await supabase
                .from('exams')
                .select('id, title, max_score')
                .eq('class_id', classId)
                .order('created_at', { ascending: false })

            if (!exams || exams.length === 0) {
                setStats({
                    totalStudents: studentCount || 0,
                    avgClassScore: 0,
                    participationRate: 0,
                    examStats: [],
                    studentStats: []
                })
                setLoading(false)
                return
            }

            const examIds = exams.map(e => e.id)

            // 3. Get all graded/submitted attempts
            const { data: attempts } = await supabase
                .from('attempts')
                .select(`
                    score,
                    max_score,
                    status,
                    exam_id,
                    student:profiles(name, email)
                `)
                .in('exam_id', examIds)
                .in('status', ['submitted', 'graded'])

            // Process Exam Stats
            const examStats = exams.map(exam => {
                const examAttempts = attempts?.filter(a => a.exam_id === exam.id) || []
                const totalScore = examAttempts.reduce((sum, a) => sum + (a.score || 0), 0)
                const avgScore = examAttempts.length > 0 ? totalScore / examAttempts.length : 0
                const participation = studentCount ? (examAttempts.length / studentCount) * 100 : 0

                return {
                    id: exam.id,
                    title: exam.title,
                    maxScore: exam.max_score,
                    avgScore,
                    attemptCount: examAttempts.length,
                    participation
                }
            })

            // Process Student Stats
            const studentMap: Record<string, { name: string, email: string, totalScore: number, totalMax: number, examsTaken: number }> = {}

            attempts?.forEach(a => {
                // Handle student relation (could be array or object depending on query)
                const studentData = Array.isArray(a.student) ? a.student[0] : a.student
                const email = studentData?.email || 'unknown'

                if (!studentMap[email]) {
                    studentMap[email] = {
                        name: studentData?.name || 'Unknown',
                        email: email,
                        totalScore: 0,
                        totalMax: 0,
                        examsTaken: 0
                    }
                }
                studentMap[email].totalScore += (a.score || 0)
                studentMap[email].totalMax += (a.max_score || 0)
                studentMap[email].examsTaken += 1
            })

            const studentStats = Object.values(studentMap)
                .map(s => ({
                    ...s,
                    avgPercentage: s.totalMax > 0 ? (s.totalScore / s.totalMax) * 100 : 0
                }))
                .sort((a, b) => b.avgPercentage - a.avgPercentage)

            // Overall Class Stats
            const totalAvgPercentage = studentStats.reduce((sum, s) => sum + s.avgPercentage, 0)
            const overallAvg = studentStats.length > 0 ? totalAvgPercentage / studentStats.length : 0

            const totalAttempts = attempts?.length || 0
            const totalPossibleAttempts = (studentCount || 0) * exams.length
            const overallParticipation = totalPossibleAttempts > 0 ? (totalAttempts / totalPossibleAttempts) * 100 : 0

            setStats({
                totalStudents: studentCount || 0,
                avgClassScore: overallAvg,
                participationRate: overallParticipation,
                examStats,
                studentStats
            })
            setLoading(false)
        }

        fetchAnalytics()
    }, [classId])

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(stats.avgClassScore)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Class average across all exams
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(stats.participationRate)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Average exam completion rate
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Student</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
                            {stats.studentStats[0]?.name || '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.studentStats[0] ? `${Math.round(stats.studentStats[0].avgPercentage)}% average score` : 'No data yet'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Exam Performance */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Exam Performance</CardTitle>
                        <CardDescription>Average scores per exam</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.examStats.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">
                                No exams found
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.examStats.map((exam) => (
                                    <div key={exam.id} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{exam.title}</span>
                                            <span className="text-muted-foreground">
                                                Avg: {exam.avgScore.toFixed(1)} / {exam.maxScore}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full gradient-teal transition-all"
                                                style={{ width: `${(exam.avgScore / exam.maxScore) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{exam.attemptCount} attempts</span>
                                            <span>{Math.round(exam.participation)}% participation</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Student Leaderboard */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Student Performance</CardTitle>
                        <CardDescription>Based on average percentage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.studentStats.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">
                                No student data available
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="text-right">Exams</TableHead>
                                        <TableHead className="text-right">Average</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.studentStats.slice(0, 5).map((student) => (
                                        <TableRow key={student.email}>
                                            <TableCell className="font-medium">
                                                <div>{student.name}</div>
                                                <div className="text-xs text-muted-foreground">{student.email}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{student.examsTaken}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={student.avgPercentage >= 70 ? 'outline' : 'secondary'}>
                                                    {Math.round(student.avgPercentage)}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
