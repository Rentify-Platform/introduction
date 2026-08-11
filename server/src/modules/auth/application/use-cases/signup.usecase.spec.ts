import { SignupUseCase, SignupCommand } from './signup.usecase'
import { AccountRepository } from '../../domain/repositories/auth.repository'
import { PasswordHasherPort } from '../ports/password-hasher.port'
import { EmailAlreadyRegisteredException } from '../../domain/errors/auth.errors'

describe('SignupUseCase', () => {
   let useCase: SignupUseCase
   let accountRepository: jest.Mocked<AccountRepository>
   let passwordHasher: jest.Mocked<PasswordHasherPort>

   beforeEach(() => {
      accountRepository = {
         existsByEmail: jest.fn(),
         findByEmail: jest.fn(),
         findById: jest.fn(),
         findAll: jest.fn(),
         updateStatus: jest.fn(),
         save: jest.fn()
      }

      passwordHasher = {
         hash: jest.fn(),
         compare: jest.fn()
      }

      useCase = new SignupUseCase(accountRepository, passwordHasher)
   })

   it('should successfully register a new user', async () => {
      accountRepository.existsByEmail.mockResolvedValue(false)
      passwordHasher.hash.mockResolvedValue('hashed_password')
      accountRepository.save.mockImplementation(async (account) => account)

      const command = new SignupCommand('test@example.com', null, 'password123', 'John', 'Doe')

      const result = await useCase.execute(command)

      expect(result.email).toBe('test@example.com')
      expect(result.role).toBe('guest')
      expect(accountRepository.save).toHaveBeenCalled()
   })

   it('should throw EmailAlreadyRegisteredException if email is already taken', async () => {
      accountRepository.existsByEmail.mockResolvedValue(true)

      const command = new SignupCommand('test@example.com', null, 'password123', 'John', 'Doe')

      await expect(useCase.execute(command)).rejects.toThrow(EmailAlreadyRegisteredException)
   })
})
