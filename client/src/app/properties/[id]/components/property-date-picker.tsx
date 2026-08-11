'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Keyboard } from 'lucide-react'
import { formatDate, formatDateStr } from '@/lib/format/date'

interface PropertyDatePickerProps {
   checkIn: string | null
   checkOut: string | null
   onDatesChange: (checkIn: string | null, checkOut: string | null) => void
   isOpen: boolean
   onClose: () => void
   selecting: 'checkIn' | 'checkOut'
   onSelectingChange: (selecting: 'checkIn' | 'checkOut') => void
   bookedDates?: string[]
}

const MONTH_NAMES_EN = [
   'January',
   'February',
   'March',
   'April',
   'May',
   'June',
   'July',
   'August',
   'September',
   'October',
   'November',
   'December'
]

const MONTH_ABBR_EN = [
   'Jan',
   'Feb',
   'Mar',
   'Apr',
   'May',
   'Jun',
   'Jul',
   'Aug',
   'Sep',
   'Oct',
   'Nov',
   'Dec'
]

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function PropertyDatePicker({
   checkIn,
   checkOut,
   onDatesChange,
   isOpen,
   onClose,
   selecting,
   onSelectingChange,
   bookedDates = []
}: PropertyDatePickerProps) {
   // State for the calendar view (Left month start year/month)
   const [currentYear, setCurrentYear] = React.useState(2026)
   const [currentMonth, setCurrentMonth] = React.useState(6) // July (0-indexed is 6)

   if (!isOpen) return null

   const nextMonth = (currentMonth + 1) % 12
   const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

   const handlePrevMonth = () => {
      if (currentMonth === 0) {
         setCurrentMonth(11)
         setCurrentYear(currentYear - 1)
      } else {
         setCurrentMonth(currentMonth - 1)
      }
   }

   const handleNextMonth = () => {
      if (currentMonth === 11) {
         setCurrentMonth(0)
         setCurrentYear(currentYear + 1)
      } else {
         setCurrentMonth(currentMonth + 1)
      }
   }

   // Helpers
   const parseDateStr = (dateStr: string | null) => {
      if (!dateStr) return null
      return new Date(dateStr)
   }

   const dateIn = parseDateStr(checkIn)
   const dateOut = parseDateStr(checkOut)

   // Find the first booked date after the selected check-in date
   const firstBookedAfterCheckIn = React.useMemo(() => {
      if (!dateIn || bookedDates.length === 0) return null
      const bookedTimes = bookedDates
         .map((d) => new Date(d).getTime())
         .filter((t) => t > dateIn.getTime())
         .sort((a, b) => a - b)
      return bookedTimes.length > 0 ? bookedTimes[0] : null
   }, [dateIn, bookedDates])

   const nights =
      dateIn && dateOut
         ? Math.max(1, Math.ceil((dateOut.getTime() - dateIn.getTime()) / (1000 * 60 * 60 * 24)))
         : 0

   const formatHeaderText = () => {
      if (!checkIn) return 'Select dates'
      if (!checkOut) return 'Select checkout date'
      return `${nights} night${nights > 1 ? 's' : ''}`
   }

   const formatRangeSubText = () => {
      if (!checkIn) return 'Add dates for minimum stay or price'
      if (!checkOut) return 'Select checkout date'
      const [yIn, mIn, dIn] = checkIn.split('-').map(Number)
      const [yOut, mOut, dOut] = checkOut.split('-').map(Number)
      return `${MONTH_ABBR_EN[mIn - 1]} ${dIn}, ${yIn} - ${MONTH_ABBR_EN[mOut - 1]} ${dOut}, ${yOut}`
   }

   const generateMonthDays = (year: number, month: number) => {
      const numDays = new Date(year, month + 1, 0).getDate()
      const startDayOfWeek = new Date(year, month, 1).getDay()
      // Sunday is 0, Monday is 1... which matches startOffset directly
      const startOffset = startDayOfWeek

      const days = []
      for (let i = 0; i < startOffset; i++) {
         days.push(null)
      }
      for (let i = 1; i <= numDays; i++) {
         days.push(i)
      }
      return days
   }

   const handleDayClick = (year: number, month: number, day: number) => {
      const clickedStr = formatDateStr(year, month, day)
      const clickedTime = new Date(clickedStr).getTime()

      // If clicked check-in date again, clear it completely
      if (checkIn === clickedStr) {
         onDatesChange(null, null)
         onSelectingChange('checkIn')
         return
      }

      // If clicked checkout date again, clear checkout only
      if (checkOut === clickedStr) {
         onDatesChange(checkIn, null)
         onSelectingChange('checkOut')
         return
      }

      if (selecting === 'checkIn') {
         onDatesChange(clickedStr, null)
         onSelectingChange('checkOut')
      } else {
         if (dateIn && clickedTime <= dateIn.getTime()) {
            // If clicked date is before checkIn, reset checkIn to this date
            onDatesChange(clickedStr, null)
            onSelectingChange('checkOut')
         } else {
            onDatesChange(checkIn, clickedStr)
         }
      }
   }

   const getDayClass = (year: number, month: number, day: number) => {
      const dateStr = formatDateStr(year, month, day)
      const time = new Date(dateStr).getTime()
      const inTime = dateIn?.getTime()
      const outTime = dateOut?.getTime()

      const isStart = checkIn === dateStr
      const isEnd = checkOut === dateStr

      // Enable dates only from today onwards
      const isPast = time < new Date().setHours(0, 0, 0, 0)
      const isBooked = bookedDates.includes(dateStr)
      const isAfterFirstBooked = firstBookedAfterCheckIn !== null && time > firstBookedAfterCheckIn

      if (isPast || isBooked || (selecting === 'checkOut' && isAfterFirstBooked)) {
         return 'text-zinc-300 dark:text-zinc-700 line-through cursor-not-allowed w-full h-full flex items-center justify-center'
      }

      let classes =
         'relative flex items-center justify-center aspect-square text-sm font-semibold rounded-full cursor-pointer hover:border hover:border-zinc-900 dark:hover:border-white transition-all w-full h-full '

      if (isStart) {
         classes +=
            ' bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 ring-2 ring-offset-2 ring-zinc-950 dark:ring-white '
      } else if (isEnd) {
         classes += ' bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 '
      } else if (inTime && outTime && time > inTime && time < outTime) {
         classes += ' bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-none '
         const nextDayTime = time + 86400000
         const prevDayTime = time - 86400000
         if (prevDayTime === inTime) {
            classes += ' rounded-l-full '
         }
         if (nextDayTime === outTime) {
            classes += ' rounded-r-full '
         }
      } else {
         classes += ' text-zinc-800 dark:text-zinc-200 '
      }

      return classes
   }

   const renderCalendarMonth = (year: number, month: number) => {
      const days = generateMonthDays(year, month)
      return (
         <div className="space-y-4">
            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-400">
               {DAYS_OF_WEEK.map((d, i) => (
                  <div key={i}>{d}</div>
               ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
               {days.map((day, i) => {
                  if (day === null) {
                     return <div key={`empty-${i}`} />
                  }
                  return (
                     <div key={day} className="flex aspect-square items-center justify-center">
                        <button
                           type="button"
                           onClick={() => handleDayClick(year, month, day)}
                           disabled={
                              new Date(formatDateStr(year, month, day)).getTime() <
                                 new Date().setHours(0, 0, 0, 0) ||
                              bookedDates.includes(formatDateStr(year, month, day)) ||
                              (selecting === 'checkOut' &&
                                 firstBookedAfterCheckIn !== null &&
                                 new Date(formatDateStr(year, month, day)).getTime() >
                                    firstBookedAfterCheckIn)
                           }
                           className={getDayClass(year, month, day)}
                        >
                           {day}
                        </button>
                     </div>
                  )
               })}
            </div>
         </div>
      )
   }

   const handleClearDates = () => {
      onDatesChange(null, null)
      onSelectingChange('checkIn')
   }

   return (
      <div className="absolute top-[105%] right-0 z-50 w-full rounded-3xl border border-zinc-200 bg-white p-6 font-sans text-zinc-900 shadow-2xl sm:w-[660px] md:right-auto md:left-[-150px] lg:left-[-200px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
         {/* Header Row */}
         <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
               <h3 className="text-xl font-bold tracking-tight">{formatHeaderText()}</h3>
               <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatRangeSubText()}
               </p>
            </div>
            {/* Active check-in / checkout fields */}
            <div className="flex w-full overflow-hidden rounded-xl border border-zinc-200 text-xs sm:w-auto dark:border-zinc-800">
               <div
                  onClick={() => onSelectingChange('checkIn')}
                  className={`min-w-[110px] cursor-pointer p-2.5 px-4 ${
                     selecting === 'checkIn'
                        ? 'rounded-l-xl border-2 border-zinc-950 dark:border-white'
                        : 'border-r border-zinc-200 dark:border-zinc-800'
                  }`}
               >
                  <label className="block text-[8px] font-extrabold tracking-wider text-zinc-500 uppercase">
                     Check-in
                  </label>
                  <div className="mt-0.5 min-h-[16px] font-bold">
                     {checkIn ? formatDate(checkIn) : 'Add date'}
                  </div>
               </div>
               <div
                  onClick={() => onSelectingChange('checkOut')}
                  className={`min-w-[110px] cursor-pointer p-2.5 px-4 ${
                     selecting === 'checkOut'
                        ? 'rounded-r-xl border-2 border-zinc-950 dark:border-white'
                        : ''
                  }`}
               >
                  <label className="block text-[8px] font-extrabold tracking-wider text-zinc-500 uppercase">
                     Checkout
                  </label>
                  <div className="mt-0.5 min-h-[16px] font-bold">
                     {checkOut ? formatDate(checkOut) : 'Add date'}
                  </div>
               </div>
            </div>
         </div>

         {/* Calendars Section */}
         <div className="relative grid grid-cols-1 gap-8 border-t border-t-zinc-100 pt-6 sm:grid-cols-2 dark:border-t-zinc-800">
            {/* Navigation buttons */}
            <button
               type="button"
               onClick={handlePrevMonth}
               className="absolute top-6 left-0 rounded-full p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
               <ChevronLeft className="h-5 w-5" />
            </button>
            <button
               type="button"
               onClick={handleNextMonth}
               className="absolute top-6 right-0 rounded-full p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
               <ChevronRight className="h-5 w-5" />
            </button>

            {/* Left Month */}
            <div>
               <h4 className="mb-4 text-center text-sm font-bold">
                  {MONTH_NAMES_EN[currentMonth]} {currentYear}
               </h4>
               {renderCalendarMonth(currentYear, currentMonth)}
            </div>

            {/* Right Month */}
            <div>
               <h4 className="mb-4 text-center text-sm font-bold">
                  {MONTH_NAMES_EN[nextMonth]} {nextYear}
               </h4>
               {renderCalendarMonth(nextYear, nextMonth)}
            </div>
         </div>

         {/* Footer Row */}
         <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
               type="button"
               className="rounded-full p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
               <Keyboard className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
               <button
                  type="button"
                  onClick={handleClearDates}
                  className="hover:text-zinc-650 dark:hover:text-zinc-350 p-2 text-xs font-bold underline"
               >
                  Clear dates
               </button>
               <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-zinc-950 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
               >
                  Close
               </button>
            </div>
         </div>
      </div>
   )
}
