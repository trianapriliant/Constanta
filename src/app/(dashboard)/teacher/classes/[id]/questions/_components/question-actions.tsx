'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface QuestionActionsProps {
    classId: string
    questionId: string
    variant?: 'default' | 'icon'
}

export function QuestionActions({ classId, questionId, variant = 'default' }: QuestionActionsProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    // Prevent click propagation
    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', questionId)

            if (error) throw error

            toast.success('Question deleted')
            router.refresh()
        } catch (error) {
            toast.error('Failed to delete question')
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex items-center gap-2" onClick={handleActionClick}>
            <Link href={`/teacher/classes/${classId}/questions/${questionId}/edit`}>
                <Button
                    variant={variant === 'icon' ? 'ghost' : 'outline'}
                    size={variant === 'icon' ? 'icon' : 'sm'}
                    className="gap-2 h-8 w-8 md:w-auto md:h-9"
                >
                    <Edit className="w-4 h-4" />
                    {variant === 'default' && 'Edit'}
                </Button>
            </Link>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant={variant === 'icon' ? 'ghost' : 'destructive'}
                        size={variant === 'icon' ? 'icon' : 'sm'}
                        className={`gap-2 h-8 w-8 md:w-auto md:h-9 ${variant === 'icon' ? 'text-destructive hover:bg-destructive/10' : ''}`}
                    >
                        <Trash2 className="w-4 h-4" />
                        {variant === 'default' && 'Delete'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={handleActionClick}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the question
                            and remove it from any un-taken exams if manually linked (but usually exams reference questions).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                handleDelete()
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
