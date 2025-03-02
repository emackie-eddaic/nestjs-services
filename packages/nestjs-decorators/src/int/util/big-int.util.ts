export function tryBigInt(value: string | number | bigint | boolean): boolean {
  try {
    BigInt(value);
    return true;
  } catch {
    return false;
  }
}
