/**
 * 국립박물관문화재단 클래식체(수정할 수 없어 원본 파일을 통째로 씀)를 다 받은 뒤 화면을 보여 줍니다.
 * - 받는 동안 빈 액자에 조명이 지나가는 로딩 화면을 덮습니다(html[data-fonts="loading"]).
 * - 8초가 지나거나 글꼴을 받지 못하면 운영체제 글꼴로 그대로 보여 줍니다.
 * - 자바스크립트가 없으면 data-fonts가 붙지 않아 로딩 화면이 나오지 않습니다.
 */
export const FONT_LOADER_TIMEOUT_MS = 8000;

/** 글꼴 정의는 외부 CSS 대신 페이지에 바로 넣어, CSS를 기다리느라 제한 시간 타이머가 늦게 시작하지 않게 합니다. */
export const FONT_FACE_CSS =
  "@font-face {font-family: 'Museum Classic';font-style: normal;font-weight: 500;font-display: swap;src: url(\"/fonts/museum-classic/MuseumClassic-M.woff\") format('woff');unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7A3, U+D7B0-D7FF;}@font-face {font-family: 'Museum Classic';font-style: normal;font-weight: 700;font-display: swap;src: url(\"/fonts/museum-classic/MuseumClassic-B.woff\") format('woff');unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7A3, U+D7B0-D7FF;}";

export const FONT_LOADER_SCRIPT = `(function(){var d=document.documentElement,f=document.fonts;function done(){d.dataset.fonts='ready'}if(!f||!f.load){done();return}d.dataset.fonts='loading';var t=setTimeout(done,${FONT_LOADER_TIMEOUT_MS});Promise.all(['500 1em "Museum Classic"','700 1em "Museum Classic"'].map(function(w){return f.load(w,'가')})).then(function(){clearTimeout(t);done()},function(){clearTimeout(t);done()})})()`;

export function FontLoader() {
  return (
    <>
      <div className="font-loader" role="status">
        <div className="font-loader__frame" aria-hidden="true">
          <span className="font-loader__light" />
        </div>
        <p className="font-loader__label">
          <span className="font-loader__eyebrow" aria-hidden="true">
            Now Opening
          </span>
          전시실 조명을 켜는 중입니다
        </p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: FONT_LOADER_SCRIPT }} />
    </>
  );
}
