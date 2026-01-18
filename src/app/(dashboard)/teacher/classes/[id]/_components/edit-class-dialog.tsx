'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Settings, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { classSchema, type ClassFormData } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface EditClassDialogProps {
    classId: string
    initialData: {
        title: string
        subject?: string | null
        description?: string | null
    }
}

export function EditClassDialog({ classId, initialData }: EditClassDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const form = useForm<ClassFormData>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            title: initialData.title,
            description: initialData.description || '',
            subject: initialData.subject || '',
        },
    })

    async function onSubmit(data: ClassFormData) {
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('classes')
                .update({
                    title: data.title,
                    description: data.description || null,
                    subject: data.subject || null,
                })
                .eq('id', classId)

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Class updated successfully!')
            setOpen(false)
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="w-4 h-4" />
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Class Details</DialogTitle>
                    <DialogDescription>
                        Update the class information.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Class Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Mathematics 101"
                            {...form.register('title')}
                            disabled={isLoading}
                        />
                        {form.formState.errors.title && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="e.g., Mathematics"
                            {...form.register('subject')}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the class..."
                            rows={3}
                            {...form.register('description')}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="gradient-teal text-white border-0"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
