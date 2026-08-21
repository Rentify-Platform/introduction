import * as bcrypt from 'bcrypt'
import { PrismaService } from './prisma/prisma.service'

export const DEMO_ACCOUNTS = [
   {
      id: '10000000-0000-4000-8000-000000000001',
      email: 'admin.demo@rentify.test',
      role: 'admin' as const,
      firstName: 'Demo',
      lastName: 'Administrator',
      passwordVariable: 'DEMO_ADMIN_PASSWORD' as const
   },
   {
      id: '10000000-0000-4000-8000-000000000002',
      email: 'admin.secondary.demo@rentify.test',
      role: 'admin' as const,
      firstName: 'Secondary',
      lastName: 'Administrator',
      passwordVariable: 'DEMO_SECOND_ADMIN_PASSWORD' as const
   },
   {
      id: '10000000-0000-4000-8000-000000000003',
      email: 'guest.demo@rentify.test',
      role: 'guest' as const,
      firstName: 'Demo',
      lastName: 'Guest',
      passwordVariable: 'DEMO_GUEST_PASSWORD' as const
   },
   {
      id: '10000000-0000-4000-8000-000000000004',
      email: 'host.demo@rentify.test',
      role: 'host' as const,
      firstName: 'Demo',
      lastName: 'Host',
      passwordVariable: 'DEMO_HOST_PASSWORD' as const
   }
] as const

export const DEMO_IDS = {
   hostKycDocument: '20000000-0000-4000-8000-000000000001',
   pendingKycDocument: '20000000-0000-4000-8000-000000000002',
   property: '30000000-0000-4000-8000-000000000001',
   propertyLicense: '40000000-0000-4000-8000-000000000001',
   ledgerAccount: '50000000-0000-4000-8000-000000000001'
} as const

type DemoPasswordVariable = (typeof DEMO_ACCOUNTS)[number]['passwordVariable']
export type DemoPasswords = Record<DemoPasswordVariable, string>

export interface DemoAccountUpsert {
   account: (typeof DEMO_ACCOUNTS)[number]
   passwordHash: string
}

export interface DemoSeedSummary {
   accounts: number
   admins: number
   guests: number
   hosts: number
   verifiedHostKyc: number
   pendingKycDocuments: number
   demoProperties: number
   verifiedPropertyLicenses: number
   platformRevenueVndAccounts: number
   platformRevenueVndBalances: number
}

export function readDemoSeedEnvironment(
   environment: NodeJS.ProcessEnv = process.env
): DemoPasswords {
   if (environment.NODE_ENV === 'production') {
      throw new Error('Demo seed is disabled when NODE_ENV=production.')
   }
   if (environment.ALLOW_DEMO_SEED !== 'true') {
      throw new Error('Demo seed requires ALLOW_DEMO_SEED=true.')
   }

   const passwords = {} as DemoPasswords
   for (const account of DEMO_ACCOUNTS) {
      const password = environment[account.passwordVariable]
      if (!password) {
         throw new Error(`Demo seed requires ${account.passwordVariable}.`)
      }
      passwords[account.passwordVariable] = password
   }
   return passwords
}

export async function buildDemoAccountUpserts(
   passwords: DemoPasswords
): Promise<DemoAccountUpsert[]> {
   return Promise.all(
      DEMO_ACCOUNTS.map(async (account) => ({
         account,
         passwordHash: await bcrypt.hash(passwords[account.passwordVariable], 10)
      }))
   )
}

