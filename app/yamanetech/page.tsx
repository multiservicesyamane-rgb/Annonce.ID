export default function SuperAdminDashboard() {
  return (
    <div className="animate-fadeUp">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[1.5rem] font-extrabold text-dark-900">Dashboard</h1>
          <p className="text-[.85rem] text-gray-500">Bienvenue sur votre tableau de bord</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[.85rem] text-gray-600 shadow-sm">
          <span>📅</span> 01 Mai 2026 - 31 Mai 2026
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard icon="📄" label="Total Annonces" value="250,548" trend="+12.5%" color="bg-blue-50 text-blue-600" />
        <StatCard icon="✓" label="Annonces Actives" value="182,540" trend="+8.2%" color="bg-green-50 text-[#22c55e]" />
        <StatCard icon="⏳" label="En Attente" value="12,540" trend="+4.3%" color="bg-orange-50 text-orange-500" />
        <StatCard icon="✕" label="Annonces Rejetées" value="5,320" trend="-2.1%" color="bg-red-50 text-brand-red" trendDown />
        <StatCard icon="👥" label="Utilisateurs" value="98,652" trend="+15.3%" color="bg-purple-50 text-purple-600" />
        <StatCard icon="⭐" label="Vendeurs Vérifiés" value="3,254" trend="+6.7%" color="bg-sky-50 text-sky-500" />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Evolution Chart */}
        <div className="rounded-[12px] border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[.9rem] font-bold">Évolution des annonces</h3>
            <select className="rounded border-gray-200 text-[.75rem]"><option>30 derniers jours</option></select>
          </div>
          {/* Mockup Chart using CSS */}
          <div className="relative mt-8 h-[160px] w-full border-b border-l border-gray-100">
             {/* Lines */}
             <svg viewBox="0 0 100 50" className="h-full w-full preserve-3d" preserveAspectRatio="none">
               <polyline points="0,40 20,25 40,35 60,15 80,20 100,5" fill="none" stroke="#fbbf24" strokeWidth="2" />
               <polyline points="0,45 20,35 40,40 60,25 80,30 100,20" fill="none" stroke="#3b82f6" strokeWidth="2" />
             </svg>
             <div className="absolute bottom-0 flex w-full justify-between pt-2 text-[.6rem] text-gray-400">
               <span>01 Mai</span><span>08 Mai</span><span>15 Mai</span><span>22 Mai</span><span>29 Mai</span>
             </div>
          </div>
        </div>

        {/* Category Chart */}
        <div className="rounded-[12px] border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-display text-[.9rem] font-bold">Annonces par catégorie</h3>
          <div className="flex h-[180px] items-center justify-center gap-6">
            <div className="relative h-32 w-32 rounded-full border-[16px] border-gray-100" style={{ borderTopColor: "#3b82f6", borderRightColor: "#22c55e", borderBottomColor: "#fbbf24", borderLeftColor: "#a855f7" }}></div>
            <div className="flex flex-col gap-2 text-[.75rem] text-gray-600">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#3b82f6]"></span> Immobilier 35%</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#22c55e]"></span> Véhicules 25%</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#fbbf24]"></span> Électronique 20%</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#a855f7]"></span> Emploi 10%</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-300"></span> Autres 10%</div>
            </div>
          </div>
        </div>

        {/* Revenus Bar Chart */}
        <div className="rounded-[12px] border border-gray-100 bg-white p-5 shadow-sm lg:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-[.9rem] font-bold">Revenus</h3>
            <select className="rounded border-gray-200 text-[.75rem]"><option>Mensuel</option></select>
          </div>
          <div className="mb-4">
            <div className="text-[1.3rem] font-extrabold text-dark-900">2,543,890 FCFA</div>
            <div className="text-[.7rem] font-bold text-[#22c55e]">+19.6% vs l'année dernière</div>
          </div>
          <div className="flex h-[120px] items-end justify-between gap-2 border-b border-gray-100 pb-1">
            <div className="w-full rounded-t-sm bg-blue-400" style={{ height: "30%" }}></div>
            <div className="w-full rounded-t-sm bg-blue-400" style={{ height: "45%" }}></div>
            <div className="w-full rounded-t-sm bg-blue-400" style={{ height: "60%" }}></div>
            <div className="w-full rounded-t-sm bg-blue-400" style={{ height: "50%" }}></div>
            <div className="w-full rounded-t-sm bg-blue-400" style={{ height: "80%" }}></div>
            <div className="w-full rounded-t-sm bg-blue-500" style={{ height: "100%" }}></div>
          </div>
          <div className="mt-1 flex justify-between text-[.6rem] text-gray-400">
            <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
          </div>
        </div>
      </div>

      {/* Colorful Revenue Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <ColorCard title="Revenus Publicités" value="845,600 FCFA" trend="+12.5% vs mois dernier" color="bg-gradient-to-br from-purple-500 to-indigo-600" />
        <ColorCard title="Revenus Abonnements" value="623,400 FCFA" trend="+9.7% vs mois dernier" color="bg-gradient-to-br from-green-500 to-emerald-600" />
        <ColorCard title="Transactions" value="12,458" trend="+14.3% vs mois dernier" color="bg-gradient-to-br from-orange-400 to-orange-500" />
        <ColorCard title="Taux de Conversion" value="8.35%" trend="+2.1% vs mois dernier" color="bg-gradient-to-br from-blue-500 to-blue-600" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table Dernières Annonces */}
        <div className="rounded-[12px] border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[.9rem] font-bold">Dernières annonces</h3>
            <button className="text-[.75rem] text-blue-500 hover:underline">Voir toutes</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[.8rem]">
              <thead className="border-b border-gray-100 text-[.7rem] font-bold uppercase text-gray-400">
                <tr>
                  <th className="pb-2">Annonce</th>
                  <th className="pb-2">Catégorie</th>
                  <th className="pb-2">Prix</th>
                  <th className="pb-2">Statut</th>
                  <th className="pb-2">Ajouté le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <TableRow img="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=50&h=50&fit=crop" name="Villa à vendre à Almadies" cat="Immobilier" price="120,000,000 FCFA" status="Active" date="31 Mai 2026" />
                <TableRow img="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=50&h=50&fit=crop" name="Toyota RAV4 2020" cat="Véhicules" price="18,500,000 FCFA" status="En attente" date="31 Mai 2026" />
                <TableRow img="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=50&h=50&fit=crop" name="iPhone 14 Pro Max 256Go" cat="Électronique" price="850,000 FCFA" status="Active" date="31 Mai 2026" />
                <TableRow img="https://placehold.co/50/22c55e/FFF?text=DEV" name="Développeur Full Stack" cat="Emploi" price="450,000 FCFA" status="Active" date="30 Mai 2026" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Activités récentes */}
        <div className="rounded-[12px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[.9rem] font-bold">Activités récentes</h3>
            <button className="text-[.75rem] text-blue-500 hover:underline">Voir tout</button>
          </div>
          <div className="flex flex-col gap-4">
            <Activity icon="🔵" title="Nouvelle annonce publiée" desc="Toyota Camry 2021 par Ousmane Diop" time="il y a 5 min" />
            <Activity icon="🟢" title="Paiement reçu" desc="Paiement publicité 50,000 FCFA par Saliou Fall" time="il y a 25 min" />
            <Activity icon="🟣" title="Nouvel utilisateur inscrit" desc="Awa Ndiaye s'est inscrit" time="il y a 1 heure" />
            <Activity icon="🔴" title="Annonce signalée" desc="Villa à vendre aux Almadies signalée" time="il y a 2 heures" />
            <Activity icon="🟠" title="Abonnement souscrit" desc="Abonnement Premium souscrit par Abdoulaye Ba" time="il y a 3 heures" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color, trendDown }: any) {
  return (
    <div className="rounded-[12px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[1.2rem] ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-[1.3rem] font-extrabold text-dark-900">{value}</div>
      <div className="mt-1 text-[.75rem] font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-[.7rem] font-bold ${trendDown ? "text-brand-red" : "text-[#22c55e]"}`}>{trend}</div>
    </div>
  );
}

function ColorCard({ title, value, trend, color }: any) {
  return (
    <div className={`rounded-[12px] p-5 text-white shadow-md ${color}`}>
      <div className="mb-1 text-[.85rem] font-medium opacity-90">{title}</div>
      <div className="mb-4 text-[1.6rem] font-extrabold">{value}</div>
      <div className="mb-3 text-[.75rem] font-medium opacity-80">{trend}</div>
      <button className="text-[.75rem] font-bold opacity-90 transition hover:opacity-100">Voir détails →</button>
    </div>
  );
}

function TableRow({ img, name, cat, price, status, date }: any) {
  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-2.5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="h-9 w-9 rounded object-cover" />
          <span className="font-semibold text-gray-800">{name}</span>
        </div>
      </td>
      <td className="py-2.5 text-gray-500">{cat}</td>
      <td className="py-2.5 font-mono text-[.75rem] font-bold">{price}</td>
      <td className="py-2.5">
        <span className={`rounded px-2 py-0.5 text-[.65rem] font-bold ${status === "Active" ? "bg-green-50 text-[#22c55e]" : "bg-orange-50 text-orange-500"}`}>
          {status}
        </span>
      </td>
      <td className="py-2.5 text-gray-500">{date}</td>
    </tr>
  );
}

function Activity({ icon, title, desc, time }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[1.2rem]">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[.8rem] font-bold text-gray-800">{title}</div>
        <div className="truncate text-[.75rem] text-gray-500">{desc}</div>
      </div>
      <div className="whitespace-nowrap text-[.65rem] text-gray-400">{time}</div>
    </div>
  );
}
