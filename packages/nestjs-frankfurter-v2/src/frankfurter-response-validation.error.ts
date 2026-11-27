export type FrankfurterValidationIssue = { path: string; message: string };

/** A successful HTTP response whose JSON does not match its endpoint's schema. */
export class FrankfurterResponseValidationError extends Error {
  constructor(
    readonly body: unknown,
    readonly issues: readonly FrankfurterValidationIssue[],
    readonly status: number,
  ) {
    super(
      `Invalid Frankfurter response: ${issues[0]?.path ?? '$'} ${issues[0]?.message ?? 'schema mismatch'}`,
    );
    this.name = 'FrankfurterResponseValidationError';
  }
}
