function generateSecureCode(length: number = 6): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, length)
    .toUpperCase()
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
