import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MemberCard } from '@/components/MemberCard'
import { TeamMember } from '@/lib/types'

const baseMember: TeamMember = {
  id: 'member-1',
  teamId: 'team-1',
  userId: 'user-1',
  name: 'Ada Lovelace',
  points: 12,
  reputationScore: 6.5,
  totalVenuesProposed: 4,
  totalWins: 3,
  isAway: false,
  joinedAt: 1,
}

type MemberCardRenderOptions = {
  member?: TeamMember
  isNextOrganizer?: boolean
  onToggleAway?: ReturnType<typeof vi.fn>
  onRemove?: ReturnType<typeof vi.fn>
  showRemove?: boolean
  setupUser?: boolean
}

const setupMemberCard = (options: MemberCardRenderOptions = {}) => {
  const {
    member = baseMember,
    isNextOrganizer = false,
    onToggleAway = vi.fn(),
    onRemove = vi.fn(),
    showRemove = true,
    setupUser = false,
  } = options

  const user = setupUser ? userEvent.setup() : undefined

  const result = {
    onToggleAway,
    onRemove,
    ...(user ? { user } : {}),
  }

  render(
    <MemberCard
      member={member}
      isNextOrganizer={isNextOrganizer}
      onToggleAway={onToggleAway}
      onRemove={onRemove}
      showRemove={showRemove}
    />,
  )

  return result
}

describe('MemberCard', () => {
  it('renders key details and organizer badge', () => {
    setupMemberCard({
      member: baseMember,
      isNextOrganizer: true,
      onRemove: vi.fn(),
    })

    expect(screen.getByText('AL')).toBeInTheDocument()
    expect(screen.getByText('Herald of the Feast')).toBeInTheDocument()
    expect(screen.getByText('12 quests')).toBeInTheDocument()
    expect(screen.getByText('3 victories')).toBeInTheDocument()
    expect(screen.getByText('6.5')).toBeInTheDocument()
  })

  it('expands details, forwards away and remove actions', async () => {
    const onToggleAway = vi.fn()
    const onRemove = vi.fn()
    const { user } = setupMemberCard({
      member: baseMember,
      isNextOrganizer: false,
      onToggleAway,
      onRemove,
      setupUser: true,
    })

    await user.click(screen.getByText('Ada Lovelace'))

    expect(screen.getByLabelText('Mark as Away')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove from Team' })).toBeInTheDocument()

    await user.click(screen.getByLabelText('Mark as Away'))
    expect(onToggleAway).toHaveBeenCalledWith('member-1', true)

    await user.click(screen.getByRole('button', { name: 'Remove from Team' }))
    expect(onRemove).toHaveBeenCalledWith('member-1')
  })

  it('shows away state and hides removal when requested', async () => {
    const awayMember: TeamMember = { ...baseMember, id: 'member-2', name: 'L. Away', isAway: true }
    const onToggleAway = vi.fn()
    const onRemove = vi.fn()

    const { user } = setupMemberCard({
      member: awayMember,
      isNextOrganizer: true,
      onToggleAway,
      onRemove,
      showRemove: false,
      setupUser: true,
    })

    await user.click(screen.getByText('L. Away'))

    expect(screen.getByText('Away')).toBeInTheDocument()
    expect(screen.queryByText('Herald of the Feast')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove from Team' })).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Mark as Away'))
    expect(onToggleAway).toHaveBeenCalledWith('member-2', false)
  })

  it('shows singular victory label when member has exactly one win', () => {
    setupMemberCard({
      member: { ...baseMember, id: 'member-3', name: 'Single Win', totalWins: 1, totalVenuesProposed: 2 },
      onRemove: vi.fn(),
    })

    expect(screen.getByText('1 victory')).toBeInTheDocument()
  })

  it('hides win counter when member has no wins', () => {
    setupMemberCard({
      member: { ...baseMember, id: 'member-4', name: 'Fresh Rider', totalWins: 0 },
      onRemove: vi.fn(),
    })

    expect(screen.queryByText(/victory/)).not.toBeInTheDocument()
  })

  it('treats missing away flag as not away', async () => {
    const { user } = setupMemberCard({
      member: {
        ...baseMember,
        id: 'member-5',
        isAway: undefined as unknown as boolean,
        name: 'No Away Flag',
      },
      onRemove: vi.fn(),
      setupUser: true,
    })

    await user.click(screen.getByText('No Away Flag'))

    expect(screen.getByText('No Away Flag')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove from Team' })).toBeInTheDocument()
  })
})
