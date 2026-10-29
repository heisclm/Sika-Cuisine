export function formatGhanaPhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("233")) {
    const local = "0" + digits.slice(3);
    return formatLocalDigits(local);
  }

  return formatLocalDigits(digits);
}

function formatLocalDigits(digits: string): string {
  const clean = digits.slice(0, 10);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
}

export function isValidGhanaPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("233") && digits.length === 12) {
    local = "0" + digits.slice(3);
  }
  if (local.length !== 10) return false;

  const validPrefixes = [
    // MTN Ghana
    "024", "054", "055", "059", "053",
    // Telecel (formerly Vodafone)
    "020", "050",
    // AT (AirtelTigo)
    "027", "057", "026"
  ];

  return validPrefixes.some((prefix) => local.startsWith(prefix));
}
