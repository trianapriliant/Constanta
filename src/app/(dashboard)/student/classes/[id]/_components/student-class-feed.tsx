'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Megaphone, Calendar, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MarkdownViewer } from '@/components/markdown'

interface StudentClassFeedProps {
    classId: string
}

export function StudentClassFeed({ classId }: StudentClassFeedProps) {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('materials')
                .select(`
                    *,
                    author:profiles(name, avatar_url)
                `)
                .eq('class_id', classId)
                .is('published', true)
                .contains('tags', ['announcement'])
                .order('created_at', { ascending: false })

            setAnnouncements(data || [])
            setLoading(false)
        }

        fetchAnnouncements()
    }, [classId])

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            </div>
        )
    }

    if (announcements.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No announcements yet.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="border-none shadow-none bg-transparent">
                <div className="flex flex-row items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Announcements</h2>
                        <p className="text-sm text-muted-foreground">Latest updates from your teacher</p>
                    </div>
                </div>
            </Card>

            {announcements.map((item) => (
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
            ))}
        </div>
    )
}
