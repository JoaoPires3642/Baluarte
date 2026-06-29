export const deliveryDayIndexes: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export const CUTOFF_HOUR = 18

export function createAddressId() {
  return crypto.randomUUID()
}

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatDateBr(dateIso: string) {
  const [year, month, day] = dateIso.split("-")
  return `${day}/${month}/${year}`
}

export function generateTimeSlots(ranges: string[]) {
  const slots: string[] = []
  for (const range of ranges) {
    const [start, end] = range.split("-")
    const [startH] = start.split(":").map(Number)
    const [endH] = end.split(":").map(Number)
    for (let h = startH; h < endH; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`)
      slots.push(`${String(h).padStart(2, "0")}:30`)
    }
  }
  return slots
}

export function nextAvailableDateForDay(dayKey: string, hasPersonalization = false) {
  const targetDay = deliveryDayIndexes[dayKey]
  if (targetDay === undefined) return ""

  const today = new Date()
  const targetDate = new Date(today)
  let daysToAdd = (targetDay - today.getDay() + 7) % 7
  if (daysToAdd === 0) daysToAdd = 7
  if (daysToAdd === 1 && today.getHours() >= CUTOFF_HOUR) daysToAdd += 7
  daysToAdd += hasPersonalization ? 7 : 0
  targetDate.setDate(today.getDate() + daysToAdd)

  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, "0")
  const day = String(targetDate.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function buildUberWhatsappHref(
  contactSettings: { whatsapp?: string | null; whatsappMessage?: string | null } | null,
  items: { name: string; size: string; quantity: number }[],
  orderReference: string,
): string | null {
  if (!contactSettings?.whatsapp) return null
  const productList = items.map(i => `${i.name} (${i.size}) x${i.quantity}`).join(", ")
  const message = `Olá! Fiz a compra do(s) produto(s): ${productList} pelo site (pedido #${orderReference}) e vou pedir um Uber para retirar. Pode me ajudar?`
  const digits = contactSettings.whatsapp.replace(/\D/g, "")
  if (!digits) return null
  const countryCode = digits.startsWith("55") ? digits : `55${digits}`
  const base = `https://wa.me/${countryCode}`
  return `${base}?text=${encodeURIComponent(message)}`
}