export async function seedDemoData(
   prisma: PrismaService,
   passwords: DemoPasswords
): Promise<DemoSeedSummary> {
   const accountUpserts = await buildDemoAccountUpserts(passwords)

   await prisma.$transaction(async (tx) => {
      const persistedAccounts = new Map<string, string>()

      for (const { account, passwordHash } of accountUpserts) {
         const persisted = await tx.accounts.upsert({
            where: { email: account.email },
            update: {
               password_hash: passwordHash,
               role: account.role,
               status: 'active',
               deleted_at: null,
               updated_at: new Date()
            },
            create: {
               id: account.id,
               email: account.email,
               password_hash: passwordHash,
               role: account.role,
               status: 'active'
            }
         })
         persistedAccounts.set(account.email, persisted.id)

         await tx.profiles.upsert({
            where: { account_id: persisted.id },
            update: {
               first_name: account.firstName,
               last_name: account.lastName,
               guest_kyc_status: account.role === 'host' ? 'verified' : 'unverified',
               updated_at: new Date()
            },
            create: {
               account_id: persisted.id,
               first_name: account.firstName,
               last_name: account.lastName,
               guest_kyc_status: account.role === 'host' ? 'verified' : 'unverified'
            }
         })
      }

      const hostId = persistedAccounts.get('host.demo@rentify.test')!
      const guestId = persistedAccounts.get('guest.demo@rentify.test')!

      await tx.host_profiles.upsert({
         where: { account_id: hostId },
         update: { kyc_status: 'verified', updated_at: new Date() },
         create: {
            account_id: hostId,
            about: 'Synthetic host profile for local Rentify demonstrations.',
            kyc_status: 'verified'
         }
      })

      await tx.kyc_documents.upsert({
         where: { id: DEMO_IDS.hostKycDocument },
         update: {
            account_id: hostId,
            status: 'verified',
            rejection_reason: null
         },
         create: {
            id: DEMO_IDS.hostKycDocument,
            account_id: hostId,
            doc_type: 'national_id',
            country_code: 'VN',
            file_url_front: 'https://example.invalid/rentify-demo/host-identity-front.png',
            status: 'verified'
         }
      })

      await tx.kyc_documents.upsert({
         where: { id: DEMO_IDS.pendingKycDocument },
         update: {
            account_id: guestId,
            status: 'pending',
            rejection_reason: null,
            reviewed_by: null,
            reviewed_at: null
         },
         create: {
            id: DEMO_IDS.pendingKycDocument,
            account_id: guestId,
            doc_type: 'passport',
            country_code: 'VN',
            file_url_front: 'https://example.invalid/rentify-demo/guest-passport-front.png',
            status: 'pending'
         }
      })

      const propertyType = await tx.property_types.upsert({
         where: { code: 'demo_apartment' },
         update: { label: 'Demo Apartment' },
         create: { code: 'demo_apartment', label: 'Demo Apartment' }
      })
      await tx.cancellation_policies.upsert({
         where: { code: 'moderate' },
         update: {},
         create: { code: 'moderate', label: 'Moderate' }
      })

      await tx.properties.upsert({
         where: { id: DEMO_IDS.property },
         update: {
            host_id: hostId,
            property_type_id: propertyType.id,
            status: 'paused',
            title: 'Synthetic Demo Apartment',
            requires_local_license: false,
            deleted_at: null,
            updated_at: new Date()
         },
         create: {
            id: DEMO_IDS.property,
            host_id: hostId,
            property_type_id: propertyType.id,
            room_type: 'entire_place',
            status: 'paused',
            title: 'Synthetic Demo Apartment',
            description: 'Synthetic local-development property for the Rentify admin flow.',
            address_line1: '1 Demo Street',
            city: 'Demo City',
            country_code: 'VN',
            latitude: 10.7769,
            longitude: 106.7009,
            max_guests: 2,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1,
            base_price_cents: 1000000n,
            currency: 'VND',
            cancellation_policy_code: 'moderate',
            requires_local_license: false
         }
      })

      await tx.property_licenses.upsert({
         where: { id: DEMO_IDS.propertyLicense },
         update: {
            property_id: DEMO_IDS.property,
            status: 'verified',
            verified_at: new Date()
         },
         create: {
            id: DEMO_IDS.propertyLicense,
            property_id: DEMO_IDS.property,
            license_number: 'SYNTHETIC-DEMO-LICENSE',
            issuing_authority: 'Synthetic Demo Authority',
            file_url: 'https://example.invalid/rentify-demo/property-license.pdf',
            status: 'verified',
            verified_at: new Date()
         }
      })

      const existingLedgerAccount = await tx.ledger_accounts.findFirst({
         where: {
            owner_type: 'platform',
            owner_account_id: null,
            account_subtype: 'revenue',
            currency: 'VND'
         }
      })
      const ledgerAccount =
         existingLedgerAccount ??
         (await tx.ledger_accounts.create({
            data: {
               id: DEMO_IDS.ledgerAccount,
               owner_type: 'platform',
               owner_account_id: null,
               account_subtype: 'revenue',
               currency: 'VND'
            }
         }))
      await tx.ledger_balances.upsert({
         where: { ledger_account_id: ledgerAccount.id },
         update: {},
         create: { ledger_account_id: ledgerAccount.id, balance_cents: 0n }
      })
   })

   return inspectDemoData(prisma)
}

export async function inspectDemoData(prisma: PrismaService): Promise<DemoSeedSummary> {
   const emails = DEMO_ACCOUNTS.map((account) => account.email)
   const [
      accounts,
      admins,
      guests,
      hosts,
      verifiedHostKyc,
      pendingKycDocuments,
      demoProperties,
      verifiedPropertyLicenses,
      platformRevenueVndAccounts,
      platformRevenueVndBalances
   ] = await Promise.all([
      prisma.accounts.count({ where: { email: { in: emails } } }),
      prisma.accounts.count({ where: { email: { in: emails }, role: 'admin', status: 'active' } }),
      prisma.accounts.count({ where: { email: { in: emails }, role: 'guest', status: 'active' } }),
      prisma.accounts.count({ where: { email: { in: emails }, role: 'host', status: 'active' } }),
      prisma.host_profiles.count({
         where: { accounts: { email: 'host.demo@rentify.test' }, kyc_status: 'verified' }
      }),
      prisma.kyc_documents.count({ where: { id: DEMO_IDS.pendingKycDocument, status: 'pending' } }),
      prisma.properties.count({
         where: { id: DEMO_IDS.property, requires_local_license: false, deleted_at: null }
      }),
      prisma.property_licenses.count({
         where: { id: DEMO_IDS.propertyLicense, status: 'verified' }
      }),
      prisma.ledger_accounts.count({
         where: {
            owner_type: 'platform',
            owner_account_id: null,
            account_subtype: 'revenue',
            currency: 'VND'
         }
      }),
      prisma.ledger_balances.count({
         where: {
            ledger_accounts: {
               owner_type: 'platform',
               owner_account_id: null,
               account_subtype: 'revenue',
               currency: 'VND'
            }
         }
      })
   ])
   return {
      accounts,
      admins,
      guests,
      hosts,
      verifiedHostKyc,
      pendingKycDocuments,
      demoProperties,
      verifiedPropertyLicenses,
      platformRevenueVndAccounts,
      platformRevenueVndBalances
   }
}
