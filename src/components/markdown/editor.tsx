'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarkdownViewer } from './viewer'
import { cn } from '@/lib/utils'
import {
    Bold,
    Italic,
    Code,
    List,
    ListOrdered,
    Link,
    Image,
    Table,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    Video,
    Highlighter,
    Palette,
    Undo,
    Redo,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    minHeight?: string
}

export function MarkdownEditor({
    value,
    onChange,
    placeholder = 'Write your content in Markdown...',
    className,
    minHeight = '300px',
}: MarkdownEditorProps) {
    const [tab, setTab] = useState<'write' | 'preview'>('write')

    // History Management
    const [history, setHistory] = useState<string[]>([value])
    const [historyIndex, setHistoryIndex] = useState(0)
    // Ref to ignore updates triggered by undo/redo to avoid double pushing
    const ignoreNextUpdate = useRef(false)

    // Debounce history updates to avoid saving every character
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const updateHistory = useCallback((newValue: string) => {
        if (ignoreNextUpdate.current) {
            ignoreNextUpdate.current = false
            return
        }

        // Clear existing timeout to debounce typing
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        timeoutRef.current = setTimeout(() => {
            setHistory((prev) => {
                const newHistory = prev.slice(0, historyIndex + 1)
                newHistory.push(newValue)
                // Limit history size if needed, e.g. 50 items
                if (newHistory.length > 50) newHistory.shift()
                return newHistory
            })
            setHistoryIndex((prev) => {
                const nextIndex = prev + 1
                // Adjust if shift happened (very rough approximation logic, usually ok for small limits)
                return nextIndex > 50 ? 50 : nextIndex
            })
        }, 800) // 800ms debounce
    }, [historyIndex])

    // Sync external value changes to history (initial load or external updates)
    // This is tricky with controlled components. 
    // Simplified: We assume onChange -> Parent -> value passes back.
    // We just hook into the `handleChange` wrapper.

    const handleChange = (newValue: string) => {
        onChange(newValue)
        updateHistory(newValue)
    }

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1
            const previousValue = history[newIndex]
            ignoreNextUpdate.current = true // Don't push this revert as a new change
            onChange(previousValue)
            setHistoryIndex(newIndex)
        }
    }, [history, historyIndex, onChange])

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            const nextValue = history[newIndex]
            ignoreNextUpdate.current = true
            onChange(nextValue)
            setHistoryIndex(newIndex)
        }
    }, [history, historyIndex, onChange])

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (tab !== 'write') return

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) {
                    redo()
                } else {
                    undo()
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault()
                redo()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo, tab])


    const insertMarkdown = useCallback(
        (before: string, after: string = '', placeholder: string = '') => {
            const textarea = document.querySelector('textarea') as HTMLTextAreaElement
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const selectedText = value.substring(start, end) || placeholder

            const newValue =
                value.substring(0, start) +
                before +
                selectedText +
                after +
                value.substring(end)

            // For button clicks, we want immediate history save, no debounce
            if (timeoutRef.current) clearTimeout(timeoutRef.current)

            setHistory((prev) => {
                const newHistory = prev.slice(0, historyIndex + 1)
                newHistory.push(newValue)
                return newHistory
            })
            setHistoryIndex((prev) => prev + 1)

            onChange(newValue)

            // Reset cursor position
            setTimeout(() => {
                textarea.focus()
                const newCursorPos = start + before.length + selectedText.length
                textarea.setSelectionRange(newCursorPos, newCursorPos)
            }, 0)
        },
        [value, onChange, historyIndex]
    )

    const toolbarButtons = [
        { icon: Undo, action: undo, title: 'Undo (Ctrl+Z)', disabled: historyIndex <= 0 },
        { icon: Redo, action: redo, title: 'Redo (Ctrl+Y)', disabled: historyIndex >= history.length - 1 },
        { type: 'separator' },
        { icon: Heading1, action: () => insertMarkdown('# ', '', 'Heading 1'), title: 'Heading 1' },
        { icon: Heading2, action: () => insertMarkdown('## ', '', 'Heading 2'), title: 'Heading 2' },
        { icon: Heading3, action: () => insertMarkdown('### ', '', 'Heading 3'), title: 'Heading 3' },
        { type: 'separator' },
        { icon: Bold, action: () => insertMarkdown('**', '**', 'bold'), title: 'Bold' },
        { icon: Italic, action: () => insertMarkdown('*', '*', 'italic'), title: 'Italic' },
        { icon: Code, action: () => insertMarkdown('`', '`', 'code'), title: 'Inline Code' },
        { type: 'separator' },
        { icon: List, action: () => insertMarkdown('- ', '', 'item'), title: 'Bullet List' },
        { icon: ListOrdered, action: () => insertMarkdown('1. ', '', 'item'), title: 'Numbered List' },
        { icon: Quote, action: () => insertMarkdown('> ', '', 'quote'), title: 'Quote' },
        { type: 'separator' },
        { icon: Highlighter, action: () => insertMarkdown('<mark>', '</mark>', 'highlighted text'), title: 'Highlight' },
        {
            type: 'dropdown',
            icon: Palette,
            title: 'Text Color',
            items: [
                { label: 'Red', color: '#ef4444' },
                { label: 'Green', color: '#22c55e' },
                { label: 'Blue', color: '#3b82f6' },
                { label: 'Teal', color: '#14b8a6' },
                { label: 'Orange', color: '#f97316' },
                { label: 'Purple', color: '#a855f7' },
            ]
        },
        { type: 'separator' },
        { icon: Link, action: () => insertMarkdown('[', '](url)', 'link text'), title: 'Link' },
        { icon: Image, action: () => insertMarkdown('![', '](url)', 'alt text'), title: 'Image' },
        { icon: Video, action: () => insertMarkdown('[', '](https://www.youtube.com/watch?v=...)', 'Video Title'), title: 'Video' },
        {
            icon: Table,
            action: () =>
                insertMarkdown(
                    '\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n',
                    ''
                ),
            title: 'Table',
        },
    ]

    return (
        <div className={cn('border rounded-xl overflow-hidden', className)}>
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'write' | 'preview')}>
                <div className="bg-muted/50 border-b px-2 py-1 flex items-center justify-between">
                    <TabsList className="bg-transparent">
                        <TabsTrigger value="write" className="text-sm">
                            Write
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-sm">
                            Preview
                        </TabsTrigger>
                    </TabsList>

                    {tab === 'write' && (
                        <div className="flex items-center gap-0.5">
                            {toolbarButtons.map((btn: any, i) => {
                                if (btn.type === 'separator') {
                                    return <div key={i} className="w-px h-4 bg-border mx-1" />
                                }

                                if (btn.type === 'dropdown') {
                                    return (
                                        <DropdownMenu key={i}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    title={btn.title}
                                                >
                                                    <btn.icon className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {btn.items.map((item: any) => (
                                                    <DropdownMenuItem
                                                        key={item.label}
                                                        onClick={() => insertMarkdown(`<span style="color: ${item.color}">`, '</span>', item.label)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                                        {item.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )
                                }

                                return (
                                    <Button
                                        key={i}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={btn.action}
                                        title={btn.title}
                                        disabled={btn.disabled}
                                    >
                                        {btn.icon && <btn.icon className={cn("h-4 w-4", btn.disabled && "opacity-50")} />}
                                    </Button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <TabsContent value="write" className="m-0">
                    <Textarea
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={placeholder}
                        className="border-0 rounded-none resize-none focus-visible:ring-0"
                        style={{ minHeight }}
                    />
                    <div className="bg-muted/30 px-3 py-2 text-xs text-muted-foreground border-t">
                        Supports Markdown, LaTeX math ($..$ or $$..$$), tables, code blocks, and coloring/highlighting
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0">
                    <div className="p-4 prose max-w-none dark:prose-invert" style={{ minHeight }}>
                        {value ? (
                            <MarkdownViewer content={value} />
                        ) : (
                            <p className="text-muted-foreground italic">Nothing to preview</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
