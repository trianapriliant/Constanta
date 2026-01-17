'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

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

export function CreateClassDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ClassFormData>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            title: '',
            description: '',
            subject: '',
        },
    })

    async function onSubmit(data: ClassFormData) {
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Not authenticated')
                return
            }

            const { data: newClass, error } = await supabase
                .from('classes')
                .insert({
                    created_by: user.id,
                    title: data.title,
                    description: data.description || null,
                    subject: data.subject || null,
                })
                .select()
                .single()

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Class created successfully!')
            setOpen(false)
            form.reset()
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 gradient-teal text-white border-0">
                    <Plus className="w-4 h-4" />
                    Create Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a new class</DialogTitle>
                    <DialogDescription>
                        Create a class and invite students with a unique code.
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
                            Create Class
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
