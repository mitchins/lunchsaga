import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authAPI } from '@/services/api'
import { User } from '@/lib/types'
import { EnvelopeSimple, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SagaBrand } from '@/components/SagaBrand'

interface LoginScreenProps {
  onLogin: (user: User) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await authAPI.sendMagicLink(email)
      setStep('code')
      toast.success('Check your console for the magic link code! 🪄')
    } catch (error) {
      console.error('Failed to send magic link:', error)
      toast.error('Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { user: apiUser } = await authAPI.verify(email, code.toUpperCase())
      const user: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name,
        avatar: apiUser.avatar || undefined,
        createdAt: Date.now(),
      }
      onLogin(user)
      toast.success('Welcome to the saga! 🎉')
    } catch (error) {
      console.error('Verification failed:', error)
      toast.error('Invalid code. Please try again.')
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saga-gold-muted via-background to-saga-navy/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <SagaBrand size="lg" />

        <Card className="border-saga-gold/20 shadow-lg">
          <CardHeader>
            <CardTitle>
              {step === 'email' ? 'Begin Your Saga' : 'Enter Your Code'}
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Enter your email to receive a magic link'
                : `A code has been sent to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  <EnvelopeSimple size={18} />
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    autoFocus
                    className="text-center text-lg tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dev mode: use code <span className="font-mono font-bold">000000</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    <Check size={18} weight="bold" />
                    {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setStep('email')}
                  >
                    Use a different email
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
