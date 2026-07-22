export type PageParams = {
  page: number;
  pageSize: number;
  skip: number;
};

/**
 * Parse page/pageSize query values into safe integers for Prisma skip/take.
 * Invalid or non-finite input falls back to defaults.
 */
export function parsePageParams(
  searchParams: URLSearchParams,
  options?: { defaultPage?: number; defaultPageSize?: number; maxPageSize?: number }
): PageParams {
  const defaultPage = options?.defaultPage ?? 1;
  const defaultPageSize = options?.defaultPageSize ?? 5;
  const maxPageSize = options?.maxPageSize ?? 20;

  const pageRaw = Number(searchParams.get("page"));
  const sizeRaw = Number(searchParams.get("pageSize"));

  const page =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : defaultPage;
  const pageSize =
    Number.isFinite(sizeRaw) && sizeRaw >= 1
      ? Math.min(maxPageSize, Math.floor(sizeRaw))
      : defaultPageSize;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}
