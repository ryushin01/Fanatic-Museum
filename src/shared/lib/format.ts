/** 전시 번호를 세 자리로 맞춥니다. 1 → "001" */
export function padNumber(value: number, length = 3): string {
  return String(value).padStart(length, '0');
}

/**
 * 원제처럼 한국어가 아닌 글의 언어를 짐작합니다. 화면 낭독기가 알맞은 음성으로 읽게 lang에 씁니다.
 * 가나·한자가 있으면 일본어, 한글 없이 라틴 문자만 있으면 영어, 그 밖에는 알 수 없음(undefined)입니다.
 */
export function textLang(text: string): 'ja' | 'en' | undefined {
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'ja';
  if (/[A-Za-z]/.test(text) && !/[\uac00-\ud7a3\u3130-\u318f]/.test(text)) return 'en';
  return undefined;
}
