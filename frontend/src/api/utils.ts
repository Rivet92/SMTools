export function buildPaginationParams(page?: number, pageSize?: number): URLSearchParams {
  const params = new URLSearchParams();
  if (page !== undefined) params.set('page', String(page));
  if (pageSize !== undefined) params.set('pageSize', String(pageSize));
  return params;
}
