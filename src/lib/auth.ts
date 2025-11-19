export async function sendMagicLink(email: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  localStorage.setItem('magic-link-code', linkCode)
  localStorage.setItem('magic-link-email', email)
  
  console.log(`🔗 Magic link code for ${email}: ${linkCode}`)
  
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
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
