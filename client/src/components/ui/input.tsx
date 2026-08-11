import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export interface InputProps extends React.ComponentProps<'input'> {
   label?: string
   error?: string
   icon?: React.ReactNode
   containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
   ({ className, type, label, error, icon, containerClassName = '', ...props }, ref) => {
      const hasWrapper = !!label || !!icon || !!error

      const inputElement = (
         <input
            type={type}
            ref={ref}
            data-slot="input"
            className={cn(
               hasWrapper
                  ? 'w-full bg-transparent text-sm font-normal text-[#222222] placeholder:text-[#b0b0b0] focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600'
                  : [
                       'h-11 w-full min-w-0 rounded-xl border border-[#dddddd] bg-white px-3.5 py-2.5',
                       'text-sm text-[#222222] placeholder:text-[#b0b0b0]',
                       'transition-all outline-none',
                       'hover:border-[#b0b0b0]',
                       'focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/10',
                       'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
                       'aria-invalid:border-red-500 aria-invalid:ring-red-500/10',
                       'dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-600',
                       'dark:hover:border-zinc-500 dark:focus:border-zinc-300 dark:focus:ring-zinc-300/10'
                    ].join(' '),
               className
            )}
            {...props}
         />
      )

      if (!hasWrapper) {
         return inputElement
      }

      return (
         <div className={cn('w-full', containerClassName)}>
            <div
               className={cn(
                  // Base: clean Airbnb-style floating-label box
                  'group relative rounded-xl border bg-white px-3.5 pt-2.5 pb-2',
                  'transition-all duration-150',
                  // Hover
                  'hover:border-[#b0b0b0]',
                  // Focus-within ring
                  'focus-within:border-[#222222] focus-within:ring-2 focus-within:ring-[#222222]/10',
                  // Error state
                  error
                     ? 'border-red-500 ring-2 ring-red-500/10 hover:border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
                     : 'border-[#dddddd]',
                  // Dark mode
                  'dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-500',
                  'dark:focus-within:border-zinc-300 dark:focus-within:ring-zinc-300/10'
               )}
            >
               {label && (
                  <label
                     className={cn(
                        'mb-0.5 block text-[10px] font-bold tracking-widest uppercase',
                        error
                           ? 'text-red-500'
                           : 'text-[#6a6a6a] group-focus-within:text-[#222222] dark:text-zinc-500 dark:group-focus-within:text-zinc-200'
                     )}
                  >
                     {label}
                  </label>
               )}
               <div className="flex items-center gap-2">
                  {icon && (
                     <span className="shrink-0 text-[#b0b0b0] group-focus-within:text-[#6a6a6a] dark:text-zinc-600">
                        {icon}
                     </span>
                  )}
                  {inputElement}
               </div>
            </div>

            {error && (
               <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
               </p>
            )}
         </div>
      )
   }
)
Input.displayName = 'Input'

export { Input }
