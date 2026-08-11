export function formatDate(dateStr: string) {
   const d = new Date(dateStr)
   return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
   })
}

export function formatDateStr(year: number, month: number, day: number): string {
   const mm = String(month + 1).padStart(2, '0')
   const dd = String(day).padStart(2, '0')
   return `${year}-${mm}-${dd}`
}
