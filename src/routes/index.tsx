import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'

// TODO(LN Long — task 1.3): route config đầy đủ + ProtectedRoute theo 3 role
// TODO(LN Long — task 1.4): AuthLayout / ClientLayout / DashboardLayout
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
])
