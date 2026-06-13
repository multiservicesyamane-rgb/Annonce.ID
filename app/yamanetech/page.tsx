import React from "react";

export default function AdminDashboard() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Top Section: Line Chart + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Line Chart Panel */}
        <div className="bg-white rounded-[10px] p-6 shadow-sm border border-gray-100 flex flex-col relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[.9rem] font-bold text-gray-700">Dashboard</h2>
              <p className="text-[.7rem] text-gray-400">Overview of Latest Month</p>
            </div>
            <div className="flex gap-4 text-[.7rem] font-semibold text-gray-400">
              <span className="hover:text-[#E9437E] cursor-pointer">DAILY</span>
              <span className="hover:text-[#E9437E] cursor-pointer">WEEKLY</span>
              <span className="text-[#E9437E] border-b-2 border-[#E9437E] pb-1 cursor-pointer">MONTHLY</span>
              <span className="hover:text-[#E9437E] cursor-pointer">YEARLY</span>
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-3xl font-extrabold text-gray-800 mb-2">1 245 K FCFA</div>
              <div className="text-[.8rem] font-bold text-gray-700">842</div>
              <div className="text-[.65rem] text-gray-400 mb-3">Nouvelles Annonces</div>
              <button className="bg-[#E9437E] text-white text-[.7rem] px-4 py-1.5 rounded shadow-sm hover:bg-[#D8366D] transition">Last Month Summary</button>
            </div>
            
            {/* SVG placeholder for Line Chart to match image style */}
            <div className="w-[60%] h-[120px] relative">
               <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path d="M 0 100 Q 50 60 100 80 T 200 40 T 300 90 T 400 20" fill="url(#gradOrange)" opacity="0.3" />
                  <path d="M 0 100 Q 50 60 100 80 T 200 40 T 300 90 T 400 20" fill="none" stroke="#F59E0B" strokeWidth="3" />
                  
                  <path d="M 0 110 Q 50 80 100 60 T 200 80 T 300 20 T 400 100" fill="url(#gradPink)" opacity="0.3" />
                  <path d="M 0 110 Q 50 80 100 60 T 200 80 T 300 20 T 400 100" fill="none" stroke="#E9437E" strokeWidth="3" />
                  
                  <defs>
                    <linearGradient id="gradPink" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#E9437E" stopOpacity="1" />
                      <stop offset="100%" stopColor="#E9437E" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradOrange" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
               </svg>
            </div>
          </div>

          <div className="flex gap-6 mt-auto pt-4 border-t border-gray-50">
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-[#E9437E] flex items-center justify-center text-white text-[.6rem]">👑</div>
               <span className="text-[.65rem] text-gray-500">Premium<br/><b className="text-gray-800 text-[.75rem]">545,000 F</b></span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[.6rem]">✨</div>
               <span className="text-[.65rem] text-gray-500">À la Une<br/><b className="text-gray-800 text-[.75rem]">700,000 F</b></span>
             </div>
          </div>
        </div>

        {/* Donut Chart Panel */}
        <div className="bg-white rounded-[10px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
          <h2 className="text-[.8rem] font-bold text-gray-700 absolute top-6 left-6">Catégories</h2>
          <div className="relative w-40 h-40 mt-4 mb-6">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F3F4F6" strokeWidth="6"></circle>
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E9437E" strokeWidth="6" strokeDasharray="55 45" strokeDashoffset="0"></circle>
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#8B5CF6" strokeWidth="6" strokeDasharray="33 67" strokeDashoffset="-55"></circle>
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#FBBF24" strokeWidth="6" strokeDasharray="12 88" strokeDashoffset="-88"></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center bg-white m-3 rounded-full shadow-inner">
               <span className="text-[.85rem] font-bold text-gray-700">Total</span>
            </div>
          </div>
          <div className="flex w-full justify-between px-4 text-center">
            <div>
              <div className="text-[1.1rem] font-bold text-gray-800">55%</div>
              <div className="text-[.65rem] text-gray-400 flex items-center gap-1 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-[#E9437E]"></span> Immobilier</div>
            </div>
            <div>
              <div className="text-[1.1rem] font-bold text-gray-800">33%</div>
              <div className="text-[.65rem] text-gray-400 flex items-center gap-1 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span> Véhicules</div>
            </div>
            <div>
              <div className="text-[1.1rem] font-bold text-gray-800">12%</div>
              <div className="text-[.65rem] text-gray-400 flex items-center gap-1 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]"></span> Emploi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Revenus (Aujourd'hui)", value: "45,000 F", color: "from-[#F1618B] to-[#E9437E]", shadow: "shadow-[#E9437E]/30" },
          { title: "Nouvelles Annonces", value: "142", color: "from-[#9372F9] to-[#714AE5]", shadow: "shadow-[#714AE5]/30" },
          { title: "Inscriptions (Mois)", value: "845", color: "from-[#5DB3FF] to-[#3B82F6]", shadow: "shadow-[#3B82F6]/30" },
          { title: "Signalements Actifs", value: "12", color: "from-[#FBBF24] to-[#F59E0B]", shadow: "shadow-[#F59E0B]/30" },
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} rounded-[10px] p-5 shadow-lg ${card.shadow} text-white relative overflow-hidden h-[110px] flex flex-col justify-between`}>
            <div className="text-[.7rem] font-medium opacity-90">{card.title}</div>
            <div className="text-[1.6rem] font-bold">{card.value}</div>
            {/* Fake sparkline background */}
            <svg viewBox="0 0 100 30" className="absolute bottom-0 left-0 w-full h-[40px] opacity-20" preserveAspectRatio="none">
               <path d="M0 30 L 20 10 L 40 25 L 60 5 L 80 20 L 100 0 L 100 30 Z" fill="white" />
            </svg>
          </div>
        ))}
      </div>

      {/* Bottom Section: Timeline + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-[10px] p-6 shadow-sm border border-gray-100">
          <h2 className="text-[.85rem] font-bold text-gray-700 mb-6">Activités Récentes</h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {[
              { time: "10 Min", title: "Annonce VIP", desc: "Moussa a publié une villa.", color: "bg-[#E9437E]" },
              { time: "2 Hrs", title: "Paiement Validé", desc: "PayTech: 10,000 FCFA.", color: "bg-[#8B5CF6]" },
              { time: "5 Hrs", title: "Utilisateur Signalé", desc: "Modération requise.", color: "bg-[#3B82F6]" },
              { time: "1 J", title: "Compte Vérifié", desc: "Diallo est maintenant Pro.", color: "bg-[#F59E0B]" },
            ].map((act, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" style={{ backgroundColor: "transparent" }}>
                   <span className={`w-3 h-3 rounded-full ${act.color}`}></span>
                </div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] flex items-center gap-4">
                  <div className="text-[.65rem] text-gray-400 w-12 text-right">{act.time}</div>
                  <div>
                    <div className="text-[.75rem] font-bold text-gray-700">{act.title}</div>
                    <div className="text-[.65rem] text-gray-500">{act.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Table */}
        <div className="bg-white rounded-[10px] p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-[.85rem] font-bold text-gray-700">Dernières Transactions PayTech</h2>
            <div className="flex items-center gap-2">
              <button className="bg-[#E9437E] text-white w-6 h-6 rounded flex items-center justify-center text-xs shadow-sm hover:bg-[#D8366D]">+</button>
              <div className="relative">
                <input type="text" placeholder="Search..." className="bg-gray-50 border border-gray-200 rounded px-3 py-1 text-[.7rem] w-48 outline-none focus:border-[#E9437E] transition-colors" />
                <span className="absolute right-2 top-1.5 text-gray-400 text-xs">🔍</span>
              </div>
            </div>
          </div>
          <p className="text-[.7rem] text-gray-400 mb-4">Overview of Latest Month</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[.75rem]">
              <thead className="bg-[#2D334A] text-white">
                <tr>
                  <th className="py-2.5 px-4 font-semibold rounded-tl">RÉFÉRENCE</th>
                  <th className="py-2.5 px-4 font-semibold">UTILISATEUR</th>
                  <th className="py-2.5 px-4 font-semibold">TYPE</th>
                  <th className="py-2.5 px-4 font-semibold">MONTANT</th>
                  <th className="py-2.5 px-4 font-semibold rounded-tr">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {[
                  { ref: "TRX-12348", user: "Cheikh Diop", type: "Premium", amount: "5,000 F", status: "Succès", badge: "bg-[#E9437E]" },
                  { ref: "TRX-12347", user: "Mamadou Ba", type: "À la Une", amount: "10,000 F", status: "Attente", badge: "bg-[#8B5CF6]" },
                  { ref: "TRX-12346", user: "Awa Ndiaye", type: "Premium", amount: "5,000 F", status: "Échoué", badge: "bg-[#3B82F6]" },
                  { ref: "TRX-12345", user: "Fatou Fall", type: "Premium", amount: "5,000 F", status: "Succès", badge: "bg-[#F59E0B]" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-800">{row.ref}</td>
                    <td className="py-3 px-4">{row.user}</td>
                    <td className="py-3 px-4">{row.type}</td>
                    <td className="py-3 px-4 font-medium">{row.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`${row.badge} text-white text-[.6rem] px-2 py-0.5 rounded-full`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center text-[.7rem] text-gray-400">
            <span>Showing 1 to 4 of 28 entries</span>
            <div className="flex gap-1">
              <span className="w-5 h-5 rounded-full bg-[#E9437E] text-white flex items-center justify-center cursor-pointer">1</span>
              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200">2</span>
              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200">...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
