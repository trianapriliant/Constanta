'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Trash, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    author: {
        name: string
        avatar_url: string | null
    } | null
}

interface CommentSectionProps {
    materialId: string
    currentUser?: any
}

export function CommentSection({ materialId, currentUser }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when comments change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [comments])

    const fetchComments = useCallback(async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('material_comments')
            .select(`
                *,
                author:profiles(name, avatar_url)
            `)
            .eq('material_id', materialId)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setComments(data)
        }
        setLoading(false)
    }, [materialId])

    useEffect(() => {
        fetchComments()

        const supabase = createClient()
        const channel = supabase
            .channel(`comments-${materialId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'material_comments',
                    filter: `material_id=eq.${materialId}`
                },
                () => {
                    fetchComments()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [materialId, fetchComments])

    const handleSubmit = async () => {
        if (!content.trim() || !currentUser) return
        setSubmitting(true)

        const supabase = createClient()
        const { error } = await supabase
            .from('material_comments')
            .insert({
                material_id: materialId,
                user_id: currentUser.id,
                content: content.trim()
            })

        if (error) {
            toast.error(error.message)
        } else {
            setContent('')
            fetchComments()
        }
        setSubmitting(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return

        const supabase = createClient()
        const { error } = await supabase
            .from('material_comments')
            .delete()
            .eq('id', deleteId)

        if (error) {
            toast.error('Failed to delete comment')
        } else {
            setComments(prev => prev.filter(c => c.id !== deleteId))
            setDeleteId(null)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) return <div className="py-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>

    return (
        <div className="space-y-4 pt-4 border-t mt-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Comments ({comments.length})</h4>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.author?.avatar_url || undefined} />
                            <AvatarFallback>{comment.author?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg p-3 text-sm relative">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{comment.author?.name || 'Unknown User'}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{comment.content}</p>

                            {(currentUser?.id === comment.user_id) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setDeleteId(comment.id)}
                                >
                                    <Trash className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {comments.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-2 italic">
                        No comments yet. Be the first to reply!
                    </div>
                )}
            </div>

            <div className="flex gap-3 items-start">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                    <AvatarFallback>{currentUser?.user_metadata?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                    <Textarea
                        placeholder="Write a comment..."
                        className="min-h-[40px] h-[40px] py-2 resize-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        className="h-10 w-10 shrink-0 gradient-teal text-white border-0"
                        onClick={handleSubmit}
                        disabled={submitting || !content.trim()}
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this comment?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
