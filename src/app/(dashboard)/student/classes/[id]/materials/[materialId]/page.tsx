import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import { MarkdownViewer } from '@/components/markdown'

interface MaterialPageProps {
    params: Promise<{ id: string; materialId: string }>
}

export default async function StudentMaterialPage({ params }: MaterialPageProps) {
    const { id, materialId } = await params
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

    // Get material (must be published for students)
    const { data: material } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .eq('class_id', id)
        .eq('published', true)
        .single() as { data: any }

    if (!material) {
        notFound()
    }

    // Get class name
    const { data: classData } = await supabase
        .from('classes')
        .select('title')
        .eq('id', id)
        .single() as { data: any }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/student" className="hover:text-foreground">
                    Dashboard
                </Link>
                <span>/</span>
                <Link href={`/student/classes/${id}`} className="hover:text-foreground">
                    {classData?.title}
                </Link>
                <span>/</span>
                <span>Materials</span>
            </div>

            <Link
                href={`/student/classes/${id}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
            </Link>

            {/* Material Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{material.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    Published {formatDate(material.published_at)}
                                </div>
                            </div>
                        </div>
                    </div>
                    {material.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {material.tags.map((tag: string) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {material.content_md ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <MarkdownViewer content={material.content_md} />
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">No content available.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
