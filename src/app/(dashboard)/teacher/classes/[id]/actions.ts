'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const linkSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    url: z.string().url('Invalid URL'),
    description: z.string().optional(),
})

export async function createLink(classId: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const description = formData.get('description') as string

    const validation = linkSchema.safeParse({ title, url, description })
    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('class_links')
        .insert({
            class_id: classId,
            created_by: user.id,
            title,
            url,
            description,
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/teacher/classes/${classId}`)
    return { success: true }
}

export async function updateLink(linkId: string, classId: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const description = formData.get('description') as string

    const validation = linkSchema.safeParse({ title, url, description })
    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from('class_links')
        .update({
            title,
            url,
            description,
        })
        .eq('id', linkId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/teacher/classes/${classId}`)
    return { success: true }
}

export async function deleteLink(linkId: string, classId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('class_links')
        .delete()
        .eq('id', linkId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/teacher/classes/${classId}`)
    return { success: true }
}
