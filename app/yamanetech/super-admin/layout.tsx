// Le Super Admin est une application autonome (shell + sidebar + login intégrés
// dans SuperAdminApp). On ne wrappe donc pas avec l'ancienne sidebar.
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0D1117]">{children}</div>;
}
