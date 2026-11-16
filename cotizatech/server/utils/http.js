export class HttpError extends Error {
  constructor(status, message, detalle) {
    super(message)
    this.status = status
    this.detalle = detalle
  }
}

// ?pagina=1&por_pagina=8  (por_pagina máx. 100)
export function paginar(query, porDefecto = 50) {
  const por_pagina = Math.min(100, Math.max(1, parseInt(query.por_pagina, 10) || porDefecto))
  const pagina = Math.max(1, parseInt(query.pagina, 10) || 1)
  return { pagina, por_pagina, offset: (pagina - 1) * por_pagina }
}

export const usd = (cop, trm) => Math.round((cop / trm) * 100) / 100
export const cop = (n) => Math.round(n)
