import HeaderDashboard from '@/components/ui/HeaderDashboard'

export default function DashboardLayout({ children }) {
  return (
    <>
      <HeaderDashboard />
      {children}
    </>
  )
}
