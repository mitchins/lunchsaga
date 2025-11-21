function generateSecureCode(length: number = 6): string {
  const array = new Uint8Array(Math.ceil(length * 1.5)) // Generate extra bytes to ensure we get enough characters
  crypto.getRandomValues(array)
  const base36String = Array.from(array, byte => byte.toString(36))
    .join('')
    .replace(/[^a-z0-9]/g, '') // Remove any non-alphanumeric characters
    .substring(0, length)
    .toUpperCase()
  
  // If we didn't get enough characters, recursively generate more
  if (base36String.length < length) {
    return (base36String + generateSecureCode(length - base36String.length)).substring(0, length)
  }
  
  return base36String
}

export async function sendMagicLink(email: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const linkCode = generateSecureCode(6)
  localStorage.setItem('magic-link-code', linkCode)
  localStorage.setItem('magic-link-email', email)
  
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log(`🔗 Magic link code for ${email}: ${linkCode}`)
  }
  
  return true
}

export async function verifyMagicLink(email: string, code: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const storedCode = localStorage.getItem('magic-link-code')
  const storedEmail = localStorage.getItem('magic-link-email')
  
  if (storedCode === code && storedEmail === email) {
    localStorage.removeItem('magic-link-code')
    localStorage.removeItem('magic-link-email')
    return true
  }
  
  return false
}

export function generateInviteCode(): string {
  return generateSecureCode(6)
}
