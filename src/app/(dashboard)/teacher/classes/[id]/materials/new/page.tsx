'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { MarkdownEditor } from '@/components/markdown'
import { createClient } from '@/lib/supabase/client'

export default function NewMaterialPage() {
    const router = useRouter()
    const params = useParams()
    const classId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [contentMd, setContentMd] = useState('')
    const [published, setPublished] = useState(false)
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])

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

            const { error } = await supabase
                .from('materials')
                .insert({
                    class_id: classId,
                    created_by: user.id,
                    title: title.trim(),
                    content_md: contentMd,
                    tags,
                    published,
                    published_at: published ? new Date().toISOString() : null,
                })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success(published ? 'Material published!' : 'Material saved as draft')
            router.push(`/teacher/classes/${classId}`)
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
                href={`/teacher/classes/${classId}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
            </Link>

            <h1 className="text-2xl font-bold mb-6">Add New Material</h1>

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
                    <Link href={`/teacher/classes/${classId}`}>
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
                        {published ? 'Publish Material' : 'Save as Draft'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
