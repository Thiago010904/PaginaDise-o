import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { CotizacionesProvider } from './context/CotizacionesContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Catalogo from './pages/Catalogo.jsx'
import Cotizaciones from './pages/Cotizaciones.jsx'
import CotizacionDetalle from './pages/CotizacionDetalle.jsx'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function SoloComprador({ children }) {
  const { user } = useAuth()
  return user.rol === 'admin' ? <Navigate to="/cotizaciones" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <CotizacionesProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/catalogo" element={<SoloComprador><Catalogo /></SoloComprador>} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/cotizaciones/:folio" element={<CotizacionDetalle />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CotizacionesProvider>
    </AuthProvider>
  )
}