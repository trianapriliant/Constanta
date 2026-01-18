import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StudentClassTabs } from './_components/student-class-tabs'
import { ArrowLeft } from 'lucide-react'

interface StudentClassPageProps {
    params: Promise<{ id: string }>
}

export default async function StudentClassPage({ params }: StudentClassPageProps) {
    console.log('Rendering StudentClassPage - Verifying no function passing')
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
            <div className="mb-4">
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
            {/* Tabs */}
            <StudentClassTabs
                classId={id}
                materials={materials}
                exams={exams}
                attemptMap={attemptMap}
            />
        </div>
    )
}
