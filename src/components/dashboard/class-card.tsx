'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    BookOpen,
    FlaskConical,
    Calculator,
    Languages,
    Globe,
    Palette,
    Music,
    Monitor,
    Dna,
    Atom,
    Microscope,
    GraduationCap
} from 'lucide-react'

interface ClassCardProps {
    id: string
    title: string
    description?: string | null
    subject?: string | null
    classCode?: string
    onClick?: () => void
}

const getSubjectIcon = (subject?: string | null) => {
    if (!subject) return GraduationCap

    const s = subject.toLowerCase()
    if (s.includes('math') || s.includes('calculus') || s.includes('algebra')) return Calculator
    if (s.includes('science') || s.includes('physics')) return Atom
    if (s.includes('chemistry')) return FlaskConical
    if (s.includes('biology')) return Dna
    if (s.includes('english') || s.includes('language')) return Languages
    if (s.includes('history') || s.includes('geography')) return Globe
    if (s.includes('art') || s.includes('design')) return Palette
    if (s.includes('music')) return Music
    if (s.includes('computer') || s.includes('tech') || s.includes('coding')) return Monitor
    if (s.includes('astronomy')) return Microscope // or Atom or Globe

    return BookOpen
}

export function ClassCard({
    id,
    title,
    description,
    subject,
    classCode,
    className
}: ClassCardProps & { className?: string }) {

    const Icon = getSubjectIcon(subject)

    return (
        <Card className={cn("hover:shadow-lg transition-all duration-300 cursor-pointer h-full pt-0 overflow-hidden group relative border-muted/60", className)}>
            {/* Top Border Gradient */}
            <div className="h-2 gradient-teal" />

            <CardHeader className="pb-3 pt-6 relative">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                            {title}
                        </CardTitle>
                        {subject && (
                            <CardDescription className="mt-1 line-clamp-1">
                                {subject}
                            </CardDescription>
                        )}
                    </div>

                    {/* 3D Icon Container */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300 gradient-teal"
                        style={{
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255,255,255,0.3)'
                        }}>
                        <Icon className="w-6 h-6 drop-shadow-md" />
                    </div>
                </div>

                {classCode && (
                    <div className="mt-4">
                        <Badge variant="secondary" className="font-mono text-xs bg-muted/50">
                            {classCode}
                        </Badge>
                    </div>
                )}
            </CardHeader>

            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {description || 'No description provided.'}
                </p>
            </CardContent>
        </Card>
    )
}
