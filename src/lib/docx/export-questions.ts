import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    LevelFormat,
    IParagraphOptions
} from 'docx'
import { saveAs } from 'file-saver'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface Question {
    id: string
    prompt_md: string
    type: string
    options_json?: Array<{ id: string; text_md: string }> | null
    correct_answer_json?: any
    points: number
}

// Map for common LaTeX to Unicode replacements
const LATEX_REPLACEMENTS: Record<string, string> = {
    // Greek
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
    '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Delta': 'Δ', '\\Gamma': 'Γ', '\\Theta': 'Θ', '\\Lambda': 'Λ', '\\Xi': 'Ξ',
    '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',

    // Symbols
    '\\circ': '°', '\\times': '×', '\\cdot': '·', '\\pm': '±', '\\mp': '∓',
    '\\approx': '≈', '\\neq': '≠', '\\leq': '≤', '\\geq': '≥', '\\infty': '∞',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\Rightarrow': '⇒', '\\Leftrightarrow': '⇔',
    '\\partial': '∂', '\\nabla': '∇', '\\forall': '∀', '\\exists': '∃', '\\in': '∈',
    '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃', '\\cup': '∪', '\\cap': '∩',

    // Formatting/Layout usually ignored or simplified
    '\\quad': '  ', '\\qquad': '    ', '\\,': ' ', '\\;': ' ',
}

function replaceLatexAndClean(text: string): string {
    let cleaned = text

    // Handle formatting wrappers first
    // \text{abc} -> abc
    cleaned = cleaned.replace(/\\text\s*\{([^\}]+)\}/g, '$1')
    // \mathbf{abc} -> abc
    cleaned = cleaned.replace(/\\mathbf\s*\{([^\}]+)\}/g, '$1')
    // \mathit{abc} -> abc
    cleaned = cleaned.replace(/\\mathit\s*\{([^\}]+)\}/g, '$1')
    // \mathrm{abc} -> abc
    cleaned = cleaned.replace(/\\mathrm\s*\{([^\}]+)\}/g, '$1')

    // Replace known symbols
    Object.entries(LATEX_REPLACEMENTS).forEach(([latex, unicode]) => {
        // Escape the key for regex
        const escaped = latex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp(escaped, 'g')
        cleaned = cleaned.replace(re, unicode)
    })

    // Subscripts and Superscripts (basic)
    // x^2 -> x²
    // We can try to replace simple number superscripts
    const superscripts: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ'
    }
    cleaned = cleaned.replace(/\^([0-9+\-=()n])/g, (_, char) => superscripts[char] || `^${char}`)
    // \circ often comes as ^\circ or ^{\circ}
    cleaned = cleaned.replace(/\^\{\\circ\}/g, '°')
    cleaned = cleaned.replace(/\^\\circ/g, '°')

    // Remove remaining latex command syntax (backslashes) but keep the text
    // This is a rough heuristic: "\cmd" -> "cmd" is bad for things like "\frac", but "\phi" -> "phi" is ok if we missed it.
    // Ideally we just strip the backslash
    cleaned = cleaned.replace(/\\([a-zA-Z]+)/g, '$1')

    // Cleanup braces generally if they seem structural { }
    cleaned = cleaned.replace(/\{([^\}]+)\}/g, '$1')

    return cleaned
}

// Processor to parse markdown
const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)

type TextStyle = {
    bold?: boolean
    italics?: boolean
    underline?: { type: "single" } | undefined
    color?: string
    font?: string
    size?: number
}

