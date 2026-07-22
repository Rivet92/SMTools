import { parseHubError } from '../hubs/createFeatureHub';

export function getErrorMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof Error && err.message) {
    const parsed = parseHubError(err);
    if (parsed) return parsed.message;
    return err.message;
  }
  return t('common.unknownError');
}
