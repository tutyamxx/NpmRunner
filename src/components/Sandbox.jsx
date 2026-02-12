import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import Runner from './Runner';
import { useFetchReadme, defaultPkg } from '../hooks/useRunnerEffects';
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
    const { pkg } = useParams();
    const navigate = useNavigate();
    const { readme, initialCode } = useFetchReadme(pkg);
    const inputRef = useRef(null);

    // --| Use defaultPkg if pkg is undefined
    const currentPkg = pkg ?? defaultPkg;

    // --| Search state
    const searchRef = useRef(null);
    const [query, setQuery] = useState(currentPkg);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // --| Prefill search box when pkg changes
    useEffect(() => setQuery(currentPkg ?? ''), [currentPkg]);

    // --| Hide suggestions on click outside
    useEffect(() => {
        const handleOutside = (e) => !searchRef.current?.contains(e.target) && setIsFocused(false);
        document.addEventListener('mousedown', handleOutside);

        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // --| Search npm registry
    useEffect(() => {
        if (!query || query?.length < 2) {
            setResults([]);

            return;
        }

        let isCurrentQuery = true;
        setLoading(true);

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=50`);
                const data = await response?.json();

                if (isCurrentQuery) {
                    setResults(data?.objects ?? []);
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    if (isCurrentQuery) console.error(error);
                }
            } finally {
                if (isCurrentQuery) setLoading(false);
            }
        }, 300);

        return () => {
            isCurrentQuery = false;
            clearTimeout(timer);
        };
    }, [query]);

    // --| Handle selecting a package from search results
    const handleSelect = (pkgName) => {
        setQuery(pkgName ?? '');
        setResults([]);
        navigate(`/sandbox/${pkgName ?? ''}`);
    };

    return (
        <div className="sandbox-grid">
            <div className="sandbox-readme">
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
                            {results?.map((r) => (
                                <li
                                    key={r?.package?.name ?? Math.random()}
                                    onMouseDown={() => handleSelect(r?.package?.name ?? '')}
                                    className="search-result-item"
                                >
                                    <span className="result-row">
                                        <NpmLogo size={10} /> {r?.package?.name ?? 'Unknown'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm, remarkEmoji]}>
                    {readme ?? 'No README available'}
                </ReactMarkdown>
            </div>

            {initialCode ? (
                <Runner
                    key={`${currentPkg ?? ''}-${initialCode ?? ''}`}
                    pkg={currentPkg ?? ''}
                    initialCode={initialCode ?? ''}
                />
            ) : (
                <div className="runner-loading">📦 Loading package...</div>
            )}
        </div>
    );
};

export default Sandbox;
