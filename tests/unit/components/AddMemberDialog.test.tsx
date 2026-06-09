import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AddMemberDialog } from '@/components/AddMemberDialog'

describe('AddMemberDialog', () => {
  it('submits a trimmed email and closes the dialog', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddMemberDialog onAdd={onAdd} averagePoints={7} />)

    await user.click(screen.getByRole('button', { name: 'Add Member' }))
    const dialog = await screen.findByRole('dialog')
    const submitButton = within(dialog).getByRole('button', { name: 'Add Member' })
    const emailInput = within(dialog).getByLabelText('Email')

    expect(submitButton).toBeDisabled()

    await user.type(emailInput, '   test@example.com   ')
    expect(submitButton).toBeEnabled()

    await user.click(submitButton)

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith('test@example.com')
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('does not submit when the email field is blank', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddMemberDialog onAdd={onAdd} averagePoints={7} />)

    await user.click(screen.getByRole('button', { name: 'Add Member' }))
    const dialog = await screen.findByRole('dialog')
    const submitButton = within(dialog).getByRole('button', { name: 'Add Member' })
    const cancelButton = within(dialog).getByRole('button', { name: 'Cancel' })

    expect(submitButton).toBeDisabled()
    await user.click(submitButton)

    expect(onAdd).not.toHaveBeenCalled()

    await user.click(cancelButton)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
