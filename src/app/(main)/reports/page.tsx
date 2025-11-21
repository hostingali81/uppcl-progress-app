// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsClient } from "@/components/custom/ReportsClient";
import type { Work } from "@/lib/types";

const roleToColumnMap: { [key: string]: string } = {
  'je': 'je_name',
  'sub_division_head': 'civil_sub_division',
  'division_head': 'civil_division',
  'circle_head': 'civil_circle',
  'zone_head': 'civil_zone',
};

const roleToProfileFieldMap: { [key: string]: string } = {
  'je': 'region',
  'sub_division_head': 'subdivision',
  'division_head': 'division',
  'circle_head': 'circle',
  'zone_head': 'zone',
};

export default async function ReportsPage() {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, region, division, subdivision, circle, zone")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const profileField = roleToProfileFieldMap[profile.role];
  const filterValue = profileField ? (profile as any)[profileField] : null;

  let worksQuery = supabase.from("works").select(`
    id, scheme_sr_no, scheme_name, work_name, work_category, wbs_code, district_name,
    civil_zone, civil_circle, civil_division, civil_sub_division,
    distribution_zone, distribution_circle, distribution_division, distribution_sub_division,
    je_name, site_name,
    sanction_amount_lacs, tender_no, boq_amount,
    nit_date, part1_opening_date, part2_opening_date, loi_no_and_date,
    rate_as_per_ag, agreement_amount, agreement_no_and_date,
    firm_name_and_contact, firm_contact_no, firm_email,
    start_date, scheduled_completion_date, actual_completion_date, weightage, progress_percentage, remark,
    mb_status, teco_status, fico_status, is_blocked
  `);

  const filterColumn = roleToColumnMap[profile.role];
  if (profile.role !== 'superadmin' && filterColumn && filterValue) {
    worksQuery = worksQuery.eq(filterColumn, filterValue);
  }

  const { data: works } = await worksQuery;

  return <ReportsClient works={(works as Work[]) || []} profile={profile} />;
}
