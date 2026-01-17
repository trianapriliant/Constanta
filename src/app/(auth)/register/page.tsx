'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { registerSchema, type RegisterFormData } from '@/lib/validations/schemas'
import { createClient } from '@/lib/supabase/client'

function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultRole = searchParams.get('role') === 'student' ? 'student' : 'teacher'
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema) as any,
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: defaultRole,
        },
    })

    const selectedRole = form.watch('role')

    async function onSubmit(data: RegisterFormData) {
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        role: data.role,
                    },
                },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Account created! Please check your email to verify.')

            // Redirect to appropriate dashboard
            const destination = data.role === 'teacher' ? '/teacher' : '/student'
            router.push(destination)
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold">Create an account</h2>
                <p className="text-muted-foreground mt-1">
                    Get started with Constanta
                </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                    <Label>I am a</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => form.setValue('role', 'teacher')}
                            className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'teacher'
                                ? 'border-primary bg-accent'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="font-medium">Teacher</div>
                            <div className="text-xs text-muted-foreground">
                                Create & manage classes
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => form.setValue('role', 'student')}
                            className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'student'
                                ? 'border-primary bg-accent'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="font-medium">Student</div>
                            <div className="text-xs text-muted-foreground">
                                Join classes & learn
                            </div>
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        placeholder="John Doe"
                        {...form.register('name')}
                        disabled={isLoading}
                    />
                    {form.formState.errors.name && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.name.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...form.register('email')}
                        disabled={isLoading}
                    />
                    {form.formState.errors.email && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.email.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...form.register('password')}
                        disabled={isLoading}
                    />
                    {form.formState.errors.password && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.password.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...form.register('confirmPassword')}
                        disabled={isLoading}
                    />
                    {form.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full gradient-teal text-white border-0"
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    )
}

function RegisterFormSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<RegisterFormSkeleton />}>
            <RegisterForm />
        </Suspense>
    )
}
