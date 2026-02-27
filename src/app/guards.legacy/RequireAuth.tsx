import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import DashboardSidebar from '../components/DashboardSidebar'
import '../components/DashboardLayout.css'

export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
