'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Megaphone, Calendar, Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MarkdownViewer } from '@/components/markdown'

interface ClassFeedProps {
    classId: string
}

export function ClassFeed({ classId }: ClassFeedProps) {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchAnnouncements = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('materials')
            .select(`
                *,
                author:profiles(name, avatar_url)
            `)
            .eq('class_id', classId)
            .contains('tags', ['announcement'])
            .order('created_at', { ascending: false })

        setAnnouncements(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchAnnouncements()
    }, [classId])

    const handlePost = async () => {
        if (!title.trim() || !content.trim()) return

        setSubmitting(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase
            .from('materials')
            .insert({
                class_id: classId,
                created_by: user.id,
                title: title,
                content_md: content,
                published: true,
                published_at: new Date().toISOString(),
                tags: ['announcement'],
            })

        if (error) {
            toast.error('Failed to post announcement')
        } else {
            toast.success('Announcement posted!')
            setOpen(false)
            setTitle('')
            setContent('')
            fetchAnnouncements()
        }
        setSubmitting(false)
    }

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
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Class Feed</CardTitle>
                        <CardDescription>Announcements and updates</CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                                <Plus className="w-4 h-4" />
                                Post Announcement
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>New Announcement</DialogTitle>
                                <DialogDescription>
                                    Share updates, resources, or news with your class.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Announcement Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Write your announcement here..."
                                        className="min-h-[150px]"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePost}
                                    disabled={submitting || !title || !content}
                                    className="gradient-teal text-white border-0"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <Send className="w-4 h-4 mr-2" />
                                    Post
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                ) : announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No announcements yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    announcements.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={item.author?.avatar_url} />
                                            <AvatarFallback>
                                                {item.author?.name?.charAt(0) || 'T'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                {item.author?.name} •
                                                <Calendar className="w-3 h-3 ml-1" />
                                                {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <MarkdownViewer content={item.content_md} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
