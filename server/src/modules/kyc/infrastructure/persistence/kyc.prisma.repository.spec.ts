import { PrismaService } from '../../../../prisma/prisma.service'
import { KycPrismaRepository } from './kyc.prisma.repository'

type TxMock = {
   profiles: { update: jest.Mock }
   host_profiles: { findUnique: jest.Mock; update: jest.Mock }
}

describe('KycPrismaRepository.updateProfileKycStatus', () => {
   let repository: KycPrismaRepository
   let prisma: {
      $transaction: jest.Mock
      profiles: { update: jest.Mock }
      host_profiles: { findUnique: jest.Mock; update: jest.Mock }
   }
   let tx: TxMock

   const buildTx = (): TxMock => ({
      profiles: { update: jest.fn().mockResolvedValue({}) },
      host_profiles: {
         findUnique: jest
            .fn()
            .mockResolvedValue({ account_id: 'acc-123', kyc_status: 'unverified' }),
         update: jest.fn().mockResolvedValue({})
      }
   })

   beforeEach(() => {
      tx = buildTx()
      // $transaction invokes the callback with an interactive transaction client
      prisma = {
         $transaction: jest.fn(async (callback: (client: TxMock) => Promise<unknown>) =>
            callback(tx)
         ),
         profiles: { update: jest.fn() },
         host_profiles: { findUnique: jest.fn(), update: jest.fn() }
      }

      repository = new KycPrismaRepository(prisma as unknown as PrismaService)
   })

   it('updates guest and host profile statuses together inside one transaction', async () => {
      await repository.updateProfileKycStatus('acc-123', 'verified')

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(tx.profiles.update).toHaveBeenCalledWith({
         where: { account_id: 'acc-123' },
         data: { guest_kyc_status: 'verified' }
      })
      expect(tx.host_profiles.findUnique).toHaveBeenCalledWith({
         where: { account_id: 'acc-123' }
      })
      expect(tx.host_profiles.update).toHaveBeenCalledWith({
         where: { account_id: 'acc-123' },
         data: { kyc_status: 'verified' }
      })
   })

   it('keeps both profiles consistent with one identity decision (same status everywhere)', async () => {
      await repository.updateProfileKycStatus('acc-123', 'rejected')

      expect(tx.profiles.update).toHaveBeenCalledWith({
         where: { account_id: 'acc-123' },
         data: { guest_kyc_status: 'rejected' }
      })
      expect(tx.host_profiles.update).toHaveBeenCalledWith({
         where: { account_id: 'acc-123' },
         data: { kyc_status: 'rejected' }
      })
   })

   it('does not touch host profile when the account has no host profile', async () => {
      tx.host_profiles.findUnique.mockResolvedValue(null)

      await expect(repository.updateProfileKycStatus('acc-123', 'pending')).resolves.toBeUndefined()

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(tx.profiles.update).toHaveBeenCalledTimes(1)
      expect(tx.host_profiles.update).not.toHaveBeenCalled()
   })

   it('repeated calls produce independent transactions with their own status', async () => {
      await repository.updateProfileKycStatus('acc-123', 'pending')
      await repository.updateProfileKycStatus('acc-123', 'verified')

      expect(prisma.$transaction).toHaveBeenCalledTimes(2)
      expect(tx.profiles.update).toHaveBeenNthCalledWith(1, {
         where: { account_id: 'acc-123' },
         data: { guest_kyc_status: 'pending' }
      })
      expect(tx.profiles.update).toHaveBeenNthCalledWith(2, {
         where: { account_id: 'acc-123' },
         data: { guest_kyc_status: 'verified' }
      })
      expect(tx.host_profiles.update).toHaveBeenNthCalledWith(1, {
         where: { account_id: 'acc-123' },
         data: { kyc_status: 'pending' }
      })
      expect(tx.host_profiles.update).toHaveBeenNthCalledWith(2, {
         where: { account_id: 'acc-123' },
         data: { kyc_status: 'verified' }
      })
   })

   it('propagates the guest profile update failure instead of swallowing it', async () => {
      tx.profiles.update.mockRejectedValue(new Error('profiles update failed'))

      await expect(repository.updateProfileKycStatus('acc-123', 'verified')).rejects.toThrow(
         'profiles update failed'
      )
      expect(tx.host_profiles.findUnique).not.toHaveBeenCalled()
      expect(tx.host_profiles.update).not.toHaveBeenCalled()
   })

   it('propagates the host profile update failure so the transaction can roll back', async () => {
      tx.host_profiles.update.mockRejectedValue(new Error('host profile update failed'))

      await expect(repository.updateProfileKycStatus('acc-123', 'verified')).rejects.toThrow(
         'host profile update failed'
      )
      // Guest update ran inside the same transaction; real DB rolls it back together
      expect(tx.profiles.update).toHaveBeenCalledTimes(1)
      expect(tx.host_profiles.update).toHaveBeenCalledTimes(1)
   })
})
