/**
 * Unit tests cho client api-client interceptors.
 *
 * Behavior được khóa lại (Phase 7 — client session handling):
 * - 401 (token cũ sau khi account bị suspend/ban -> token_version tăng): token phải bị
 *   xóa khỏi localStorage VÀ zustand auth store phải được clear để UI thoát trạng thái
 *   đăng nhập ngay lập tức, không cần chờ reload.
 * - Control case: lỗi không phải 401 (403/500/network) và response thành công
 *   không được đụng vào session đang đăng nhập.
 * - Request interceptor phải gắn Bearer token từ localStorage.
 * - Edge case: error không có `response` (network fail) không được đụng session.
 */
const mockInterceptorRegistry = {
   request: [] as Array<{
      fulfilled: (config: Record<string, unknown>) => unknown
      rejected?: (error: unknown) => unknown
   }>,
   response: [] as Array<{
      fulfilled: (response: unknown) => unknown
      rejected?: (error: unknown) => unknown
   }>
}

jest.mock('axios', () => ({
   __esModule: true,
   default: {
      create: jest.fn(() => ({
         interceptors: {
            request: {
               use: (fulfilled: unknown, rejected?: unknown) =>
                  mockInterceptorRegistry.request.push({
                     fulfilled: fulfilled as never,
                     rejected: rejected as never
                  })
            },
            response: {
               use: (fulfilled: unknown, rejected?: unknown) =>
                  mockInterceptorRegistry.response.push({
                     fulfilled: fulfilled as never,
                     rejected: rejected as never
                  })
            }
         }
      }))
   }
}))

import { useAuthStore } from '@/features/auth/stores/auth-store'
// Import đăng ký interceptors trên axios instance đã được mock

import './api-client'

const localStorageBacking = new Map<string, string>()
const localStorageStub = {
   getItem: (key: string) => (localStorageBacking.has(key) ? localStorageBacking.get(key)! : null),
   setItem: (key: string, value: string) => void localStorageBacking.set(key, value),
   removeItem: (key: string) => void localStorageBacking.delete(key),
   clear: () => void localStorageBacking.clear()
}

function loggedInState() {
   return {
      token: 'stale-jwt-token',
      user: {
         id: 'user-1',
         email: 'guest@example.com',
         firstName: 'Guest',
         lastName: 'One',
         role: 'guest'
      },
      isAuthenticated: true,
      isInitialized: true
   }
}

function loginSession() {
   useAuthStore.setState(loggedInState())
   localStorageBacking.set('rentify_token', 'stale-jwt-token')
}

function make401Error(message: unknown) {
   return Object.assign(new Error('request failed'), {
      response: { status: 401, data: { message } },
      isAxiosError: true
   })
}

