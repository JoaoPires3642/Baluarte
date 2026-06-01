export function onlyCpfDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

export function isValidCpf(value: string) {
  const cpf = value.replace(/\D/g, "")
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const digits = cpf.split("").map(Number)
  const firstCheck = calculateDigit(digits.slice(0, 9), 10)
  const secondCheck = calculateDigit(digits.slice(0, 10), 11)

  return digits[9] === firstCheck && digits[10] === secondCheck
}

function calculateDigit(numbers: number[], startWeight: number) {
  const sum = numbers.reduce((total, number, index) => total + number * (startWeight - index), 0)
  const remainder = (sum * 10) % 11
  return remainder === 10 ? 0 : remainder
}
