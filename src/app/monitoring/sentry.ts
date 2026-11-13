// 쓰는 함수만 다시 내보냅니다. 패키지 전체를 import()하면 쓰지 않는 기능(리플레이·피드백 등)까지 나중에 받는 조각에 들어갑니다.
export { captureException, captureMessage, init, withScope } from '@sentry/react-router';
