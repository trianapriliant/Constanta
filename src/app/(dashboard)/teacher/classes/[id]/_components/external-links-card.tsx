'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Link2, Trash, Pencil, ExternalLink, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { createLink, updateLink, deleteLink } from '../actions'
import { toast } from 'sonner'

interface LinkItem {
    id: string
    title: string
    url: string
    description: string | null
    created_at: string
}

interface ExternalLinksCardProps {
    classId: string
    links: LinkItem[]
}

export function ExternalLinksCard({ classId, links }: ExternalLinksCardProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleCreate(formData: FormData) {
        setIsLoading(true)
        const res = await createLink(classId, formData)
        setIsLoading(false)

        if (res?.error) {
            toast.error(typeof res.error === 'string' ? res.error : 'Invalid input')
            return
        }

        toast.success('Link added successfully')
        setIsCreateOpen(false)
    }

    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                    <CardTitle>External Links</CardTitle>
                    <CardDescription>{links.length} resources shared</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 gradient-teal text-white border-0">
                            <Plus className="w-4 h-4" />
                            Add Link
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add External Link</DialogTitle>
                            <DialogDescription>
                                Share a resource, drive folder, or website with your students.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" placeholder="e.g., OSA 2025 Materials" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">URL</Label>
                                <Input id="url" name="url" placeholder="https://..." type="url" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea id="description" name="description" placeholder="Additional details..." />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} className="gradient-teal border-0 text-white">
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Add Link
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="pt-6">
                {links.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <Link2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p>No links shared yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {links.map((link) => (
                            <LinkItemRow key={link.id} link={link} classId={classId} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function LinkItemRow({ link, classId }: { link: LinkItem; classId: string }) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    async function handleUpdate(formData: FormData) {
        setIsUpdating(true)
        const res = await updateLink(link.id, classId, formData)
        setIsUpdating(false)

        if (res?.error) {
            toast.error(typeof res.error === 'string' ? res.error : 'Invalid input')
            return
        }

        toast.success('Link updated')
        setIsEditOpen(false)
    }

    async function handleDelete() {
        setIsDeleting(true)
        const res = await deleteLink(link.id, classId)
        setIsDeleting(false)

        if (res?.error) {
            toast.error(res.error)
            return
        }

        toast.success('Link deleted')
    }

    return (
        <div className="group flex items-start gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-all">
            <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Link2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{link.title}</h4>
                    <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-teal-600 transition-colors flex items-center gap-1"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline block truncate mt-0.5"
                >
                    {link.url}
                </a>
                {link.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {link.description}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600">
                            <Pencil className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Link</DialogTitle>
                        </DialogHeader>
                        <form action={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" defaultValue={link.title} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">URL</Label>
                                <Input id="url" name="url" type="url" defaultValue={link.url} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea id="description" name="description" defaultValue={link.description || ''} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isUpdating} className="gradient-teal border-0 text-white">
                                    {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                            <Trash className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white border-0">
                                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
