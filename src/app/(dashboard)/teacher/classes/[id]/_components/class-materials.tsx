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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { MaterialActions } from '../materials/_components/material-actions'

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
                    <Accordion type="multiple" className="space-y-4">
                        {Object.entries(
                            materials.reduce<Record<string, Record<string, Material[]>>>((acc, material) => {
                                const chapter = material.chapter || 'General Resources'
                                const topic = material.topic || 'Uncategorized'
                                if (!acc[chapter]) acc[chapter] = {}
                                if (!acc[chapter][topic]) acc[chapter][topic] = []
                                acc[chapter][topic].push(material)
                                return acc
                            }, {})
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([chapter, topics]) => (
                            <AccordionItem key={chapter} value={chapter} className="border rounded-lg px-4">
                                <AccordionTrigger className="hover:no-underline hover:text-teal-600">
                                    <span className="font-semibold text-lg">{chapter}</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-6">
                                    {Object.entries(topics as Record<string, Material[]>).sort(([a], [b]) => a.localeCompare(b)).map(([topic, items]) => (
                                        <div key={topic}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="h-px bg-border flex-1" />
                                                <h4 className="text-sm font-medium text-muted-foreground px-2 py-1 bg-muted rounded-full">
                                                    {topic}
                                                </h4>
                                                <div className="h-px bg-border flex-1" />
                                            </div>
                                            <div className="grid gap-3">
                                                {items.map((material) => (
                                                    <div key={material.id} className="p-4 rounded-xl border hover:bg-muted/50 transition-colors bg-card">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <Link
                                                                href={`/teacher/classes/${classId}/materials/${material.id}`}
                                                                className="flex-1 flex items-start gap-3 group"
                                                            >
                                                                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center group-hover:bg-accent/80 transition-colors">
                                                                    <FileText className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                                                            {material.category || 'Material'}
                                                                        </Badge>
                                                                        <h4 className="font-medium group-hover:text-teal-600 transition-colors">{material.title}</h4>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        {material.tags.map((tag) => (
                                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                                {tag}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </Link>

                                                            <div className="flex flex-col items-end gap-2">
                                                                <Badge variant={material.published ? 'default' : 'secondary'}>
                                                                    {material.published ? (
                                                                        <><Eye className="w-3 h-3 mr-1" /> Published</>
                                                                    ) : (
                                                                        <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                                                                    )}
                                                                </Badge>

                                                                {/* Actions Shortcut */}
                                                                <MaterialActions
                                                                    classId={classId}
                                                                    materialId={material.id}
                                                                    variant="icon"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}
