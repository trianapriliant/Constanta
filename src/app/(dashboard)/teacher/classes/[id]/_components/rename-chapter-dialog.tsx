'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RenameChapterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    classId: string
    currentChapterName: string
}

export function RenameChapterDialog({
    open,
    onOpenChange,
    classId,
    currentChapterName
}: RenameChapterDialogProps) {
    const [newName, setNewName] = useState(currentChapterName)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim() || newName.trim() === currentChapterName) {
            onOpenChange(false)
            return
        }

        setIsSubmitting(true)

        try {
            const { error } = await supabase
                .from('materials')
                .update({ chapter: newName.trim() })
                .eq('class_id', classId)
                .eq('chapter', currentChapterName)

            if (error) throw error

            toast.success('Chapter renamed successfully')
            router.refresh()
            onOpenChange(false)
        } catch (error) {
            console.error('Error renaming chapter:', error)
            toast.error('Failed to rename chapter')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Chapter</DialogTitle>
                    <DialogDescription>
                        This will rename the chapter "{currentChapterName}" for all materials in this class.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">New Name</Label>
                        <Input
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new chapter name"
                            disabled={isSubmitting}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="gradient-teal"
                            disabled={isSubmitting || !newName.trim() || newName.trim() === currentChapterName}
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
