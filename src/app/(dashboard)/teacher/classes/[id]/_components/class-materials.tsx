'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, FileText, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Material } from '@/types/database'

interface ClassMaterialsProps {
    classId: string
}

export function ClassMaterials({ classId }: ClassMaterialsProps) {
    const [materials, setMaterials] = useState<Material[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMaterials() {
            const supabase = createClient()
            const { data } = await supabase
                .from('materials')
                .select('*')
                .eq('class_id', classId)
                .not('tags', 'cs', '{"announcement"}')
                .order('created_at', { ascending: false })

            setMaterials(data || [])
            setLoading(false)
        }

        fetchMaterials()
    }, [classId])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Materials</CardTitle>
                    <CardDescription>Learning materials and resources</CardDescription>
                </div>
                <Link href={`/teacher/classes/${classId}/materials/new`}>
                    <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                        <Plus className="w-4 h-4" />
                        Add Material
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {materials.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No materials yet. Add your first learning material!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {materials.map((material) => (
                            <Link
                                key={material.id}
                                href={`/teacher/classes/${classId}/materials/${material.id}`}
                            >
                                <div className="p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{material.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {material.tags.map((tag) => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={material.published ? 'default' : 'secondary'}>
                                            {material.published ? (
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
