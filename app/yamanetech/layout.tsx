export default function YamanetechLayout({ children }: { children: React.ReactNode }) {
  // Just pass through children, the super-admin folder has its own layout now.
  return <>{children}</>;
}
