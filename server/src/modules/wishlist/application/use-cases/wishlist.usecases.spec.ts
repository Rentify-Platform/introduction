import { PropertyNotFoundException } from '../../../listings/domain/errors/listings.errors'
import { WishlistItem } from '../../domain/entities/wishlist-item.entity'
import { Wishlist } from '../../domain/entities/wishlist.entity'
import {
   UnauthorizedWishlistAccessException,
   WishlistItemNotFoundException
} from '../../domain/errors/wishlist.errors'
import { WishlistRepository } from '../../domain/repositories/wishlist.repository'
import { AddWishlistItemCommand, AddWishlistItemUseCase } from './add-wishlist-item.usecase'
import { CreateWishlistCommand, CreateWishlistUseCase } from './create-wishlist.usecase'
import {
   RemoveWishlistItemCommand,
   RemoveWishlistItemUseCase
} from './remove-wishlist-item.usecase'

describe('Wishlist Use Cases', () => {
   let wishlistRepository: jest.Mocked<WishlistRepository>

   beforeEach(() => {
      wishlistRepository = {
         findById: jest.fn(),
         findByAccountId: jest.fn(),
         save: jest.fn(),
         delete: jest.fn(),
         addItem: jest.fn(),
         removeItem: jest.fn(),
         checkPropertyExists: jest.fn()
      }
   })

   describe('CreateWishlistUseCase', () => {
      it('should successfully create a new wishlist', async () => {
         wishlistRepository.save.mockImplementation(async (w) => w)

         const useCase = new CreateWishlistUseCase(wishlistRepository)
         const command = new CreateWishlistCommand('user-123', 'My Vacation Cabin')

         const result = await useCase.execute(command)

         expect(result.accountId).toBe('user-123')
         expect(result.name).toBe('My Vacation Cabin')
         expect(wishlistRepository.save).toHaveBeenCalled()
      })
   })

   describe('AddWishlistItemUseCase', () => {
      it('should successfully add a property to wishlist', async () => {
         const wishlist = Wishlist.create('user-123', 'Summer Trip')
         wishlistRepository.findById.mockResolvedValueOnce(wishlist)
         wishlistRepository.checkPropertyExists.mockResolvedValueOnce(true)

         // Reload resolves updated wishlist
         const updatedWishlist = new Wishlist(
            wishlist.id,
            wishlist.accountId,
            wishlist.name,
            wishlist.createdAt,
            [new WishlistItem(wishlist.id, 'prop-abc', 'Cabin', 10000n)]
         )
         wishlistRepository.findById.mockResolvedValueOnce(updatedWishlist)

         const useCase = new AddWishlistItemUseCase(wishlistRepository)
         const command = new AddWishlistItemCommand(wishlist.id, 'user-123', 'prop-abc')

         const result = await useCase.execute(command)

         expect(result.items.length).toBe(1)
         expect(result.items[0].propertyId).toBe('prop-abc')
         expect(wishlistRepository.addItem).toHaveBeenCalledWith(wishlist.id, 'prop-abc')
      })

      it('should throw PropertyNotFoundException if property does not exist', async () => {
         const wishlist = Wishlist.create('user-123', 'Summer Trip')
         wishlistRepository.findById.mockResolvedValue(wishlist)
         wishlistRepository.checkPropertyExists.mockResolvedValue(false)

         const useCase = new AddWishlistItemUseCase(wishlistRepository)
         const command = new AddWishlistItemCommand(wishlist.id, 'user-123', 'invalid-prop')

         await expect(useCase.execute(command)).rejects.toThrow(PropertyNotFoundException)
      })

      it('should throw UnauthorizedWishlistAccessException if user does not own wishlist', async () => {
         const wishlist = Wishlist.create('user-456', 'Summer Trip')
         wishlistRepository.findById.mockResolvedValue(wishlist)

         const useCase = new AddWishlistItemUseCase(wishlistRepository)
         const command = new AddWishlistItemCommand(wishlist.id, 'user-123', 'prop-abc')

         await expect(useCase.execute(command)).rejects.toThrow(UnauthorizedWishlistAccessException)
      })
   })

   describe('RemoveWishlistItemUseCase', () => {
      it('should successfully remove property from wishlist', async () => {
         const item = new WishlistItem('wish-123', 'prop-abc')
         const wishlist = new Wishlist('wish-123', 'user-123', 'Trip', new Date(), [item])

         wishlistRepository.findById.mockResolvedValueOnce(wishlist)

         const emptyWishlist = new Wishlist('wish-123', 'user-123', 'Trip', new Date(), [])
         wishlistRepository.findById.mockResolvedValueOnce(emptyWishlist)

         const useCase = new RemoveWishlistItemUseCase(wishlistRepository)
         const command = new RemoveWishlistItemCommand('wish-123', 'user-123', 'prop-abc')

         const result = await useCase.execute(command)

         expect(result.items.length).toBe(0)
         expect(wishlistRepository.removeItem).toHaveBeenCalledWith('wish-123', 'prop-abc')
      })

      it('should throw WishlistItemNotFoundException if item not in wishlist', async () => {
         const wishlist = new Wishlist('wish-123', 'user-123', 'Trip', new Date(), [])
         wishlistRepository.findById.mockResolvedValue(wishlist)

         const useCase = new RemoveWishlistItemUseCase(wishlistRepository)
         const command = new RemoveWishlistItemCommand('wish-123', 'user-123', 'prop-abc')

         await expect(useCase.execute(command)).rejects.toThrow(WishlistItemNotFoundException)
      })
   })
})
