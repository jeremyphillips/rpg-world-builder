import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>
}

describe('Example', () => {
  it('renders greeting', () => {
    render(<Hello name="World" />)
    expect(screen.getByRole('heading')).toHaveTextContent('Hello, World!')
  })
})