// Return IParagraphOptions instead of Paragraph instances
function parseMarkdownToDocxOptions(markdownText: string): any[] {
    const tree = processor.parse(markdownText)
    const paragraphOptions: any[] = []

    // Helper to process inline nodes (text, strong, emphasis, etc.)
    const processInlineNodes = (nodes: any[], style: TextStyle = { size: 24 }): TextRun[] => {
        return nodes.flatMap((node) => {
            if (node.type === 'text') {
                return new TextRun({
                    text: node.value,
                    ...style
                })
            }
            if (node.type === 'strong') {
                return processInlineNodes(node.children, { ...style, bold: true })
            }
            if (node.type === 'emphasis') {
                return processInlineNodes(node.children, { ...style, italics: true })
            }
            // Code
            if (node.type === 'inlineCode') {
                return new TextRun({
                    text: node.value,
                    font: "Courier New",
                    size: 22,
                    color: "D01F68",
                    bold: style.bold,
                    italics: style.italics
                })
            }
            // Math (Inline)
            if (node.type === 'inlineMath') {
                const cleanedMath = replaceLatexAndClean(node.value)
                return new TextRun({
                    text: ` ${cleanedMath} `,
                    font: "Cambria Math", // Use a math font
                    italics: true,
                    size: style.size,
                    bold: style.bold
                    // NO BLUE COLOR
                })
            }
            // Link
            if (node.type === 'link') {
                return processInlineNodes(node.children, {
                    ...style,
                    underline: { type: 'single' },
                    color: "0563C1"
                })
            }

            return new TextRun({ text: "", size: 24 })
        })
    }

    // Traverse root nodes
    tree.children.forEach((node: any) => {
        if (node.type === 'paragraph') {
            paragraphOptions.push({
                children: processInlineNodes(node.children),
                spacing: { after: 120 },
            })
        }
        else if (node.type === 'heading') {
            // Bold headings
            paragraphOptions.push({
                children: processInlineNodes(node.children, { size: 28, bold: true }),
                // heading: node.depth === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                // Explicit formatting often safer than styles for generic exports
                spacing: { before: 240, after: 120 }
            })
        }
        else if (node.type === 'list') {
            node.children.forEach((listItem: any, i: number) => {
                const contentNodes = listItem.children.flatMap((child: any) => {
                    if (child.type === 'paragraph') return processInlineNodes(child.children)
                    return []
                })

                paragraphOptions.push({
                    children: contentNodes,
                    bullet: {
                        level: 0,
                    },
                    spacing: { after: 60 }
                })
            })
        }
        else if (node.type === 'math') {
            // Block Math - Center it
            const cleanedMath = replaceLatexAndClean(node.value)
            paragraphOptions.push({
                children: [
                    new TextRun({
                        text: cleanedMath,
                        font: "Cambria Math",
                        italics: true,
                        size: 24
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240, before: 120 }
            })
        }
    })

    if (paragraphOptions.length === 0 && markdownText.trim()) {
        paragraphOptions.push({ children: [new TextRun({ text: markdownText, size: 24 })] })
    }

    return paragraphOptions
}

export async function exportQuestionsToWord(
    questions: Question[],
    title: string = 'Question Export'
) {
    const doc = new Document({
        numbering: {
            config: [
                {
                    reference: "question-numbering",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            alignment: AlignmentType.START,
                            style: {
                                paragraph: {
                                    indent: { left: 720, hanging: 360 },
                                },
                            },
                        },
                    ],
                },
                {
                    reference: "option-numbering",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_LETTER,
                            text: "%1.",
                            alignment: AlignmentType.START,
                            style: {
                                paragraph: {
                                    indent: { left: 1440, hanging: 360 },
                                },
                            },
                        },
                    ],
                },
            ],
        },
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: title,
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),

                    ...questions.flatMap((q) => {
                        const questionBlocks: Paragraph[] = []

                        // Parse prompt
                        const promptOptions = parseMarkdownToDocxOptions(q.prompt_md)

                        // Handle numbering logic
                        if (promptOptions.length > 0) {
                            const first = promptOptions[0]
                            const others = promptOptions.slice(1)

                            questionBlocks.push(new Paragraph({
                                ...first,
                                numbering: {
                                    reference: "question-numbering",
                                    level: 0,
                                },
                                spacing: { after: 200, before: 200 }
                            }))

                            others.forEach(opt => {
                                // Inherit alignment, but force indentation if safe
                                const isCentered = opt.alignment === AlignmentType.CENTER
                                questionBlocks.push(new Paragraph({
                                    ...opt,
                                    indent: isCentered ? undefined : { left: 720 },
                                    spacing: { after: 120 }
                                }))
                            })

                        } else {
                            questionBlocks.push(new Paragraph({
                                text: "Empty Question",
                                numbering: { reference: "question-numbering", level: 0 }
                            }))
                        }

                        // Options
                        if (
                            (q.type === 'mcq_single' || q.type === 'mcq_multi') &&
                            q.options_json &&
                            Array.isArray(q.options_json)
                        ) {
                            q.options_json.forEach((opt) => {
                                const optOptionsList = parseMarkdownToDocxOptions(opt.text_md)
                                const optContent = optOptionsList.length > 0 ? optOptionsList[0].children : [new TextRun(opt.text_md)]

                                questionBlocks.push(
                                    new Paragraph({
                                        children: optContent,
                                        numbering: {
                                            reference: "option-numbering",
                                            level: 0,
                                        },
                                        spacing: { after: 60 },
                                    })
                                )
                            })
                        } else if (q.type === 'essay' || q.type === 'short_text') {
                            questionBlocks.push(
                                new Paragraph({
                                    text: "",
                                    spacing: { after: 1000 },
                                })
                            )
                        } else if (q.type === 'true_false') {
                            questionBlocks.push(
                                new Paragraph({
                                    children: [new TextRun({ text: "True / False", size: 24 })],
                                    indent: { left: 1440 },
                                    spacing: { after: 100 },
                                })
                            )
                        }

                        questionBlocks.push(new Paragraph({ text: "" }))
                        return questionBlocks
                    }),
                ],
            },
        ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`)
}
