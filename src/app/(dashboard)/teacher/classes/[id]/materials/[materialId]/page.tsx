import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, FileText, Eye, EyeOff, Edit } from 'lucide-react'
import { MarkdownViewer } from '@/components/markdown'
import { MaterialActions } from '../_components/material-actions'

interface PageProps {
    params: Promise<{ id: string; materialId: string }>
}

export default async function TeacherMaterialDetailPage({ params }: PageProps) {
    const { id, materialId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify teacher access
    const { data: membership } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'teacher'])
        .eq('status', 'active')
        .single() as { data: any }

    if (!membership) {
        notFound()
    }

    // Get material
    const { data: material } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .eq('class_id', id)
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
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href={`/teacher/classes/${id}`} className="hover:text-foreground">
                    {classData?.title}
                </Link>
                <span>/</span>
                <span>Materials</span>
                <span>/</span>
                <span className="text-foreground">{material.title}</span>
            </div>

            <Link
                href={`/teacher/classes/${id}`}
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
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {material.chapter && (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {material.chapter}
                                        </Badge>
                                    )}
                                    {material.topic && (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {material.topic}
                                        </Badge>
                                    )}
                                    {material.category && (
                                        <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-0 uppercase text-[10px] tracking-wider">
                                            {material.category}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl flex items-center gap-3">
                                    {material.title}
                                    <Badge variant={material.published ? 'default' : 'secondary'}>
                                        {material.published ? (
                                            <><Eye className="w-3 h-3 mr-1" /> Published</>
                                        ) : (
                                            <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                                        )}
                                    </Badge>
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    Created {formatDate(material.created_at)}
                                </div>
                            </div>
                        </div>
                        <MaterialActions classId={id} materialId={materialId} />
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
