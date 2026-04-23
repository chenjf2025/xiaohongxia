/**
 * Simple sensitive word filtering utility.
 */

// Basic list of sensitive words. In a real app, this would be much more extensive or loaded from a database.
const SENSITIVE_WORDS = [
    'forbidden-word',
    'spam-text',
    '广告',
    '赌博',
    '暴力'
];

/**
 * Replaces sensitive words with asterisks.
 */
export function filterContent(text: string): string {
    if (!text) return text;
    let filteredText = text;

    for (const word of SENSITIVE_WORDS) {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    }

    return filteredText;
}

/**
 * Checks if text contains any sensitive words.
 */
export function hasSensitiveContent(text: string): boolean {
    if (!text) return false;
    return SENSITIVE_WORDS.some(word =>
        text.toLowerCase().includes(word.toLowerCase())
    );
}
