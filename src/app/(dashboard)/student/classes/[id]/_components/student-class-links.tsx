'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Link as LinkIcon, ExternalLink, Globe } from 'lucide-react'

interface StudentClassLinksProps {
    classId: string
}

export function StudentClassLinks({ classId }: StudentClassLinksProps) {
    const [links, setLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchLinks = async () => {
            const { data, error } = await supabase
                .from('class_links')
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setLinks(data)
            }
            setLoading(false)
        }

        fetchLinks()
    }, [classId])

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground animate-pulse">Loading links...</div>
    }

    if (links.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No external links yet</p>
                    <p className="text-sm mt-1">Your teacher hasn't shared any links.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
                <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                >
                    <Card className="hover:shadow-md transition-all hover:border-teal-200 h-full">
                        <CardContent className="p-4 flex gap-4 h-full">
                            <div className="shrink-0 pt-1">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                    <LinkIcon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                                <h3 className="font-semibold text-lg leading-tight group-hover:text-teal-700 transition-colors flex items-center gap-2">
                                    {link.title}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </h3>
                                <p className="text-xs text-muted-foreground truncate mb-2 mt-0.5 font-mono opacity-80">
                                    {new URL(link.url).hostname}
                                </p>
                                {link.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                                        {link.description}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </a>
            ))}
        </div>
    )
}
