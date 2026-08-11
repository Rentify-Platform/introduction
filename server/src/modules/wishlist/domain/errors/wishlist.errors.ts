import { BusinessException } from '../../../../shared/exceptions/business.exception'

export class WishlistNotFoundException extends BusinessException {
   constructor() {
      super('Wishlist not found', 'WISHLIST_NOT_FOUND', 404)
   }
}

export class UnauthorizedWishlistAccessException extends BusinessException {
   constructor() {
      super('You are not authorized to access this wishlist', 'UNAUTHORIZED_WISHLIST_ACCESS', 403)
   }
}

export class WishlistItemDuplicateException extends BusinessException {
   constructor() {
      super('Property is already in this wishlist', 'WISHLIST_ITEM_DUPLICATE', 400)
   }
}

export class WishlistItemNotFoundException extends BusinessException {
   constructor() {
      super('Property not found in this wishlist', 'WISHLIST_ITEM_NOT_FOUND', 404)
   }
}
