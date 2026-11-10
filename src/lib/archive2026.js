/**
 * 2026 체육축제 기록 (정적 스냅샷).
 *
 * 2026 대회가 끝난 뒤 서버(D1)에 있던 경기 상태·문자중계 코멘트·현황판 결과를
 * 그대로 떠서 archive2026.json 에 보관했다. 2027 대회 때 서버 DB를 비워도
 * 2026 기록 화면(현황판·LIVE·경기 상세)은 이 파일로 계속 그려진다.
 */
import archive from '../data/archive2026.json';

export const ARCHIVE_2026 = archive;

/** 매치 ID → 최종 경기 상태 */
export const ARCHIVE_STATES_MAP = Object.fromEntries(archive.states.map((s) => [s.matchId, s]));

/** 2026 기록에 포함된 매치인지 */
export function isArchivedMatch(matchId) {
    return Boolean(matchId && archive.comments[matchId]);
}

export function getArchivedComments(matchId) {
    return archive.comments[matchId] || [];
}

export function getArchivedState(matchId) {
    return ARCHIVE_STATES_MAP[matchId] || null;
}
