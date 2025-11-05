export class FetchError extends Error {
  status: number;
  info: any;

  constructor(message: string, status: number, info?: any) {
    super(message);
    this.status = status;
    this.info = info;
    this.name = 'FetchError';
  }
}

export default async function fetcher<JSON = any>(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<JSON> {
    const res = await fetch(input, init)
    if (!res.ok) {
      const info = await res.json().catch(() => ({}));
      const error = new FetchError(
        info.message || 'An error occurred while fetching the data.',
        res.status,
        info
      );
      throw error;
    }
    return await res.json()
  }