import { getSupabaseClient } from "../../../lib/supabase/client";
import type { ProjectRecord } from "../types/project.types";

const PROJECT_FIELDS = "id, name, start_date, close_date, is_archived";

export async function findProjects(): Promise<ProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select(PROJECT_FIELDS)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as ProjectRecord[];
}
