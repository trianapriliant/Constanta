import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MaterialForm } from '../../_components/material-form'

interface PageProps {
    params: Promise<{ id: string; materialId: string }>
}

export default async function EditMaterialPage({ params }: PageProps) {
    const { id, materialId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify teacher access
    const { data: membership } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', id)
        .eq('user_id', user.id)
        .in('role', ['owner', 'teacher'])
        .eq('status', 'active')
        .single() as { data: any }

    if (!membership) {
        notFound()
    }

    // Get material
    const { data: material } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .eq('class_id', id)
        .single() as { data: any }

    if (!material) {
        notFound()
    }

    return (
        <MaterialForm
            classId={id}
            initialData={material}
            titleText="Edit Material"
            submitText="Update Material"
        />
    )
}
