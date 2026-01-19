'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoveUp, MoveDown, FileDown, Trash2 } from 'lucide-react'
import { exportQuestionsToWord } from '@/lib/docx/export-questions'
import { ScrollArea } from "@/components/ui/scroll-area"

interface QuestionExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    questions: any[]
}

export function QuestionExportDialog({
    open,
    onOpenChange,
    questions: initialQuestions,
}: QuestionExportDialogProps) {
    const [title, setTitle] = useState("Question Bank Export")
    const [orderedQuestions, setOrderedQuestions] = useState(initialQuestions)
    const [isExporting, setIsExporting] = useState(false)

    // Sync state when dialog opens or initialQuestions change
    // Note: In a real app, use useEffect or logic to avoid overwriting user reordering if selection didn't change.
    // precise syncing is a bit trickier, but for MVP re-initializing on open is fine.
    // However, to support re-opening and keeping order, we'd need lift state up.
    // For now, we'll reset when `questions` prop length changes significantly or on mount.
    // Actually, let's just use effect for simplicity.
    if (initialQuestions.length !== orderedQuestions.length && !isExporting) {
        // Only if count differs (simple heuristic to detect new selection vs reorder), 
        // ideally we check IDs.
        // For safer MVP: just re-init on open (handled by parent passing fresh reference? No parent passes filtered array)
        // Let's use `key` on the dialog in parent to reset state relative to selection? 
        // Or just let useEffect handle it.
    }

    // Better approach: use useEffect to update orderedQuestions when initialQuestions changes
    // But prevent overrides during reordering. 
    // We will assume that if the user closes and reopens, they might lose order, which is acceptable for MVP.
    // To fix this proper, we'd use a key={selectedQuestions.join(',')} on the component in parent.

    const moveUp = (index: number) => {
        if (index === 0) return
        const newQuestions = [...orderedQuestions]
        const temp = newQuestions[index]
        newQuestions[index] = newQuestions[index - 1]
        newQuestions[index - 1] = temp
        setOrderedQuestions(newQuestions)
    }

    const moveDown = (index: number) => {
        if (index === orderedQuestions.length - 1) return
        const newQuestions = [...orderedQuestions]
        const temp = newQuestions[index]
        newQuestions[index] = newQuestions[index + 1]
        newQuestions[index + 1] = temp
        setOrderedQuestions(newQuestions)
    }

    const remove = (index: number) => {
        const newQuestions = [...orderedQuestions]
        newQuestions.splice(index, 1)
        setOrderedQuestions(newQuestions)
    }

    // Refresh ordered questions when initial list changes deeply
    // We'll trust the parent to mount/unmount or we use a key there.
    // If not, we need a useEffect here.
    const [lastPropQuestions, setLastPropQuestions] = useState(initialQuestions)
    if (initialQuestions !== lastPropQuestions) {
        setOrderedQuestions(initialQuestions)
        setLastPropQuestions(initialQuestions)
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            await exportQuestionsToWord(orderedQuestions, title)
            onOpenChange(false)
        } catch (error) {
            console.error("Export failed", error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Export Questions to Word</DialogTitle>
                    <DialogDescription>
                        Reorder questions and configure export settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Document Title
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Selected Questions ({orderedQuestions.length})</Label>
                        <div className="border rounded-md">
                            <ScrollArea className="h-[300px] p-4">
                                <div className="space-y-2">
                                    {orderedQuestions.map((q: any, i: number) => (
                                        <div key={q.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border">
                                            <span className="text-sm font-medium w-6 text-center text-muted-foreground">{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate">
                                                    {q.prompt_md.replace(/[#*`]/g, '')}
                                                </p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border">{q.type}</span>
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border">{q.difficulty}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => moveUp(i)}
                                                    disabled={i === 0}
                                                >
                                                    <MoveUp className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => moveDown(i)}
                                                    disabled={i === orderedQuestions.length - 1}
                                                >
                                                    <MoveDown className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => remove(i)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleExport} disabled={isExporting} className="gradient-teal text-white border-0 gap-2">
                        <FileDown className="w-4 h-4" />
                        {isExporting ? 'Generating...' : 'Download .docx'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
