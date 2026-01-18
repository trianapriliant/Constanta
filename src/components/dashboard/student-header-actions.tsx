'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

export function StudentHeaderActions() {
    const pathname = usePathname()
    const params = useParams()
    const [classTitle, setClassTitle] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const classId = params?.id as string

    useEffect(() => {
        async function fetchClassTitle() {
            if (classId && pathname?.startsWith('/student/classes/')) {
                // Determine if we need to fetch (simple cache check could be added but unnecessary for small scale)
                setLoading(true)
                const { data, error } = await supabase
                    .from('classes')
                    .select('title')
                    .eq('id', classId)
                    .single()

                if (data && !error) {
                    setClassTitle(data.title)
                }
                setLoading(false)
            } else {
                setClassTitle(null)
            }
        }

        fetchClassTitle()
    }, [classId, pathname])

    // If we are in restricted routes (e.g. taking an exam), maybe we want to hide everything?
    // For now, simple logic:
    // If inside a class (and we have a title), show title.
    // Otherwise show Join Class button.

    if (classId && pathname?.startsWith('/student/classes/')) {
        if (loading) {
            return <div className="h-9 w-32 bg-muted/20 animate-pulse rounded-md" />
        }
        return (
            <div className="flex items-center gap-2 px-2">
                <Badge variant="outline" className="text-sm font-normal py-1 px-3 bg-white/50">
                    {classTitle || 'Classroom'}
                </Badge>
            </div>
        )
    }

    return (
        <Link href="/student/join">
            <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                <Plus className="w-4 h-4" />
                Join Class
            </Button>
        </Link>
    )
}
