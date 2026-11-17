import { useCallback, useEffect, useState } from 'react'

// Llama a una función del API y maneja los estados de carga y error.
//   const { datos, cargando, error, recargar } = useApi(() => cotizacionesApi.resumen(), [])
// Cada vez que cambian las dependencias vuelve a pedir los datos.
export function useApi(funcion, deps) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null })
  const [version, setVersion] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pedir = useCallback(funcion, deps)

  useEffect(() => {
    let vigente = true   // evita guardar una respuesta vieja si el usuario cambió de filtro
    setEstado((e) => ({ ...e, cargando: true, error: null }))
    pedir()
      .then((datos) => vigente && setEstado({ datos, cargando: false, error: null }))
      .catch((error) => vigente && setEstado((e) => ({ ...e, cargando: false, error })))
    return () => { vigente = false }
  }, [pedir, version])

  return { ...estado, recargar: () => setVersion((v) => v + 1) }
}
