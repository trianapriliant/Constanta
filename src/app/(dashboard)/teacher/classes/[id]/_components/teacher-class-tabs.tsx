'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ClassLinks } from './class-links'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, FileQuestion, BarChart3, Users, Link as LinkIcon, GraduationCap, Database } from 'lucide-react'

interface TeacherClassTabsProps {
    classId: string
    classCode: string
    feed: React.ReactNode
    materials: React.ReactNode
    exams: React.ReactNode
    questions: React.ReactNode
    people: React.ReactNode
    analytics: React.ReactNode
}

export function TeacherClassTabs({
    classId,
    classCode,
    feed,
    materials,
    exams,
    questions,
    people,
    analytics
}: TeacherClassTabsProps) {
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'feed'
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null // or a loading skeleton
    }
    return (
        <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-white border">
                <TabsTrigger value="feed" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Feed
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Materials
                </TabsTrigger>
                <TabsTrigger value="exams" className="gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Exams
                </TabsTrigger>
                <TabsTrigger value="questions" className="gap-2">
                    <Database className="w-4 h-4" />
                    Question Bank
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Links
                </TabsTrigger>
                <TabsTrigger value="people" className="gap-2">
                    <Users className="w-4 h-4" />
                    People
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
                {feed}
            </TabsContent>

            <TabsContent value="materials">
                {materials}
            </TabsContent>

            <TabsContent value="exams">
                {exams}
            </TabsContent>

            <TabsContent value="questions">
                {questions}
            </TabsContent>

            <TabsContent value="links">
                <ClassLinks classId={classId} />
            </TabsContent>

            <TabsContent value="people">
                {people}
            </TabsContent>

            <TabsContent value="analytics">
                {analytics}
            </TabsContent>
        </Tabs>
    )
}
