const EXCERPT_LIMIT = 2000;

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function asSentence(text: string): string {
  return text.trimEnd().replace(/\.?$/, '.');
}

export function excerpt(body: string): string {
  const text = body.trim();
  if (text.length <= EXCERPT_LIMIT) return text;
  return `${text.slice(0, EXCERPT_LIMIT)} ... (${text.length - EXCERPT_LIMIT} more characters)`;
}
