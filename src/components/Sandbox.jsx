import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { fixGithubUrl } from '../utils/urlFixer';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import Runner from './Runner';
import { useFetchReadme, defaultPkg } from '../hooks/useRunnerEffects';
import { useNpmSearch } from '../hooks/useNpmSearch';
import { usePackageRepository } from '../hooks/usePackageRepository';
import { useRef, useState, useEffect } from 'react';

/**
 * NpmLogo React component
 *
 * Renders a compact SVG badge for the official npm logo.
 * The badge is a red rectangle with the "npm" wordmark centered in white.
 * Height is adjustable via props while maintaining the aspect ratio.
 *
 * @param {Object} props - Component props
 * @param {number} [props.height=14] - Height of the SVG in pixels. Width scales automatically to maintain aspect ratio.
 * @returns {JSX.Element} The SVG element representing the npm logo
 */
const NpmLogo = ({ height = 14 }) => (
    <svg
        height={height}
        viewBox="0 0 72 20"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
    >
        <rect width="72" height="20" rx="2" fill="#CB3837" />
        <text
            x="36"
            y="15"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#ffffff"
            fontFamily="Arial, Helvetica, sans-serif"
        >
            npm
        </text>
    </svg>
);

/**
 * Sandbox component that fetches the README of an NPM package
 * and displays it alongside a Runner component.
 *
 * @component
 * @returns {JSX.Element} The Sandbox component layout
 */
const Sandbox = () => {
    const params = useParams();
    // --| Use params['*'] because we used the wildcard in the route
    const pkg = params['*'] || defaultPkg;

    const navigate = useNavigate();
    const { readme, initialCode } = useFetchReadme(pkg);
    const inputRef = useRef(null);

    // --| Use defaultPkg if pkg is undefined
    const currentPkg = pkg ?? defaultPkg;

    // --| Search state
    const searchRef = useRef(null);
    const [query, setQuery] = useState(currentPkg);
    const [isFocused, setIsFocused] = useState(false);

    // --| Repository URL used for fixing GitHub asset paths
    const repositoryUrl = usePackageRepository(currentPkg);

    // --| Search npm registry using external hook
    const { results, loading, clearResults } = useNpmSearch(query);

    // --| Need this import for rehypeKatex package
    // --| Load KaTeX CSS only in browser after mount
    useEffect(() => {
        if (typeof document !== 'undefined') {
            import('katex/dist/katex.min.css');
        }
    }, []);

    // --| Prefill search box when pkg changes
    useEffect(() => setQuery(currentPkg ?? ''), [currentPkg]);

    // --| Hide suggestions on click outside
    useEffect(() => {
        const handleOutside = (e) => !searchRef.current?.contains(e.target) && setIsFocused(false);
        document.addEventListener('mousedown', handleOutside);

        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // --| Handle selecting a package from search results
    const handleSelect = (pkgName) => {
        setQuery(pkgName);
        clearResults();

        // --| This turns @scope/pkg into @scope%2Fpkg, which is safer for browsers
        navigate(`/sandbox/${encodeURIComponent(pkgName)}`);
    };

    return (
        <div className="sandbox-grid">
            <div className="sandbox-readme">
                <div className="search-label">Search <span className="search-label-npm">npm</span> package</div>
                <div className="sandbox-search" ref={searchRef}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search npm packages..."
                        value={query ?? ''}
                        onChange={(e) => setQuery(e?.target?.value ?? '')}
                        onFocus={(e) => {
                            setIsFocused(true);
                            e.target.select();
                        }}
                        onClick={(e) => e.target.select()}
                        className="search-input"
                    />

                    {loading && <div className="search-loading">Searching...</div>}

                    {isFocused && results?.length > 0 && (
                        <ul className="search-results">
                            {results?.map((r, idx) => (
                                <li
                                    key={r?.package?.name ?? idx}
                                    onMouseDown={() => handleSelect(r?.package?.name ?? '')}
                                    className="search-result-item"
                                >
                                    <span className="result-row">
                                        <NpmLogo size={8} /> {r?.package?.name ?? 'Unknown'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <ReactMarkdown
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    remarkPlugins={[remarkGfm, remarkEmoji, remarkMath]}
                    components={{
                        img: (props) => (
                            <img
                                {...props}
                                src={fixGithubUrl(props.src, repositoryUrl)}
                                alt={props.alt ?? ''}
                            />
                        ),

                        a: (props) => (
                            <a
                                {...props}
                                href={fixGithubUrl(props.href, repositoryUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        )
                    }}
                >
                    {readme ?? 'No README available'}
                </ReactMarkdown>
            </div>

            {initialCode ? (
                <Runner key={`${currentPkg ?? ''}-${initialCode ?? ''}`} pkg={currentPkg ?? ''} initialCode={initialCode ?? ''} />
            ) : (
                <div className="runner-loading">📦 Loading package...</div>
            )}
        </div>
    );
};

export default Sandbox;
