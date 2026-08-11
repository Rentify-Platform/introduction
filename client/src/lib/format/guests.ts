export function formatGuests(
   adults: number,
   children: number,
   infants: number = 0,
   pets: number = 0
): string {
   const total = adults + children
   const guestsStr = `${total} guest${total > 1 ? 's' : ''}`
   const infantsStr = infants > 0 ? `, ${infants} infant${infants > 1 ? 's' : ''}` : ''
   const petsStr = pets > 0 ? `, ${pets} pet${pets > 1 ? 's' : ''}` : ''
   return `${guestsStr}${infantsStr}${petsStr}`
}
