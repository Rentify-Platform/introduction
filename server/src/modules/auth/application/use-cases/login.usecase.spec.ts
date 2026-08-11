import { LoginUseCase, LoginCommand } from './login.usecase'
import { AccountRepository } from '../../domain/repositories/auth.repository'
import { PasswordHasherPort } from '../ports/password-hasher.port'
import { TokenServicePort } from '../ports/token-service.port'
import { Account } from '../../domain/entities/auth.entity'
import { InvalidCredentialsException } from '../../domain/errors/auth.errors'

describe('LoginUseCase', () => {
   let useCase: LoginUseCase
   let accountRepository: jest.Mocked<AccountRepository>
   let passwordHasher: jest.Mocked<PasswordHasherPort>
   let tokenService: jest.Mocked<TokenServicePort>

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

      tokenService = {
         generateToken: jest.fn(),
         verifyToken: jest.fn()
      }

      useCase = new LoginUseCase(accountRepository, passwordHasher, tokenService)
   })

   it('should successfully authenticate user and return token', async () => {
      const existingAccount = new Account(
         'uuid-123',
         'test@example.com',
         null,
         'hashed_password',
         'guest',
         'active',
         'John',
         'Doe',
         new Date(),
         new Date()
      )

      accountRepository.findByEmail.mockResolvedValue(existingAccount)
      passwordHasher.compare.mockResolvedValue(true)
      tokenService.generateToken.mockResolvedValue('jwt_token')

      const command = new LoginCommand('test@example.com', 'password123')
      const result = await useCase.execute(command)

      expect(result.accessToken).toBe('jwt_token')
      expect(result.account.email).toBe('test@example.com')
   })

   it('should throw InvalidCredentialsException if password is invalid', async () => {
      const existingAccount = new Account(
         'uuid-123',
         'test@example.com',
         null,
         'hashed_password',
         'guest',
         'active',
         'John',
         'Doe',
         new Date(),
         new Date()
      )

      accountRepository.findByEmail.mockResolvedValue(existingAccount)
      passwordHasher.compare.mockResolvedValue(false)

      const command = new LoginCommand('test@example.com', 'wrong_password')

      await expect(useCase.execute(command)).rejects.toThrow(InvalidCredentialsException)
   })
})
