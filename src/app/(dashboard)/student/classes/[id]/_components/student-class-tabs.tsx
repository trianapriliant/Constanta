'use client'


import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, FileText, BookOpen, Clock, Calendar, Play, Link as LinkIcon, GraduationCap, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { StudentClassFeed } from './student-class-feed'
import { StudentClassLinks } from './student-class-links'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

interface StudentClassTabsProps {
    classId: string
    materials: any[] | null
    exams: any[] | null
    attemptMap: Record<string, any>
}

export function StudentClassTabs({
    classId,
    materials,
    exams,
    attemptMap,
}: StudentClassTabsProps) {
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'feed'
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

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

    if (!mounted) {
        return null // Avoid hydration mismatch on initial load for Tabs
    }

    return (
        <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="feed" className="gap-2">
                    <Megaphone className="w-4 h-4" />
                    Feed
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Materials
                </TabsTrigger>
                <TabsTrigger value="exams" className="gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Exams
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Links
                </TabsTrigger>
            </TabsList>

            {/* Feed Tab */}
            <TabsContent value="feed">
                <StudentClassFeed classId={classId} />
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
                    <Accordion type="multiple" className="space-y-4">
                        {Object.entries(
                            materials.reduce((acc: Record<string, Record<string, any[]>>, material: any) => {
                                const chapter = material.chapter || 'General Resources'
                                const topic = material.topic || 'Uncategorized'
                                if (!acc[chapter]) acc[chapter] = {}
                                if (!acc[chapter][topic]) acc[chapter][topic] = []
                                acc[chapter][topic].push(material)
                                return acc
                            }, {})
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([chapter, topics]) => {
                            const totalItems = Object.values(topics).reduce((sum: number, list: any) => sum + list.length, 0)
                            return (
                                <AccordionItem key={chapter} value={chapter} className="border rounded-lg overflow-hidden group/item">
                                    <AccordionTrigger className="hover:no-underline py-3 px-4 group/trigger">
                                        <div className="flex items-center gap-4 flex-1 text-left mr-4">
                                            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0 group-hover/trigger:bg-teal-100 transition-colors">
                                                <FolderOpen className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg leading-tight group-hover/trigger:text-teal-700 transition-colors">{chapter}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="secondary" className="text-[10px] font-normal h-4 px-1.5">
                                                        {totalItems} materials
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-muted/10 space-y-3 pt-2 border-t">
                                        {Object.entries(topics).sort(([a], [b]) => a.localeCompare(b)).map(([topic, items]) => (
                                            <div key={topic}>
                                                <div className="flex items-center gap-2 mb-2 mt-2">
                                                    <div className="h-px bg-border flex-1" />
                                                    <h4 className="text-xs font-semibold text-muted-foreground px-3 py-1 bg-white border rounded-full uppercase tracking-wider shadow-sm">
                                                        {topic}
                                                    </h4>
                                                    <div className="h-px bg-border flex-1" />
                                                </div>
                                                <div className="grid gap-2">
                                                    {(items as any[]).map((material: any) => (
                                                        <Card key={material.id} className="hover:shadow-sm transition-shadow border-l-4 border-l-teal-500/0 hover:border-l-teal-500 bg-card">
                                                            <CardContent className="px-4 py-2 flex items-center justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 h-4 px-1 bg-white">
                                                                            {material.category || 'Material'}
                                                                        </Badge>
                                                                        <h3 className="font-medium text-sm leading-tight text-foreground/90">{material.title}</h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            {formatDate(material.published_at)}
                                                                        </span>
                                                                        {material.tags?.length > 0 && (
                                                                            <div className="flex gap-1 items-center">
                                                                                <span className="text-[10px] text-muted-foreground">•</span>
                                                                                {material.tags.slice(0, 3).map((tag: string) => (
                                                                                    <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1 rounded leading-none border">
                                                                                        {tag}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Link href={`/student/classes/${classId}/materials/${material.id}`}>
                                                                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                                                                        View
                                                                    </Button>
                                                                </Link>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
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
                    <div className="space-y-2">
                        {exams.map((exam: any) => {
                            const status = getExamStatus(exam)
                            const attempt = attemptMap[exam.id]

                            return (
                                <Card key={exam.id} className="hover:shadow-sm transition-shadow">
                                    <CardContent className="px-4 py-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-sm">{exam.title}</h3>
                                                    <Badge className={cn(status.color, "text-[10px] px-1.5 py-0 h-5")}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {exam.duration_minutes} min
                                                    </span>
                                                    {exam.start_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
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
            <TabsContent value="links">
                <StudentClassLinks classId={classId} />
            </TabsContent>
        </Tabs>
    )
}
