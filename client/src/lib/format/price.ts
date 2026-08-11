export function formatPrice(amount: number, currency: string = 'VND') {
   const cleanCurrency = currency.toUpperCase()
   if (cleanCurrency === 'VND') {
      return `${amount.toLocaleString('vi-VN')} đ`
   }
   if (cleanCurrency === 'USD') {
      return `$${amount.toLocaleString('en-US')}`
   }
   return `${amount.toLocaleString()} ${currency}`
}
