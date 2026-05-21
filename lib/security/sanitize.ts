export function sanitizeText(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

export function sanitizeMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length > 1000) {
    throw new Error("Сообщение слишком длинное");
  }
  return sanitizeText(trimmed);
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\-() ]/g, "").trim();
}
