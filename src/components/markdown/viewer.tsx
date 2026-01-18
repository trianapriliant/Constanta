'use client'

import { isValidElement, Children } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { cn } from '@/lib/utils'

// Helper to get YouTube ID
const getYoutubeId = (url: string) => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
    return match ? match[1] : null
}

// Helper to check for video files
const isVideoFile = (url: string) => {
    return /\.(mp4|webm|ogv|mov)$/i.test(url)
}

// Extend the default schema to allow KaTeX elements, mark tag, and style attributes
const schema = {
    ...defaultSchema,
    tagNames: [
        ...(defaultSchema.tagNames || []),
        'math',
        'semantics',
        'mark',
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

// Plugin to unwrap paragraphs containing video links (fixes <div> inside <p> error)
const rehypeUnwrapVideo = () => {
    return (tree: any) => {
        const visit = (node: any) => {
            if (node.type === 'element' && node.tagName === 'p') {
                const hasVideoLink = node.children.some((child: any) =>
                    child.type === 'element' &&
                    child.tagName === 'a' &&
                    child.properties?.href &&
                    (getYoutubeId(child.properties.href as string) || isVideoFile(child.properties.href as string))
                )

                if (hasVideoLink) {
                    node.tagName = 'div'
                }
            }
            if (node.children) {
                node.children.forEach(visit)
            }
        }
        visit(tree)
    }
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
                rehypePlugins={[rehypeKatex, rehypeUnwrapVideo, rehypeRaw, [rehypeSanitize, schema]]}
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
                        if (!href) return <a href={href}>{children}</a>

                        const youtubeId = getYoutubeId(href)
                        if (youtubeId) {
                            return (
                                <div className="video-embed my-4 rounded-xl overflow-hidden border bg-black aspect-video relative">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${youtubeId}`}
                                        title="YouTube video player"
                                        className="absolute top-0 left-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )
                        }

                        if (isVideoFile(href)) {
                            return (
                                <div className="video-embed my-4 rounded-xl overflow-hidden border bg-black aspect-video relative">
                                    <video
                                        src={href}
                                        controls
                                        className="w-full h-full"
                                    />
                                </div>
                            )
                        }

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
