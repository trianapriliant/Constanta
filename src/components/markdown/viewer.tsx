'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { cn } from '@/lib/utils'

// Extend the default schema to allow KaTeX elements
const schema = {
    ...defaultSchema,
    tagNames: [
        ...(defaultSchema.tagNames || []),
        'math',
        'semantics',
        'mrow',
        'mi',
        'mo',
        'mn',
        'msup',
        'msub',
        'mfrac',
        'msqrt',
        'mroot',
        'munder',
        'mover',
        'munderover',
        'mtable',
        'mtr',
        'mtd',
        'annotation',
    ],
    attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'style'],
        span: [...(defaultSchema.attributes?.span || []), 'className', 'style', 'aria-hidden'],
    },
}

interface MarkdownViewerProps {
    content: string
    className?: string
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
    return (
        <div className={cn('prose-content', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, [rehypeSanitize, schema]]}
                components={{
                    // Custom code block rendering
                    code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const isInline = !match

                        if (isInline) {
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }

                        return (
                            <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        )
                    },
                    // Custom table styling
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-4">
                                <table className="w-full border-collapse">{children}</table>
                            </div>
                        )
                    },
                    th({ children }) {
                        return (
                            <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                                {children}
                            </th>
                        )
                    },
                    td({ children }) {
                        return (
                            <td className="border border-border px-4 py-2">{children}</td>
                        )
                    },
                    // Custom blockquote
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic">
                                {children}
                            </blockquote>
                        )
                    },
                    // Links open in new tab
                    a({ href, children }) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {children}
                            </a>
                        )
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
