export function logError(context, error) {
  console.error(`[${context}]`, error?.response?.data || error?.message || error);
}
