import { Navbar } from '@/components/shared/navbar'
import { HomeContent } from './components/home-content'

export default function Home() {
   return (
      <div className="flex min-h-screen flex-col bg-white font-sans antialiased dark:bg-zinc-950">
         {/* Top Navigation */}
         <Navbar />

         {/* Landing Page Content */}
         <HomeContent />

         {/* Footer */}
         <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-8 text-center text-xs text-zinc-500 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-400">
            <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 sm:flex-row">
               <div>
                  <span>Belong © 2024 Belong, Inc. - Privacy - Terms - Sitemap</span>
               </div>
               <div className="flex gap-4">
                  <span className="cursor-pointer hover:underline">Privacy</span>
                  <span className="cursor-pointer hover:underline">Terms</span>
                  <span className="cursor-pointer hover:underline">Sitemap</span>
                  <span className="cursor-pointer hover:underline">Company Details</span>
               </div>
            </div>
         </footer>
      </div>
   )
}
