import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== "YamaneTech@2025") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch profiles
    const { data: profiles, error: fetchErr } = await supabase.from('profiles').select('*');
    if (fetchErr) throw fetchErr;

    // 2. Identify "Moussa" profiles to delete
    const moussaProfiles = profiles.filter(p => 
      (p.full_name && p.full_name.toLowerCase().includes('moussa')) ||
      (p.email && p.email.toLowerCase().includes('moussa')) ||
      p.id === 'moussa-id'
    );

    const deleted = [];
    for (const p of moussaProfiles) {
      // delete listings
      await supabase.from('listings').delete().eq('user_id', p.id);
      // delete profile
      await supabase.from('profiles').delete().eq('id', p.id);
      // delete auth
      try {
        await supabase.auth.admin.deleteUser(p.id);
      } catch (e) {}
      deleted.push(p.full_name);
    }

    // 3. Promote multiservicesyamane@gmail.com to Admin
    const adminEmail = "multiservicesyamane@gmail.com";
    const authList = await supabase.auth.admin.listUsers();
    let adminPromoted = false;

    const adminUser = authList.data?.users.find(u => u.email && u.email.toLowerCase() === adminEmail);
    if (adminUser) {
      const existingProfile = profiles.find(p => p.id === adminUser.id);
      if (existingProfile) {
        await supabase.from('profiles').update({ role: 'admin', is_verified: true }).eq('id', adminUser.id);
      } else {
        await supabase.from('profiles').insert({
          id: adminUser.id,
          full_name: "Administrateur Yamane",
          role: 'admin',
          is_verified: true,
          email: adminEmail
        });
      }
      adminPromoted = true;
    }

    return NextResponse.json({
      success: true,
      message: "Database cleanup completed",
      deletedMoussaProfiles: deleted,
      adminPromoted
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
