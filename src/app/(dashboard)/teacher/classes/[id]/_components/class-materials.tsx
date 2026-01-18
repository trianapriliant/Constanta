'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, FileText, Eye, EyeOff, FolderOpen, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Material } from '@/types/database'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { MaterialActions } from '../materials/_components/material-actions'
import { RenameChapterDialog } from './rename-chapter-dialog'

interface ClassMaterialsProps {
    classId: string
}

export function ClassMaterials({ classId }: ClassMaterialsProps) {
    const [materials, setMaterials] = useState<Material[]>([])
    const [loading, setLoading] = useState(true)
    const [renamingChapter, setRenamingChapter] = useState<string | null>(null)

    // ... rest of code

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
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([chapter, topics]) => {
                            const totalItems = Object.values(topics as Record<string, Material[]>).reduce((sum, list) => sum + list.length, 0)
                            return (
                                <AccordionItem key={chapter} value={chapter} className="border rounded-lg overflow-hidden group/item">
                                    <AccordionTrigger className="hover:no-underline px-4 py-3 group/trigger">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0 group-hover/trigger:bg-teal-100 transition-colors">
                                                <FolderOpen className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg leading-tight group-hover/trigger:text-teal-700 transition-colors">{chapter}</h3>
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-teal-600 hover:bg-muted opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            e.preventDefault()
                                                            setRenamingChapter(chapter)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.stopPropagation()
                                                                e.preventDefault()
                                                                setRenamingChapter(chapter)
                                                            }
                                                        }}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        <span className="sr-only">Rename</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="secondary" className="text-[10px] font-normal h-4 px-1.5">
                                                        {totalItems} materials
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-muted/10 space-y-6 pt-2 border-t">
                                        {Object.entries(topics as Record<string, Material[]>).sort(([a], [b]) => a.localeCompare(b)).map(([topic, items]) => (
                                            <div key={topic}>
                                                <div className="flex items-center gap-2 mb-3 mt-2">
                                                    <div className="h-px bg-border flex-1" />
                                                    <h4 className="text-xs font-semibold text-muted-foreground px-3 py-1 bg-white border rounded-full uppercase tracking-wider shadow-sm">
                                                        {topic}
                                                    </h4>
                                                    <div className="h-px bg-border flex-1" />
                                                </div>
                                                <div className="grid gap-3">
                                                    {items.map((material) => (
                                                        <div key={material.id} className="p-4 rounded-xl border bg-card hover:shadow-md transition-all hover:border-teal-200">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <Link
                                                                    href={`/teacher/classes/${classId}/materials/${material.id}`}
                                                                    className="flex-1 flex items-start gap-3 group/card"
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center group-hover/card:bg-teal-100 transition-colors">
                                                                        <FileText className="w-5 h-5 text-teal-600" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-white">
                                                                                {material.category || 'Material'}
                                                                            </Badge>
                                                                            <h4 className="font-medium group-hover/card:text-teal-700 transition-colors">{material.title}</h4>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            {material.tags.map((tag) => (
                                                                                <Badge key={tag} variant="secondary" className="text-[10px] px-1 h-5 text-muted-foreground bg-slate-100">
                                                                                    {tag}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </Link>

                                                                <div className="flex flex-col items-end gap-2">
                                                                    <Badge variant={material.published ? 'default' : 'secondary'} className={material.published ? "bg-teal-600 hover:bg-teal-700" : ""}>
                                                                        {material.published ? (
                                                                            <><Eye className="w-3 h-3 mr-1" /> Published</>
                                                                        ) : (
                                                                            <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                                                                        )}
                                                                    </Badge>

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
                            )
                        })}
                    </Accordion>
                )}
                {renamingChapter && (
                    <RenameChapterDialog
                        open={!!renamingChapter}
                        onOpenChange={(open) => !open && setRenamingChapter(null)}
                        classId={classId}
                        currentChapterName={renamingChapter}
                    />
                )}
            </CardContent>
        </Card>
    )
}
