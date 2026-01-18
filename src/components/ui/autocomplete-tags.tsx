'use client'

import * as React from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Command as CommandPrimitive } from 'cmdk'
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface AutocompleteTagsProps {
    tags: string[]
    onTagsChange: (tags: string[]) => void
    suggestions: string[]
    placeholder?: string
}

export function AutocompleteTags({
    tags,
    onTagsChange,
    suggestions,
    placeholder = "Add a tag..."
}: AutocompleteTagsProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const handleSelect = (value: string) => {
        const trimmed = value.trim()
        if (trimmed && !tags.includes(trimmed)) {
            onTagsChange([...tags, trimmed])
        }
        setInputValue("")
        setOpen(false)
        // Keep focus on input after selection
        inputRef.current?.focus()
    }

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault()
            handleSelect(inputValue)
        }
        if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1])
        }
    }

    // Filter available suggestions (exclude already selected)
    const availableSuggestions = suggestions.filter(s =>
        !tags.includes(s) &&
        s.toLowerCase().includes(inputValue.toLowerCase())
    )

    return (
        <Command className="overflow-visible bg-transparent">
            <div
                className={cn(
                    "group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                )}
            >
                <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 hover:bg-secondary/80">
                            {tag}
                            <button
                                type="button"
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                                onClick={() => removeTag(tag)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? placeholder : ""}
                        className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px]"
                    />
                </div>
            </div>
            {open && (inputValue || availableSuggestions.length > 0) && (
                <div className="relative mt-2">
                    <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            {inputValue.trim() && !availableSuggestions.some(s => s.toLowerCase() === inputValue.toLowerCase()) && (
                                <CommandItem onSelect={() => handleSelect(inputValue)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{inputValue}"
                                </CommandItem>
                            )}
                            {availableSuggestions.length > 0 && (
                                <CommandGroup heading="Suggestions">
                                    {availableSuggestions.map((suggestion) => (
                                        <CommandItem
                                            key={suggestion}
                                            onSelect={() => handleSelect(suggestion)}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                        >
                                            {suggestion}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </div>
                </div>
            )}
        </Command>
    )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
