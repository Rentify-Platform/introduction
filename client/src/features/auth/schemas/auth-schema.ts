import { z } from 'zod'

export const loginSchema = z.object({
   email: z.string().min(1, 'Email is required').email('Invalid email format'),
   password: z.string().min(1, 'Password is required')
})

export const signupSchema = z.object({
   email: z.string().min(1, 'Email is required').email('Invalid email format'),
   password: z.string().min(6, 'Password must be at least 6 characters long'),
   firstName: z.string().min(1, 'First name is required'),
   lastName: z.string().min(1, 'Last name is required'),
   phone: z.string().optional().or(z.literal(''))
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>

export const profileSchema = z.object({
   firstName: z.string().min(1, 'First name is required'),
   lastName: z.string().min(1, 'Last name is required'),
   phone: z.string().nullable().optional().or(z.literal('')),
   bio: z.string().nullable().optional().or(z.literal('')),
   dateOfBirth: z.string().nullable().optional().or(z.literal(''))
})

export type ProfileInput = z.infer<typeof profileSchema>
