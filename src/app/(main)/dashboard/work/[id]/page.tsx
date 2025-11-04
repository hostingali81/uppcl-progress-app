import WorkDetailClient from './WorkDetailClient';
import { fetchWorkDetails, fetchFieldSuggestions } from './actions';

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const workData = await fetchWorkDetails(Number(id));
    
    // Fetch suggestions for commonly edited fields
    const [
        schemeSuggestions, 
        categorySuggestions, 
        districtSuggestions, 
        firmSuggestions,
        distZoneSuggestions,
        distCircleSuggestions,
        distDivisionSuggestions,
        distSubDivisionSuggestions
    ] = await Promise.all([
        fetchFieldSuggestions('scheme_name'),
        fetchFieldSuggestions('work_category'),
        fetchFieldSuggestions('district_name'),
        fetchFieldSuggestions('firm_name_and_contact'),
        fetchFieldSuggestions('distribution_zone'),
        fetchFieldSuggestions('distribution_circle'),
        fetchFieldSuggestions('distribution_division'),
        fetchFieldSuggestions('distribution_sub_division')
    ]);
    
    const suggestions: Record<string, string[]> = {
        scheme_name: schemeSuggestions as string[],
        work_category: categorySuggestions as string[],
        district_name: districtSuggestions as string[],
        firm_name_and_contact: firmSuggestions as string[],
        distribution_zone: distZoneSuggestions as string[],
        distribution_circle: distCircleSuggestions as string[],
        distribution_division: distDivisionSuggestions as string[],
        distribution_sub_division: distSubDivisionSuggestions as string[]
    };

    return <WorkDetailClient {...workData} suggestions={suggestions} />;
}
