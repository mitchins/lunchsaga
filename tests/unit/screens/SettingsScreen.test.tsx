import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { Team } from '@/lib/types'

const team: Team = {
  id: 'team-1',
  name: 'Test Team',
  emoji: '🧪',
  color: '#ff0000',
  ownerId: 'owner-1',
  inviteCode: 'ABCD1234',
  isHolidayMode: false,
  createdAt: 1,
}

describe('SettingsScreen', () => {
  it('saves a changed team name', async () => {
    const onUpdateTeam = vi.fn().mockResolvedValue(undefined)

    render(
      <SettingsScreen
        team={team}
        isHolidayMode={false}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
        onUpdateTeam={onUpdateTeam}
      />,
    )

    const teamNameInput = screen.getByLabelText('Team Name')
    fireEvent.change(teamNameInput, { target: { value: 'Renamed Team' } })

    const saveButton = screen.getByRole('button', { name: 'Save Team Name' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onUpdateTeam).toHaveBeenCalledWith({ name: 'Renamed Team' })
    })
  })

  it('ignores save when no name changes are pending', () => {
    const onUpdateTeam = vi.fn().mockResolvedValue(undefined)

    render(
      <SettingsScreen
        team={team}
        isHolidayMode={false}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
        onUpdateTeam={onUpdateTeam}
      />,
    )

    expect(screen.getByRole('button', { name: 'Save Team Name' })).toBeDisabled()
    expect(onUpdateTeam).not.toHaveBeenCalled()
  })

  it('syncs team name when the selected team changes', async () => {
    const user = userEvent.setup()
    const onUpdateTeam = vi.fn().mockResolvedValue(undefined)

    const { rerender } = render(
      <SettingsScreen
        team={{ ...team, name: 'First Team' }}
        isHolidayMode={false}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
        onUpdateTeam={onUpdateTeam}
      />,
    )

    const nameInput = screen.getByLabelText('Team Name')
    expect(nameInput).toHaveValue('First Team')

    await user.clear(nameInput)
    await user.type(nameInput, 'Second Team')

    await rerender(
      <SettingsScreen
        team={{ ...team, name: 'Second Team' }}
        isHolidayMode={false}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
        onUpdateTeam={onUpdateTeam}
      />,
    )

    expect(nameInput).toHaveValue('Second Team')
  })

  it('does nothing when save is attempted without an update callback', async () => {
    const user = userEvent.setup()

    render(
      <SettingsScreen
        team={team}
        isHolidayMode={false}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
      />,
    )

    const teamNameInput = screen.getByLabelText('Team Name')
    await user.clear(teamNameInput)
    await user.type(teamNameInput, 'No Callback Team')

    const saveButton = screen.getByRole('button', { name: 'Save Team Name' })
    expect(saveButton).toBeEnabled()
    await user.click(saveButton)

    expect(saveButton).toBeEnabled()
    expect(screen.getByDisplayValue('No Callback Team')).toBeInTheDocument()
  })

  it('renders the holiday mode switch with stable test id', () => {
    render(
      <SettingsScreen
        team={team}
        isHolidayMode={true}
        onBack={vi.fn()}
        onToggleHoliday={vi.fn()}
      />,
    )

    const holidaySwitch = screen.getByRole('switch', { name: 'Enable Holiday Mode' })
    expect(screen.getByTestId('settings-holiday-toggle')).toBeInTheDocument()
    expect(holidaySwitch).toBeInTheDocument()
    expect(holidaySwitch).toHaveAttribute('aria-checked', 'true')
  })
})
