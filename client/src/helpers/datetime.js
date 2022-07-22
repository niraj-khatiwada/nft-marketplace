import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export function getDateFromNow(date = new Date()) {
  return dayjs(date).isValid() ? dayjs(date).fromNow() : ''
}

export function formatDate(date = new Date(), format = 'MMM-DD-YYYY h:m A') {
  return dayjs(date).format(format)
}
