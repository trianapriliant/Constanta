'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarkdownEditor } from '@/components/markdown'
import { createClient } from '@/lib/supabase/client'
import type { Material } from '@/types/database'

interface MaterialFormProps {
    classId: string
    initialData?: Material
    titleText: string
    submitText: string
}

export function MaterialForm({ classId, initialData, titleText, submitText }: MaterialFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState(initialData?.title || '')
    const [contentMd, setContentMd] = useState(initialData?.content_md || '')
    const [published, setPublished] = useState(initialData?.published || false)
    const [chapter, setChapter] = useState(initialData?.chapter || '')
    const [topic, setTopic] = useState(initialData?.topic || '')
    const [category, setCategory] = useState<string>(initialData?.category || 'material')

    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>(initialData?.tags || [])

    // Autocomplete State
    const [existingChapters, setExistingChapters] = useState<string[]>([])
    const [existingTopics, setExistingTopics] = useState<string[]>([])

    useEffect(() => {
        async function fetchExistingData() {
            const supabase = createClient()
            const { data } = await supabase
                .from('materials')
                .select('chapter, topic')
                .eq('class_id', classId)

            if (data) {
                const chapters = Array.from(new Set(data.map(m => m.chapter).filter(Boolean))) as string[]
                const topics = Array.from(new Set(data.map(m => m.topic).filter(Boolean))) as string[]
                setExistingChapters(chapters.sort())
                setExistingTopics(topics.sort())
            }
        }
        fetchExistingData()
    }, [classId])

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!title.trim()) {
            toast.error('Title is required')
            return
        }

        setIsLoading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Not authenticated')
                return
            }

            const materialData = {
                class_id: classId,
                created_by: user.id,
                title: title.trim(),
                content_md: contentMd,
                tags,
                chapter: chapter.trim() || null,
                topic: topic.trim() || null,
                category,
                published,
                published_at: published ? (initialData?.published_at || new Date().toISOString()) : null,
                updated_at: new Date().toISOString(),
            }

            let error;

            if (initialData) {
                // Update
                const { error: updateError } = await supabase
                    .from('materials')
                    .update(materialData)
                    .eq('id', initialData.id)
                error = updateError
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('materials')
                    .insert(materialData)
                error = insertError
            }

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success(initialData ? 'Material updated!' : (published ? 'Material published!' : 'Material saved as draft'))

            if (initialData) {
                router.push(`/teacher/classes/${classId}/materials/${initialData.id}`)
            } else {
                router.push(`/teacher/classes/${classId}`)
            }
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                href={initialData ? `/teacher/classes/${classId}/materials/${initialData.id}` : `/teacher/classes/${classId}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {initialData ? 'Back to Material' : 'Back to Class'}
            </Link>

            <h1 className="text-2xl font-bold mb-6">{titleText}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <Card>
                    <CardHeader>
                        <CardTitle>Material Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter material title..."
                                disabled={isLoading}
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                />
                                <Button type="button" variant="outline" onClick={addTag}>
                                    Add
                                </Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Organization */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="chapter">Chapter (Bab)</Label>
                                <AutocompleteInput
                                    id="chapter"
                                    value={chapter}
                                    onChange={setChapter}
                                    suggestions={existingChapters}
                                    placeholder="e.g. Bab 1: Pengenalan"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="topic">Topic (Topik)</Label>
                                <AutocompleteInput
                                    id="topic"
                                    value={topic}
                                    onChange={setTopic}
                                    suggestions={existingTopics}
                                    placeholder="e.g. Tata Koordinat"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="material">Material (Materi)</SelectItem>
                                    <SelectItem value="assignment">Assignment (Tugas)</SelectItem>
                                    <SelectItem value="quiz">Quiz (Latihan)</SelectItem>
                                    <SelectItem value="other">Other (Lainnya)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MarkdownEditor
                            value={contentMd}
                            onChange={setContentMd}
                            placeholder="Write your material content here..."
                            minHeight="300px"
                        />
                    </CardContent>
                </Card>

                {/* Publish Toggle */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="publish" className="text-base">Publish immediately</Label>
                                <p className="text-sm text-muted-foreground">
                                    Students will be able to see this material right away
                                </p>
                            </div>
                            <Switch
                                id="publish"
                                checked={published}
                                onCheckedChange={setPublished}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link href={initialData ? `/teacher/classes/${classId}/materials/${initialData.id}` : `/teacher/classes/${classId}`}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        className="gradient-teal text-white border-0"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {published ? (initialData ? 'Update Material' : 'Publish Material') : 'Save as Draft'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

interface AutocompleteInputProps {
    id?: string
    value: string
    onChange: (value: string) => void
    suggestions: string[]
    placeholder?: string
    disabled?: boolean
}

function AutocompleteInput({ id, value, onChange, suggestions, placeholder, disabled }: AutocompleteInputProps) {
    const [open, setOpen] = useState(false)

    // Filter suggestions based on input
    const filtered = suggestions.filter(s =>
        s.toLowerCase().includes((value || '').toLowerCase()) &&
        s !== value // Don't show exact match if already selected
    )

    return (
        <div className="relative group">
            <Input
                id={id}
                value={value}
                onChange={e => {
                    onChange(e.target.value)
                    setOpen(true)
                }}
                onFocus={() => {
                    setOpen(true)
                }}
                onBlur={() => {
                    // Small delay to allow click on suggestion to register
                    setTimeout(() => setOpen(false), 200)
                }}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md animate-in fade-in-0 zoom-in-95 overflow-hidden">
                    <div className="max-h-60 overflow-auto p-1">
                        {filtered.map(item => (
                            <div
                                key={item}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                onClick={() => {
                                    onChange(item)
                                    setOpen(false)
                                }}
                                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
