import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://juwxlrbkpeluojtqcplt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Vs461RaDSo7X8ygrjwbehQ_UYobFhox";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
