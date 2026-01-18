import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Copy } from 'lucide-react'
import { TeacherClassTabs } from './_components/teacher-class-tabs'
import { EditClassDialog } from './_components/edit-class-dialog'

import { ClassFeed } from './_components/class-feed'
import { ClassMaterials } from './_components/class-materials'
import { ClassExams } from './_components/class-exams'
import { ClassQuestions } from './_components/class-questions'
import { ClassPeople } from './_components/class-people'
import { ClassAnalytics } from './_components/class-analytics'
import { ExternalLinksCard } from './_components/external-links-card'

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

    // Get External Links
    const { data: classLinks } = await supabase
        .from('class_links')
        .select('*')
        .eq('class_id', id)
        .order('created_at', { ascending: false })

    return (
        <div>
            {/* Class Header */}
            <div className="bg-white rounded-2xl border p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{cls.title}</h1>
                            <EditClassDialog
                                classId={id}
                                initialData={{
                                    title: cls.title,
                                    subject: cls.subject,
                                    description: cls.description
                                }}
                            />
                        </div>
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

            {/* External Links */}
            <ExternalLinksCard classId={id} links={classLinks || []} />

            {/* Class Tabs */}
            <TeacherClassTabs
                classId={id}
                classCode={cls.class_code}
                feed={<ClassFeed classId={id} />}
                materials={<ClassMaterials classId={id} />}
                exams={<ClassExams classId={id} />}
                questions={<ClassQuestions classId={id} />}
                people={<ClassPeople classId={id} classCode={cls.class_code} />}
                analytics={<ClassAnalytics classId={id} />}
            />
        </div>
    )
}
