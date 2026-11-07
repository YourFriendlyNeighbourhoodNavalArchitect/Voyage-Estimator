import { errorMessage, excerpt } from './errors.ts';

export class HttpError extends Error {
  readonly status: number;
  readonly url: string;
  readonly retryAfter: number | null;

  constructor(status: number, message: string, url: string, retryAfter: number | null = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
    this.retryAfter = retryAfter;
  }
}

function explain(body: string): string {
  const text = body.trim();
  if (text === '') return 'The provider sent no explanation.';
  return messageIn(text) ?? excerpt(text);
}

function messageIn(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    const message = parsed?.error?.message ?? parsed?.message ?? parsed?.error;
    return typeof message === 'string' && message.trim() !== '' ? message.trim() : null;
  } catch {
    return null;
  }
}

export async function fetchJson<T>(url: string, retries = 0): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetchOnce<T>(url);
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      report(error);
      const wait = attempt < retries ? retryWait(error, attempt) : null;
      if (wait === null) throw error;
      console.warn(`The request to ${url} will be sent again in ${wait} seconds, because the server answered ${error.status}.`);
      await pause(wait * 1000);
    }
  }
}

function retryWait(failure: HttpError, attempt: number): number | null {
  const doubling = 2 ** attempt;
  if (failure.status === 429) return failure.retryAfter ?? doubling;
  if (failure.status === 500) return doubling;
  return null;
}

function retryAfter(headers: Headers): number | null {
  const header = headers.get('retry-after')?.trim() ?? '';
  const value = header === '' ? NaN : Number(header);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchOnce<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new HttpError(0, `The request did not complete. ${errorMessage(error)}`, url);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new HttpError(response.status, explain(body), url, retryAfter(response.headers));
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new HttpError(response.status, 'The answer was not readable as JSON.', url);
  }
}

function report({ url, status, message }: HttpError): void {
  console.warn(`The request to ${url} failed with ${status === 0 ? 'no answer' : status}.\nThe reason is: ${message}`);
}
