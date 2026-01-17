'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { joinClassSchema, type JoinClassFormData } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'

function JoinClassForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultCode = searchParams.get('code') || ''
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<JoinClassFormData>({
        resolver: zodResolver(joinClassSchema),
        defaultValues: {
            classCode: defaultCode,
        },
    })

    async function onSubmit(data: JoinClassFormData) {
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Not authenticated')
                return
            }

            // Find class by code
            const { data: cls, error: classError } = await supabase
                .from('classes')
                .select('id, title')
                .eq('class_code', data.classCode.toUpperCase())
                .single()

            if (classError || !cls) {
                toast.error('Class not found. Check the code and try again.')
                return
            }

            // Check if already a member
            const { data: existing } = await supabase
                .from('class_members')
                .select('id, status')
                .eq('class_id', cls.id)
                .eq('user_id', user.id)
                .single()

            if (existing) {
                if (existing.status === 'active') {
                    toast.error('You are already a member of this class')
                } else {
                    // Reactivate membership
                    await supabase
                        .from('class_members')
                        .update({ status: 'active' })
                        .eq('id', existing.id)

                    toast.success(`Rejoined ${cls.title}!`)
                    router.push(`/student/classes/${cls.id}`)
                }
                return
            }

            // Join the class
            const { error: joinError } = await supabase
                .from('class_members')
                .insert({
                    class_id: cls.id,
                    user_id: user.id,
                    role: 'student',
                    status: 'active',
                })

            if (joinError) {
                toast.error(joinError.message)
                return
            }

            toast.success(`Successfully joined ${cls.title}!`)
            router.push(`/student/classes/${cls.id}`)
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <Link href="/student" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Join a Class</CardTitle>
                    <CardDescription>
                        Enter the class code provided by your teacher
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="classCode">Class Code</Label>
                            <Input
                                id="classCode"
                                placeholder="e.g., ABC123"
                                className="text-center text-2xl font-mono tracking-widest uppercase"
                                maxLength={6}
                                {...form.register('classCode', {
                                    onChange: (e) => {
                                        e.target.value = e.target.value.toUpperCase()
                                    }
                                })}
                                disabled={isLoading}
                            />
                            {form.formState.errors.classCode && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.classCode.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full gradient-teal text-white border-0"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Join Class
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function JoinClassPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinClassForm />
        </Suspense>
    )
}
