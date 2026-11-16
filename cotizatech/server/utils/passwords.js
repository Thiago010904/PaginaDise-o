import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

// Formato: scrypt$salt$hash (hex)
export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString('hex')}`
}

const DUMMY = hashPassword('dummy-para-igualar-tiempos')

// Si no hay hash (usuario inexistente o sin acceso) se compara contra uno falso
// para que la respuesta tarde lo mismo y no se pueda averiguar qué correos existen.
export function verificarPassword(pw, guardado) {
  const [, salt, hash] = (guardado || DUMMY).split('$')
  const calculado = scryptSync(pw, salt, 64)
  const esperado = Buffer.from(hash, 'hex')
  return Boolean(guardado) && calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
}
