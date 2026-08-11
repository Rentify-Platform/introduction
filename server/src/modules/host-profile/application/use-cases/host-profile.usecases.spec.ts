import { BecomeHostUseCase, BecomeHostCommand } from './become-host.usecase'
import { SubmitHostTaxInfoUseCase, SubmitTaxInfoCommand } from './submit-tax-info.usecase'
import { SetupHostPayoutUseCase, SetupPayoutCommand } from './setup-payout.usecase'
import { GetHostProfileUseCase, GetHostProfileCommand } from './get-host-profile.usecase'
import { UpdateAboutUseCase, UpdateAboutCommand } from './update-about.usecase'
import { HostProfileRepository } from '../../domain/repositories/host-profile.repository'
import { EncryptionPort } from '../ports/encryption.port'
import { HostProfile } from '../../domain/entities/host-profile.entity'
import {
   HostProfileAlreadyExistsException,
   HostProfileNotFoundException,
   TaxInfoValidationFailedException
} from '../../domain/errors/host-profile.errors'

describe('HostProfile Use Cases', () => {
   let hostProfileRepository: jest.Mocked<HostProfileRepository>
   let encryptionPort: jest.Mocked<EncryptionPort>

   beforeEach(() => {
      hostProfileRepository = {
         findByAccountId: jest.fn(),
         save: jest.fn(),
         getGuestKycStatus: jest.fn(),
         updateAccountRoleToHost: jest.fn()
      }

      encryptionPort = {
         encrypt: jest.fn(),
         decrypt: jest.fn()
      }
   })

   describe('BecomeHostUseCase', () => {
      it('should successfully create host profile and promote account role', async () => {
         hostProfileRepository.findByAccountId.mockResolvedValue(null)
         hostProfileRepository.save.mockImplementation(async (profile) => profile)

         const useCase = new BecomeHostUseCase(hostProfileRepository)
         const command = new BecomeHostCommand('acc-123')
         const result = await useCase.execute(command)

         expect(result.accountId).toBe('acc-123')
         expect(result.kycStatus).toBe('unverified')
         expect(hostProfileRepository.save).toHaveBeenCalled()
         expect(hostProfileRepository.updateAccountRoleToHost).toHaveBeenCalledWith('acc-123')
      })

      it('should throw HostProfileAlreadyExistsException if profile exists', async () => {
         const existing = HostProfile.create('acc-123')
         hostProfileRepository.findByAccountId.mockResolvedValue(existing)

         const useCase = new BecomeHostUseCase(hostProfileRepository)
         const command = new BecomeHostCommand('acc-123')

         await expect(useCase.execute(command)).rejects.toThrow(HostProfileAlreadyExistsException)
      })
   })

   describe('SubmitHostTaxInfoUseCase', () => {
      it('should successfully submit, encrypt, and verify tax info', async () => {
         const profile = HostProfile.create('acc-123')
         hostProfileRepository.findByAccountId.mockResolvedValue(profile)
         hostProfileRepository.getGuestKycStatus.mockResolvedValue('verified')
         encryptionPort.encrypt.mockResolvedValue(Buffer.from('encrypted-tax-id'))
         hostProfileRepository.save.mockImplementation(async (p) => p)

         const useCase = new SubmitHostTaxInfoUseCase(hostProfileRepository, encryptionPort)
         const command = new SubmitTaxInfoCommand('acc-123', 'US', '12-3456789', 'W-9')
         const result = await useCase.execute(command)

         expect(result.accountId).toBe('acc-123')
         expect(result.taxCountry).toBe('US')
         expect(result.taxVerified).toBe(true)
         expect(encryptionPort.encrypt).toHaveBeenCalledWith('12-3456789')
         expect(hostProfileRepository.save).toHaveBeenCalled()
      })

      it('should throw error for invalid country code', async () => {
         const profile = HostProfile.create('acc-123')
         hostProfileRepository.findByAccountId.mockResolvedValue(profile)

         const useCase = new SubmitHostTaxInfoUseCase(hostProfileRepository, encryptionPort)
         const command = new SubmitTaxInfoCommand('acc-123', 'USA', '12-3456789', 'W-9')

         await expect(useCase.execute(command)).rejects.toThrow(TaxInfoValidationFailedException)
      })
   })

   describe('SetupHostPayoutUseCase', () => {
      it('should successfully link payout details and verify account', async () => {
         // Create profile where tax is already verified
         const profile = new HostProfile(
            'acc-123',
            null,
            false,
            null,
            null,
            'pending',
            'US',
            Buffer.from('encrypted-tax'),
            'W-9',
            true, // tax verified
            null,
            null,
            false,
            new Date(),
            new Date(),
            new Date()
         )

         hostProfileRepository.findByAccountId.mockResolvedValue(profile)
         hostProfileRepository.getGuestKycStatus.mockResolvedValue('verified')
         hostProfileRepository.save.mockImplementation(async (p) => p)

         const useCase = new SetupHostPayoutUseCase(hostProfileRepository)
         const command = new SetupPayoutCommand('acc-123', 'stripe', 'acct_123456')
         const result = await useCase.execute(command)

         expect(result.accountId).toBe('acc-123')
         expect(result.payoutProvider).toBe('stripe')
         expect(result.payoutAccountVerified).toBe(true)
         expect(result.kycStatus).toBe('verified') // all conditions met!
         expect(hostProfileRepository.save).toHaveBeenCalled()
      })
   })

   describe('GetHostProfileUseCase', () => {
      it('should return host profile if it exists', async () => {
         const profile = HostProfile.create('acc-123')
         hostProfileRepository.findByAccountId.mockResolvedValue(profile)

         const useCase = new GetHostProfileUseCase(hostProfileRepository)
         const result = await useCase.execute(new GetHostProfileCommand('acc-123'))

         expect(result.accountId).toBe('acc-123')
      })

      it('should throw HostProfileNotFoundException if it does not exist', async () => {
         hostProfileRepository.findByAccountId.mockResolvedValue(null)

         const useCase = new GetHostProfileUseCase(hostProfileRepository)

         await expect(useCase.execute(new GetHostProfileCommand('acc-123'))).rejects.toThrow(
            HostProfileNotFoundException
         )
      })
   })

   describe('UpdateAboutUseCase', () => {
      it('should update about field successfully', async () => {
         const profile = HostProfile.create('acc-123')
         hostProfileRepository.findByAccountId.mockResolvedValue(profile)
         hostProfileRepository.save.mockImplementation(async (p) => p)

         const useCase = new UpdateAboutUseCase(hostProfileRepository)
         const result = await useCase.execute(
            new UpdateAboutCommand('acc-123', 'Hello, I am a host')
         )

         expect(result.about).toBe('Hello, I am a host')
         expect(hostProfileRepository.save).toHaveBeenCalled()
      })
   })
})
