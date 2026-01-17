import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Users, BookOpen, FileQuestion, BarChart3, Copy } from 'lucide-react'
import { ClassFeed } from './_components/class-feed'
import { ClassMaterials } from './_components/class-materials'
import { ClassExams } from './_components/class-exams'
import { ClassPeople } from './_components/class-people'
import { ClassAnalytics } from './_components/class-analytics'

interface ClassPageProps {
    params: Promise<{ id: string }>
}

export default async function ClassPage({ params }: ClassPageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get class details with membership check
    const { data: membership } = await supabase
        .from('class_members')
        .select(`
      role,
      classes (*)
    `)
        .eq('class_id', id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'teacher'])
        .eq('status', 'active')
        .single()

    if (!membership || !membership.classes) {
        notFound()
    }

    const cls = membership.classes as any

    // Get member count
    const { count: memberCount } = await supabase
        .from('class_members')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', id)
        .eq('status', 'active')

    return (
        <div>
            {/* Class Header */}
            <div className="bg-white rounded-2xl border p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{cls.title}</h1>
                        {cls.subject && (
                            <p className="text-muted-foreground mt-1">{cls.subject}</p>
                        )}
                        {cls.description && (
                            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                                {cls.description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Class Code</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono text-lg px-3 py-1">
                                    {cls.class_code}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {memberCount || 0} members
                    </span>
                </div>
            </div>

            {/* Class Tabs */}
            <Tabs defaultValue="feed" className="space-y-6">
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
                        <FileQuestion className="w-4 h-4" />
                        Exams
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
                    <ClassFeed classId={id} />
                </TabsContent>

                <TabsContent value="materials">
                    <ClassMaterials classId={id} />
                </TabsContent>

                <TabsContent value="exams">
                    <ClassExams classId={id} />
                </TabsContent>

                <TabsContent value="people">
                    <ClassPeople classId={id} />
                </TabsContent>

                <TabsContent value="analytics">
                    <ClassAnalytics classId={id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
