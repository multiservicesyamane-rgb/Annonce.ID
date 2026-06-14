"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalAds: 0,
    pendingAds: 0,
    users: 0,
    activeAds: 0
  });

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    async function fetchStats() {
      // Pour le moment on utilise l'anon key donc certaines requêtes pourraient être bloquées par RLS,
      // l'idéal sera de faire un fetch vers un route handler API /api/admin/stats qui utilise SERVICE_ROLE_KEY
      
      const { count: totalAds } = await supabase.from('listings').select('*', { count: 'exact', head: true });
      const { count: pendingAds } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: activeAds } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      setStats({
        totalAds: totalAds || 0,
        pendingAds: pendingAds || 0,
        users: users || 0,
        activeAds: activeAds || 0
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Vue d'ensemble</h1>
        <p className="text-gray-400">Bienvenue dans le centre de contrôle Konnecta Groupe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Annonces" value={stats.totalAds} icon="📋" color="blue" />
        <StatCard title="En Attente" value={stats.pendingAds} icon="⏳" color="orange" alert={stats.pendingAds > 0} />
        <StatCard title="Annonces Actives" value={stats.activeAds} icon="✅" color="green" />
        <StatCard title="Utilisateurs Inscrits" value={stats.users} icon="👥" color="purple" />
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 h-[400px] flex items-center justify-center flex-col">
        <span className="text-6xl mb-4">📈</span>
        <h3 className="text-xl font-bold text-white mb-2">Activité de la semaine</h3>
        <p className="text-gray-500">Le graphique sera implémenté dans le sprint final.</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, alert }: any) {
  return (
    <div className={`bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 relative overflow-hidden group`}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-xl border border-[#2A2A2A]">
          {icon}
        </div>
      </div>
      {alert && (
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 m-4 animate-ping" />
      )}
    </div>
  )
}
