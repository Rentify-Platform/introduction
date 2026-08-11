'use client'

export function GroundRulesSection() {
   return (
      <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
         <h2 className="text-xl font-bold">Ground rules</h2>
         <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            We ask every guest to remember a few simple things about what makes a great guest:
         </p>
         <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-500 dark:text-zinc-400">
            <li>Follow the house rules</li>
            <li>Treat the Host’s home like your own</li>
         </ul>
      </section>
   )
}
