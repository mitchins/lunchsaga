function generateSecureCode(length: number = 6): string {
  // Use a loop-based approach to avoid potential stack overflow
  let result = ''
  const bytesNeeded = Math.ceil(length * 1.5)
  
  while (result.length < length) {
    const array = new Uint8Array(bytesNeeded)
    crypto.getRandomValues(array)
    const chunk = Array.from(array, byte => byte.toString(36))
      .join('')
      .replace(/[^a-z0-9]/g, '')
      .toUpperCase()
    result += chunk
  }
  
  return result.substring(0, length)
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
