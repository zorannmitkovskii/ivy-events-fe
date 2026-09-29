import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Calls the server now refuses without a token.
 *
 * <p>Assigning the USER role after Google sign-up, and deleting gallery or
 * invitation images, used to go through the bare public client. The server
 * requires the signed-in user for each of them now, so they go through the
 * authenticated client — which also refreshes an expired token on the way.
 */

const client = vi.hoisted(() => ({
  api: { post: vi.fn(async () => ({})), del: vi.fn(async () => ({})), get: vi.fn() },
  scheduleProactiveRefresh: vi.fn(),
}))
vi.mock('@/services/api', () => client)
vi.mock('@/services/baseUrl', () => ({ baseUrl: 'http://api.test' }))
vi.mock('@/services/iamApi', () => ({ default: { post: vi.fn(), get: vi.fn() } }))
vi.mock('@/services/backendApi', () => ({ default: { post: vi.fn(), get: vi.fn(), delete: vi.fn() } }))

const { assignRole } = await import('@/services/auth.service')
const { mediaService } = await import('@/services/media.service')
const { invitationImagesService } = await import('@/services/invitationImages.service')

beforeEach(() => vi.clearAllMocks())

describe('calls that need the signed-in user', () => {
  it('assigns the role through the authenticated client', async () => {
    await assignRole('ana@example.com', 'USER')

    expect(client.api.post).toHaveBeenCalledWith('http://api.test/public/users/assign-role',
      { email: 'ana@example.com', role: 'USER' })
  })

  it('deletes a gallery photo, one or several, with the token', async () => {
    await mediaService.deleteById('f-1')
    await mediaService.deleteSelected(['f-1', 'f-2'])

    expect(client.api.del).toHaveBeenCalledWith('http://api.test/public/media/f-1')
    expect(client.api.post).toHaveBeenCalledWith('http://api.test/public/media/delete/selected', ['f-1', 'f-2'])
  })

  it('deletes an invitation image with the token', async () => {
    await invitationImagesService.deleteOurStoryImage('e-1', 'https://cdn/e-1/pokana/a.jpg')

    expect(client.api.del).toHaveBeenCalledWith('http://api.test/public/media',
      { params: { path: 'https://cdn/e-1/pokana/a.jpg' } })
  })
})
