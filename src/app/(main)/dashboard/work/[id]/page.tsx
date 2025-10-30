import WorkDetailClient from './WorkDetailClient';
import { fetchWorkDetails } from './actions';

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const workData = await fetchWorkDetails(Number(id));

    return <WorkDetailClient {...workData} />;
}
