import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TeamHeader } from '@/components/TeamHeader'
import { Team, User } from '@/lib/types'

const team: Team = {
  id: 'team-1',
  name: 'Lunch Guild',
  emoji: '🍽️',
  color: '#ff5500',
  ownerId: 'owner-1',
  inviteCode: 'ABCD1234',
  isHolidayMode: false,
  createdAt: 1,
}

const user: User = {
  id: 'owner-1',
  name: 'Riley',
  email: 'riley@example.com',
  createdAt: 1,
}

const sonnerMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: sonnerMock,
}))

describe('TeamHeader', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('copies the invite code and shows owner badge', async () => {
    const userEventClient = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<TeamHeader team={team} user={user} memberCount={1} onBack={vi.fn()} />)

    expect(screen.getByText('Guild Master')).toBeInTheDocument()
    await userEventClient.click(screen.getByRole('button', { name: /invite/i }))

    const dialog = await screen.findByRole('dialog')
    const dialogButtons = within(dialog).getAllByRole('button')
    const copyButton = dialogButtons.find((button) => button.getAttribute('aria-label') !== 'Close')

    expect(copyButton).toBeDefined()
    await userEventClient.click(copyButton as HTMLButtonElement)

    expect(writeText).toHaveBeenCalledWith('ABCD1234')
    expect(sonnerMock.success).toHaveBeenCalledWith('Invite code copied!')
  })

  it('surfaces an error when invite copy fails', async () => {
    const userEventClient = userEvent.setup()
    const clipboardError = new Error('No permission')
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(clipboardError) },
    })
    const consoleSpy = vi.spyOn(console, 'error')

    render(
      <TeamHeader
        team={{ ...team, ownerId: 'not-owner' }}
        user={user}
        memberCount={2}
        onBack={vi.fn()}
      />,
    )

    await userEventClient.click(screen.getByRole('button', { name: /invite/i }))

    const dialog = await screen.findByRole('dialog')
    const dialogButtons = within(dialog).getAllByRole('button')
    const copyButton = dialogButtons.find((button) => button.getAttribute('aria-label') !== 'Close')

    expect(copyButton).toBeDefined()
    await userEventClient.click(copyButton as HTMLButtonElement)

    expect(sonnerMock.error).toHaveBeenCalledWith('Could not copy invite code')
    expect(consoleSpy).toHaveBeenCalledWith('Failed to copy invite code:', clipboardError)
    expect(screen.getByText('2 members in the fellowship')).toBeInTheDocument()
    expect(screen.getByText('Invite to Lunch Guild')).toBeInTheDocument()
  })
})
