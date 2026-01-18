import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
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

    // Fetch all published materials for navigation context
    const { data: allMaterials } = await supabase
        .from('materials')
        .select('id, title, chapter, topic, published_at')
        .eq('class_id', id)
        .eq('published', true)
        .not('tags', 'cs', '{"announcement"}')
        .order('published_at', { ascending: false }) as { data: any[] | null }

    // Replicate StudentClassTabs sorting logic to determine linear order
    const linearMaterials: any[] = []
    if (allMaterials) {
        const grouped = allMaterials.reduce((acc: any, item: any) => {
            const chapter = item.chapter || 'General Resources'
            const topic = item.topic || 'Uncategorized'
            if (!acc[chapter]) acc[chapter] = {}
            if (!acc[chapter][topic]) acc[chapter][topic] = []
            acc[chapter][topic].push(item)
            return acc
        }, {})

        // Sort Chapters
        Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([chapter, topics]: [string, any]) => {
                // Sort Topics
                Object.entries(topics)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .forEach(([topic, items]: [string, any]) => {
                        // items are already sorted by published_at DESC from fetch
                        linearMaterials.push(...items)
                    })
            })
    }

    const currentIndex = linearMaterials.findIndex(m => m.id === materialId)
    const prevMaterial = currentIndex > 0 ? linearMaterials[currentIndex - 1] : null
    const nextMaterial = currentIndex !== -1 && currentIndex < linearMaterials.length - 1 ? linearMaterials[currentIndex + 1] : null

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
                <Link href={`/student/classes/${id}?tab=materials`} className="hover:text-foreground">
                    Materials
                </Link>
            </div>

            <Link
                href={`/student/classes/${id}?tab=materials`}
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

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
                {prevMaterial ? (
                    <Link href={`/student/classes/${id}/materials/${prevMaterial.id}`}>
                        <Button variant="outline" className="gap-2 h-auto py-2">
                            <ChevronLeft className="w-4 h-4" />
                            <div className="text-left">
                                <div className="text-xs text-muted-foreground">Previous</div>
                                <div className="font-medium max-w-[200px] truncate leading-tight">{prevMaterial.title}</div>
                            </div>
                        </Button>
                    </Link>
                ) : <div />}

                {nextMaterial ? (
                    <Link href={`/student/classes/${id}/materials/${nextMaterial.id}`}>
                        <Button variant="outline" className="gap-2 h-auto py-2 text-right">
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground">Next</div>
                                <div className="font-medium max-w-[200px] truncate leading-tight">{nextMaterial.title}</div>
                            </div>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Link>
                ) : <div />}
            </div>
        </div>
    )
}
