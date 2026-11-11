/** 전시 번호를 세 자리로 맞춥니다. 1 → "001" */
export function padNumber(value: number, length = 3): string {
  return String(value).padStart(length, '0');
}
