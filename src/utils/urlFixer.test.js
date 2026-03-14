import { getGithubRepo, fixGithubUrl } from './urlFixer';

describe('🏖️ getGithubRepo', () => {
    it('Returns null for falsy input', () => {
        expect(getGithubRepo(null)).toBeNull();
        expect(getGithubRepo('')).toBeNull();
        // eslint-disable-next-line no-undefined
        expect(getGithubRepo(undefined)).toBeNull();
    });

    it('Removes git+ prefix and .git suffix', () => expect(getGithubRepo('git+https://github.com/user/repo.git')).toBe('user/repo'));
    it('Removes only https://github.com/ for plain URLs', () => expect(getGithubRepo('https://github.com/user/repo')).toBe('user/repo'));
    it('Handles URLs without git+ or .git', () => expect(getGithubRepo('https://github.com/user/repo-name')).toBe('user/repo-name'));
});

describe('🏖️ fixGithubUrl', () => {
    const repo = 'git+https://github.com/user/repo.git';

    it('Returns the same URL for absolute non-GitHub URLs', () => expect(fixGithubUrl('https://example.com/file.png', repo)).toBe('https://example.com/file.png'));

    it('Converts GitHub blob URLs to raw URLs', () => {
        const blob = 'https://github.com/user/repo/blob/main/file.js';
        const raw = 'https://raw.githubusercontent.com/user/repo/main/file.js';

        expect(fixGithubUrl(blob, repo)).toBe(raw);
    });

    it('Converts relative paths to raw URLs using main branch', () => {
        expect(fixGithubUrl('image.png', repo)).toBe('https://raw.githubusercontent.com/user/repo/main/image.png');
        expect(fixGithubUrl('./assets/test.png', repo)).toBe('https://raw.githubusercontent.com/user/repo/main/assets/test.png');
    });

    it('Returns the original URL if repo is missing for relative paths', () => expect(fixGithubUrl('image.png', null)).toBe('image.png'));

    it('Handles null/undefined URL gracefully', () => {
        expect(fixGithubUrl(null, repo)).toBeNull();
        // eslint-disable-next-line no-undefined
        expect(fixGithubUrl(undefined, repo)).toBeUndefined();
    });

    it('Handles complex repo formatting', () => {
        expect(fixGithubUrl('img/file.jpg', 'git+https://github.com/foo/bar.git')).toBe('https://raw.githubusercontent.com/foo/bar/main/img/file.jpg');
    });
});
