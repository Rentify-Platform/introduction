'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'
import { Review } from '@/features/listings/types'

interface PropertyReviewsProps {
   reviews: Review[]
   averageRating: number
   totalReviews: number
}

export function PropertyReviews({ reviews, averageRating, totalReviews }: PropertyReviewsProps) {
   return (
      <div className="space-y-6 font-sans text-zinc-900 dark:text-zinc-100">
         {reviews && reviews.length > 0 && (
            <>
               <h3 className="flex items-center gap-2 text-lg font-bold">
                  <Star className="h-5 w-5 fill-current text-zinc-900 dark:text-zinc-100" />
                  {averageRating ? averageRating.toFixed(2) : 'New'} · {totalReviews}{' '}
                  {totalReviews === 1 ? 'review' : 'reviews'}
               </h3>
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {reviews.slice(0, 6).map((review) => (
                     <div key={review.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                           <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-zinc-100">
                              <Image
                                 src={
                                    review.authorAvatarUrl ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                                 }
                                 alt={review.authorName}
                                 fill
                                 sizes="40px"
                                 className="object-cover"
                              />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                 {review.authorName}
                              </h4>
                              <p className="text-xs text-zinc-500">
                                 {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                           </div>
                        </div>
                        <p className="text-zinc-650 line-clamp-3 text-sm dark:text-zinc-400">
                           {review.comment}
                        </p>
                     </div>
                  ))}
               </div>
            </>
         )}
      </div>
   )
}
