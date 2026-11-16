const prod = process.env.NODE_ENV === 'production'

if (prod && !process.env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en producción. Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"')
}

export const config = {
  prod,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'secreto-solo-para-desarrollo',
  cookieName: 'cotizatech_token',
  sesionHoras: 8,
  // Marca como "Vencida" las cotizaciones enviadas cuya validez ya pasó (cada hora)
  autoVencer: process.env.AUTO_VENCER === 'true',
}
