'use client'

import { useState, useCallback } from 'react'
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

            onChange(newValue)

            // Reset cursor position
            setTimeout(() => {
                textarea.focus()
                const newCursorPos = start + before.length + selectedText.length
                textarea.setSelectionRange(newCursorPos, newCursorPos)
            }, 0)
        },
        [value, onChange]
    )

    const toolbarButtons = [
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
                                    >
                                        {btn.icon && <btn.icon className="h-4 w-4" />}
                                    </Button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <TabsContent value="write" className="m-0">
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
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
