import dayjs from "dayjs";

export function addMonthToDate(date: dayjs.Dayjs | Date, numMonths = 1): dayjs.Dayjs {
  if (date instanceof Date) {
    date = dayjs(date);
  }

  const originalDay = date.date();
  const daysInOriginalMonth = date.daysInMonth();

  const nextMonth = date.add(numMonths, "month");

  const lastDayOfNextMonth = nextMonth.daysInMonth();

  if (originalDay >= daysInOriginalMonth) {
    return nextMonth.date(lastDayOfNextMonth);
  }

  return nextMonth;
}
