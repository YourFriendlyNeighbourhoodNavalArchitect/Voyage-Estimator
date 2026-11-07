import { fetchJson } from '#shared/http.ts';

type Answer = { data?: { prices?: { code: string; price: number }[] } } | null;

const answers = new Map<string, Promise<Answer>>();

export async function latestPrices(codes: readonly string[]): Promise<(code: string) => number | null> {
  const query = codes.join(',');
  let answer = answers.get(query);
  if (!answer) {
    answer = fetchJson<Answer>(`/api/bunker/prices/latest?${new URLSearchParams({ by_code: query })}`).catch(() => {
      answers.delete(query);
      return null;
    });
    answers.set(query, answer);
  }
  const prices = (await answer)?.data?.prices ?? [];
  return (code) => prices.find((quote) => quote.code === code)?.price ?? null;
}
