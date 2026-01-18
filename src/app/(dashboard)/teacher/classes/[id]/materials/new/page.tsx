import { MaterialForm } from '../_components/material-form'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function NewMaterialPage({ params }: PageProps) {
    const { id } = await params

    return <MaterialForm classId={id} titleText="Add New Material" submitText="Publish Material" />
}

