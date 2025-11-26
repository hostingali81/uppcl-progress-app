import { Work } from "@/lib/types";

export interface GroupSummary {
    groupName: string;
    categories: {
        [category: string]: {
            nitPublished: number;
            tender: number;
            part1: number;
            part2: number;
            loi: number;
            agreementSigned: number;
            workStarted: number;
        };
    };
    totals: {
        nitPublished: number;
        tender: number;
        part1: number;
        part2: number;
        loi: number;
        agreementSigned: number;
        workStarted: number;
    };
}

export interface SummaryData {
    groups: { [group: string]: GroupSummary };
    grandTotal: {
        nitPublished: number;
        tender: number;
        part1: number;
        part2: number;
        loi: number;
        agreementSigned: number;
        workStarted: number;
    };
}

export function generateSummaryData(works: Work[], groupingField: keyof Work = 'civil_zone'): SummaryData {
    const data: { [group: string]: GroupSummary } = {};
    const grandTotal = {
        nitPublished: 0,
        tender: 0,
        part1: 0,
        part2: 0,
        loi: 0,
        agreementSigned: 0,
        workStarted: 0,
    };

    works.forEach((work) => {
        const groupValue = (work[groupingField] as string) || "Unknown";
        const category = work.work_category || "Uncategorized";

        if (!data[groupValue]) {
            data[groupValue] = {
                groupName: groupValue,
                categories: {},
                totals: {
                    nitPublished: 0,
                    tender: 0,
                    part1: 0,
                    part2: 0,
                    loi: 0,
                    agreementSigned: 0,
                    workStarted: 0,
                },
            };
        }

        if (!data[groupValue].categories[category]) {
            data[groupValue].categories[category] = {
                nitPublished: 0,
                tender: 0,
                part1: 0,
                part2: 0,
                loi: 0,
                agreementSigned: 0,
                workStarted: 0,
            };
        }

        // Helper to increment counts
        const increment = (key: keyof typeof grandTotal) => {
            data[groupValue].categories[category][key]++;
            data[groupValue].totals[key]++;
            grandTotal[key]++;
        };

        if (work.nit_date) increment("nitPublished");
        if (work.tender_no) increment("tender");
        if (work.part1_opening_date) increment("part1");
        if (work.part2_opening_date) increment("part2");
        if (work.loi_no_and_date) increment("loi");
        if (work.agreement_no_and_date) increment("agreementSigned");
        if (work.progress_percentage && work.progress_percentage > 0) increment("workStarted");
    });

    return { groups: data, grandTotal };
}
