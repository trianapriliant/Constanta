'use client'

import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas'
import { Button } from '@/components/ui/button'
import { Undo, Eraser, Pen, Trash2, Save } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'

interface CanvasAnswerProps {
    onChange?: (imageData: string) => void
    initialData?: string
    readOnly?: boolean
    onStroke?: () => void
    onSave?: () => void
}

export interface CanvasAnswerRef {
    getData: () => Promise<string>
    clear: () => void
}

const CanvasAnswer = forwardRef<CanvasAnswerRef, CanvasAnswerProps>(({ onChange, initialData, readOnly = false, onStroke, onSave }, ref) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null)
    const [strokeWidth, setStrokeWidth] = useState(2)
    const [strokeColor, setStrokeColor] = useState('#000000')
    const [isEraser, setIsEraser] = useState(false)

    useImperativeHandle(ref, () => ({
        getData: async () => {
            if (canvasRef.current) {
                // Export as base64 png
                return await canvasRef.current.exportImage('png')
            }
            return ''
        },
        clear: () => {
            canvasRef.current?.clearCanvas()
        }
    }))

    const handleStrokeColorChange = (color: string) => {
        setStrokeColor(color)
        setIsEraser(false)
        canvasRef.current?.eraseMode(false)
    }

    const toggleEraser = () => {
        const newEraserState = !isEraser
        setIsEraser(newEraserState)
        canvasRef.current?.eraseMode(newEraserState)
    }

    // Load initial data (assuming it's an image URL or base64) - BUT ReactSketchCanvas works best with paths or background image.
    // However, for "answering", we usually start blank.
    // For "review", we might just display the image with a standard <img> tag instead of loading this heavy component.
    // So this component is strictly for "Drawing" input.

    return (
        <div className="space-y-2">
            {!readOnly && (
                <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-t-md border-b">
                    <div className="flex items-center gap-1 border-r pr-2">
                        <Toggle
                            pressed={!isEraser && strokeColor === '#000000'}
                            onPressedChange={() => handleStrokeColorChange('#000000')}
                            size="sm"
                            aria-label="Black Pen"
                        >
                            <div className="w-4 h-4 rounded-full bg-black border border-white ring-1 ring-gray-300" />
                        </Toggle>
                        <Toggle
                            pressed={!isEraser && strokeColor === '#2563eb'}
                            onPressedChange={() => handleStrokeColorChange('#2563eb')}
                            size="sm"
                            aria-label="Blue Pen"
                        >
                            <div className="w-4 h-4 rounded-full bg-blue-600 border border-white ring-1 ring-gray-300" />
                        </Toggle>
                        <Toggle
                            pressed={!isEraser && strokeColor === '#dc2626'}
                            onPressedChange={() => handleStrokeColorChange('#dc2626')}
                            size="sm"
                            aria-label="Red Pen"
                        >
                            <div className="w-4 h-4 rounded-full bg-red-600 border border-white ring-1 ring-gray-300" />
                        </Toggle>
                    </div>

                    <div className="flex items-center gap-2 border-r pr-2">
                        <span className="text-xs text-muted-foreground">Size:</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isEraser}
                        />
                        <span className="text-xs w-3">{strokeWidth}</span>
                    </div>

                    <div className="flex items-center gap-1 border-r pr-2">
                        <Toggle pressed={isEraser} onPressedChange={toggleEraser} size="sm" aria-label="Eraser">
                            <Eraser className="w-4 h-4" />
                        </Toggle>
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => canvasRef.current?.undo()}
                            title="Undo"
                        >
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => canvasRef.current?.clearCanvas()}
                            className="text-destructive hover:text-destructive mr-2"
                            title="Clear All"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        {onSave && (
                            <Button
                                size="sm"
                                onClick={onSave}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Answer
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className={`border rounded-md overflow-hidden ${readOnly ? '' : 'rounded-t-none'} touch-none`} style={{ height: '1000px' }}>
                {readOnly && initialData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={initialData} alt="Student Drawing" className="w-full h-full object-contain bg-white" />
                ) : (
                    <ReactSketchCanvas
                        ref={canvasRef}
                        strokeWidth={isEraser ? 20 : strokeWidth}
                        strokeColor={strokeColor}
                        canvasColor="white"
                        width="100%"
                        height="1000px"
                        onStroke={onStroke}
                    />
                )}
            </div>

            {!readOnly && (
                <p className="text-xs text-muted-foreground text-center">
                    Use your finger or stylus to draw your answer. Scroll to see more area.
                </p>
            )}
        </div>
    )
})

CanvasAnswer.displayName = 'CanvasAnswer'

export { CanvasAnswer }
