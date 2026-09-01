import * as bcrypt from 'bcrypt'
import {
   buildDemoAccountUpserts,
   DEMO_ACCOUNTS,
   DemoPasswords,
   readDemoSeedEnvironment
} from './demo-seed'

describe('development demo seed contract', () => {
   const validEnvironment = {
      NODE_ENV: 'development',
      ALLOW_DEMO_SEED: 'true',
      DEMO_ADMIN_PASSWORD: 'admin-secret',
      DEMO_SECOND_ADMIN_PASSWORD: 'second-admin-secret',
      DEMO_GUEST_PASSWORD: 'guest-secret',
      DEMO_HOST_PASSWORD: 'host-secret'
   }

   it('refuses to run in production', () => {
      expect(() =>
         readDemoSeedEnvironment({ ...validEnvironment, NODE_ENV: 'production' })
      ).toThrow('Demo seed is disabled when NODE_ENV=production.')
   })

   it('requires explicit opt-in', () => {
      expect(() =>
         readDemoSeedEnvironment({ ...validEnvironment, ALLOW_DEMO_SEED: 'false' })
      ).toThrow('Demo seed requires ALLOW_DEMO_SEED=true.')
   })

   it.each(DEMO_ACCOUNTS.map((account) => account.passwordVariable))(
      'requires %s',
      (passwordVariable) => {
         const environment = { ...validEnvironment }
         delete environment[passwordVariable]
         expect(() => readDemoSeedEnvironment(environment)).toThrow(
            `Demo seed requires ${passwordVariable}.`
         )
      }
   )

   it('defines exactly two admins, one guest and one host with unique deterministic keys', () => {
      expect(DEMO_ACCOUNTS).toHaveLength(4)
      expect(DEMO_ACCOUNTS.filter((account) => account.role === 'admin')).toHaveLength(2)
      expect(DEMO_ACCOUNTS.filter((account) => account.role === 'guest')).toHaveLength(1)
      expect(DEMO_ACCOUNTS.filter((account) => account.role === 'host')).toHaveLength(1)
      expect(new Set(DEMO_ACCOUNTS.map((account) => account.id))).toHaveProperty('size', 4)
      expect(new Set(DEMO_ACCOUNTS.map((account) => account.email))).toHaveProperty('size', 4)
   })

   it('replaces existing demo password hashes when password values change', async () => {
      const oldPasswords = readDemoSeedEnvironment(validEnvironment)
      const changedPasswords = Object.fromEntries(
         DEMO_ACCOUNTS.map((account) => [
            account.passwordVariable,
            `${oldPasswords[account.passwordVariable]}-changed`
         ])
      ) as DemoPasswords

      const originalUpserts = await buildDemoAccountUpserts(oldPasswords)
      const changedUpserts = await buildDemoAccountUpserts(changedPasswords)

      for (const account of DEMO_ACCOUNTS) {
         const original = originalUpserts.find((entry) => entry.account.id === account.id)!
         const changed = changedUpserts.find((entry) => entry.account.id === account.id)!

         expect(changed.account.id).toBe(original.account.id)
         expect(changed.account.email).toBe(original.account.email)
         await expect(
            bcrypt.compare(oldPasswords[account.passwordVariable], changed.passwordHash)
         ).resolves.toBe(false)
         await expect(
            bcrypt.compare(changedPasswords[account.passwordVariable], changed.passwordHash)
         ).resolves.toBe(true)
      }
   })
})
