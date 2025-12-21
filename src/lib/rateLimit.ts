type Record = {
  count: number
  date: string
}

const requests = new Map<string, Record>()

const MAX_REQUESTS = 3

export function rateLimit(ip: string) {
  const today = new Date().toISOString().split('T')[0]
  const key = `${ip}:${today}`

  const record = requests.get(key)

  if (!record) {
    requests.set(key, { count: 1, date: today })
    return { allowed: true }
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false }
  }

  record.count += 1
  return { allowed: true }
}
