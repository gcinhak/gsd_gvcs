// 개인정보 보호용 이름 마스킹: 김지우 → 김*우, 이준 → 이*, 남궁두나 → 남**나
// 영문 이름은 단어별로 처리: Mason Snyder → M***n S****r
function maskWord(word) {
    const chars = Array.from(word);
    if (chars.length <= 1) return word;
    if (chars.length === 2) return `${chars[0]}*`;
    return chars[0] + '*'.repeat(chars.length - 2) + chars[chars.length - 1];
}

export function maskName(name) {
    if (!name) return name;
    return name.replace(/[^\s,]+/g, maskWord);
}
