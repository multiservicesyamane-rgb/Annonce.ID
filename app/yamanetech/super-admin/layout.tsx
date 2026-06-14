import AdminSidebar from './_components/AdminSidebar'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-[#111111]">
        {children}
      </main>
    </div>
  )
}
