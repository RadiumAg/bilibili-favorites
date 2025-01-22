import Popup from './Popup'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

test('renders name', async () => {
  const { getByText, getByRole } = render(<Popup />)

  await expect.element(getByText('Hello Vitest x1!')).toBeInTheDocument()
  await getByRole('button', { name: 'Increment ' }).click()

  await expect.element(getByText('Hello Vitest x2!')).toBeInTheDocument()
})
