import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, inicio } from './context/AuthContext.jsx'
import { CotizacionesProvider } from './context/CotizacionesContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/auth/Login.jsx'
import Registro from './pages/auth/Registro.jsx'
import Dashboard from './pages/comprador/Dashboard.jsx'
import Catalogo from './pages/comprador/Catalogo.jsx'
import Cotizaciones from './pages/comprador/Cotizaciones.jsx'
import CotizacionDetalle from './pages/comprador/CotizacionDetalle.jsx'
import Perfil from './pages/comprador/Perfil.jsx'
import PanelAsesor from './pages/asesor/PanelAsesor.jsx'
import BandejaSolicitudes from './pages/asesor/BandejaSolicitudes.jsx'
import CotizacionesAsesor from './pages/asesor/CotizacionesAsesor.jsx'
import EditorCotizacion from './pages/asesor/EditorCotizacion.jsx'
import Clientes from './pages/asesor/Clientes.jsx'
import Reportes from './pages/asesor/Reportes.jsx'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// Solo deja pasar al rol indicado; si no, lo manda a su página de inicio
function Solo({ rol, children }) {
  const { user } = useAuth()
  return user.rol === rol ? children : <Navigate to={inicio(user)} replace />
}

const comprador = (el) => <Solo rol="comprador">{el}</Solo>
const asesor = (el) => <Solo rol="asesor">{el}</Solo>

export default function App() {
  return (
    <AuthProvider>
      <CotizacionesProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/dashboard" element={comprador(<Dashboard />)} />
            <Route path="/catalogo" element={comprador(<Catalogo />)} />
            <Route path="/cotizaciones" element={comprador(<Cotizaciones />)} />
            <Route path="/cotizaciones/:folio" element={comprador(<CotizacionDetalle />)} />
            <Route path="/perfil" element={comprador(<Perfil />)} />

            <Route path="/asesor" element={asesor(<PanelAsesor />)} />
            <Route path="/asesor/solicitudes" element={asesor(<BandejaSolicitudes />)} />
            <Route path="/asesor/cotizaciones" element={asesor(<CotizacionesAsesor />)} />
            <Route path="/asesor/cotizaciones/:id" element={asesor(<EditorCotizacion />)} />
            <Route path="/asesor/clientes" element={asesor(<Clientes />)} />
            <Route path="/asesor/reportes" element={asesor(<Reportes />)} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CotizacionesProvider>
    </AuthProvider>
  )
}