describe('client api-client interceptors', () => {
   beforeAll(() => {
      // api-client chỉ đụng localStorage/window khi `typeof window !== 'undefined'`
      ;(globalThis as Record<string, unknown>).window = globalThis
      Object.defineProperty(globalThis, 'localStorage', {
         value: localStorageStub,
         configurable: true
      })
   })

   beforeEach(() => {
      localStorageBacking.clear()
      useAuthStore.setState({
         token: null,
         user: null,
         isAuthenticated: false,
         isInitialized: true
      })
   })

   describe('response interceptor — 401 revoked session', () => {
      it('clears localStorage token AND auth store state on 401', async () => {
         loginSession()

         const handler = mockInterceptorRegistry.response[0].rejected!
         const error = make401Error('Account suspended')

         await expect(Promise.resolve().then(() => handler(error))).rejects.toBe(error)

         expect(localStorageBacking.has('rentify_token')).toBe(false)
         const state = useAuthStore.getState()
         expect(state.isAuthenticated).toBe(false)
         expect(state.token).toBeNull()
         expect(state.user).toBeNull()
      })

      it('maps a single backend message onto error.message on 401', async () => {
         loginSession()

         const handler = mockInterceptorRegistry.response[0].rejected!
         const error = make401Error('Session has been revoked')

         await expect(Promise.resolve().then(() => handler(error))).rejects.toBe(error)

         expect((error as { message: string }).message).toBe('Session has been revoked')
      })

      it('maps an array backend message onto error.message joined by comma', async () => {
         loginSession()

         const handler = mockInterceptorRegistry.response[0].rejected!
         const error = make401Error(['Invalid token', 'Token version mismatch'])

         await expect(Promise.resolve().then(() => handler(error))).rejects.toBe(error)

         expect((error as { message: string }).message).toBe(
            'Invalid token, Token version mismatch'
         )
      })

      it('stays clean when a second 401 arrives after the session was already cleared', async () => {
         loginSession()
         const handler = mockInterceptorRegistry.response[0].rejected!

         await expect(
            Promise.resolve().then(() => handler(make401Error('first')))
         ).rejects.toBeTruthy()
         await expect(
            Promise.resolve().then(() => handler(make401Error('second')))
         ).rejects.toEqual(
            expect.objectContaining({ response: expect.objectContaining({ status: 401 }) })
         )

         expect(localStorageBacking.has('rentify_token')).toBe(false)
         expect(useAuthStore.getState().isAuthenticated).toBe(false)
      })
   })

   describe('response interceptor — control cases keep the session', () => {
      it('does NOT clear session on 403 (non-401 error)', async () => {
         loginSession()

         const handler = mockInterceptorRegistry.response[0].rejected!
         const error = { response: { status: 403, data: { message: 'Forbidden' } } }

         await expect(Promise.resolve().then(() => handler(error))).rejects.toBe(error)

         expect(localStorageBacking.get('rentify_token')).toBe('stale-jwt-token')
         expect(useAuthStore.getState().isAuthenticated).toBe(true)
         expect(useAuthStore.getState().user).toEqual(loggedInState().user)
      })

      it('does NOT clear session on 500 (non-401 error)', async () => {
         loginSession()

         const handler = mockInterceptorRegistry.response[0].rejected!
         const error = { response: { status: 500, data: { message: 'Internal error' } } }

         await expect(Promise.resolve().then(() => handler(error))).rejects.toBe(error)

         expect(localStorageBacking.get('rentify_token')).toBe('stale-jwt-token')
         expect(useAuthStore.getState().isAuthenticated).toBe(true)
      })

      it('does NOT clear session on network error without a response object', async () => {
         loginSession()

         const handler = mockInterceptorRegistry.response[0].rejected!
         const error = new Error('Network Error')

         await expect(Promise.resolve().then(() => handler(error))).rejects.toBe(error)

         expect(localStorageBacking.get('rentify_token')).toBe('stale-jwt-token')
         expect(useAuthStore.getState().isAuthenticated).toBe(true)
      })

      it('passes successful responses through unchanged', () => {
         loginSession()

         const handler = mockInterceptorRegistry.response[0].fulfilled!
         const response = { data: { success: true, data: { id: 'booking-1' } } }

         expect(handler(response)).toBe(response)
         expect(useAuthStore.getState().isAuthenticated).toBe(true)
      })
   })

   describe('request interceptor — bearer token', () => {
      it('attaches Authorization header from localStorage token', () => {
         loginSession()

         const handler = mockInterceptorRegistry.request[0].fulfilled!
         const config = { headers: {} as Record<string, string> }

         const result = handler(config) as { headers: Record<string, string> }

         expect(result.headers.Authorization).toBe('Bearer stale-jwt-token')
      })

      it('does not attach Authorization header when no token exists', () => {
         const handler = mockInterceptorRegistry.request[0].fulfilled!
         const config = { headers: {} as Record<string, string> }

         const result = handler(config) as { headers: Record<string, string> }

         expect(result.headers.Authorization).toBeUndefined()
      })
   })
})
