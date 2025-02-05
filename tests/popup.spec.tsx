import { test } from 'vitest'
import { render } from '@testing-library/react'
import Popup from '../src/popup/Popup'

test('renders name', async () => {
  render(<Popup />)
})
