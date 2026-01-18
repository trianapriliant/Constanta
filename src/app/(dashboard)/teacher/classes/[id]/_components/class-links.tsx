'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Link as LinkIcon, ExternalLink, Trash2, Globe } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ClassLinksProps {
    classId: string
}

export function ClassLinks({ classId }: ClassLinksProps) {
    const [links, setLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [description, setDescription] = useState('')

    const supabase = createClient()

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

    useEffect(() => {
        fetchLinks()
    }, [classId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !url.trim()) return

        setIsSubmitting(true)

        let formattedUrl = url.trim()
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('class_links')
            .insert({
                class_id: classId,
                title: title.trim(),
                url: formattedUrl,
                description: description.trim(),
                created_by: user.id
            })

        if (error) {
            toast.error('Failed to add link')
        } else {
            toast.success('Link added successfully')
            setIsDialogOpen(false)
            fetchLinks()
            // Reset form
            setTitle('')
            setUrl('')
            setDescription('')
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('class_links')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Failed to delete link')
        } else {
            toast.success('Link deleted')
            setLinks(links.filter(l => l.id !== id))
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>External Links</CardTitle>
                    <CardDescription>{links.length} resources shared</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                            <Plus className="w-4 h-4" />
                            Add Link
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Link</DialogTitle>
                            <DialogDescription>
                                Share a website, document, or external resource with your students.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    placeholder="e.g. Course Syllabus, Reference Video"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    placeholder="Brief description of this resource..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="gradient-teal">
                                    {isSubmitting ? 'Adding...' : 'Add Link'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : links.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-dashed border rounded-lg">
                        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No links shared yet.</p>
                        <p className="text-sm mt-1">Add external resources for your students.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {links.map((link) => (
                            <div key={link.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors group">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <LinkIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium hover:underline flex items-center gap-1 text-base text-teal-700"
                                            >
                                                {link.title}
                                                <ExternalLink className="w-3 h-3 opacity-50" />
                                            </a>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{link.url}</p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mt-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Link?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove this link for all students.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(link.id)} className="bg-destructive text-destructive-foreground">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    {link.description && (
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {link.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
