'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, Calendar, School } from 'lucide-react'

interface UserProfileProps {
    profile: any
}

export function UserProfile({ profile }: UserProfileProps) {
    const initials = profile?.name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || '?'

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">My Profile</h1>

            <Card>
                <CardContent className="p-6 sm:p-10">
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-muted">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="text-2xl sm:text-4xl gradient-teal text-white">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="text-center sm:text-left space-y-2">
                            <h2 className="text-2xl font-bold">{profile?.name}</h2>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span>{profile?.email}</span>
                            </div>
                            <div className="pt-2">
                                <Badge variant={profile?.role === 'teacher' ? 'default' : 'secondary'} className="capitalize px-3 py-1">
                                    {profile?.role}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-8" />

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Personal Information
                            </h3>
                            <div className="grid gap-2 text-sm">
                                <div className="grid grid-cols-3 text-muted-foreground">
                                    <span>Full Name</span>
                                    <span className="col-span-2 text-foreground font-medium">{profile?.name}</span>
                                </div>
                                <div className="grid grid-cols-3 text-muted-foreground">
                                    <span>Email</span>
                                    <span className="col-span-2 text-foreground font-medium">{profile?.email}</span>
                                </div>
                                <div className="grid grid-cols-3 text-muted-foreground">
                                    <span>User ID</span>
                                    <span className="col-span-2 font-mono text-xs text-foreground bg-muted p-1 rounded w-fit">
                                        {profile?.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                Account Details
                            </h3>
                            <div className="grid gap-2 text-sm">
                                <div className="grid grid-cols-3 text-muted-foreground">
                                    <span>Member Since</span>
                                    <span className="col-span-2 text-foreground font-medium">
                                        {new Date(profile?.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 text-muted-foreground">
                                    <span>Role</span>
                                    <span className="col-span-2 text-foreground capitalize">
                                        {profile?.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
