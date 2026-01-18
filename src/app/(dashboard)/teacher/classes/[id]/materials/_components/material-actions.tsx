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

interface MaterialActionsProps {
    classId: string
    materialId: string
    variant?: 'default' | 'icon'
}

export function MaterialActions({ classId, materialId, variant = 'default' }: MaterialActionsProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    // Prevent click propagation to parent elements (like list items)
    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('materials')
                .delete()
                .eq('id', materialId)

            if (error) throw error

            toast.success('Material deleted')
            router.push(`/teacher/classes/${classId}`)
            router.refresh()
        } catch (error) {
            toast.error('Failed to delete material')
            setIsDeleting(false)
        }
    }



    return (
        <div className="flex items-center gap-2" onClick={handleActionClick}>
            <Link href={`/teacher/classes/${classId}/materials/${materialId}/edit`}>
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
                            This action cannot be undone. This will permanently delete the material
                            and remove it from the class.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                // Prevent propagation if needed, though this is a modal
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
