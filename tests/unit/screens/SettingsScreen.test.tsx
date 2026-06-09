import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
