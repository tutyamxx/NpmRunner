import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Runner from './Runner';
import { useFetchReadme, defaultPkg } from '../hooks/useRunnerEffects';
import { useRef, useState, useEffect } from 'react';

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
                const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`);
                const data = await response?.json();

                if (isCurrentQuery) {
                    setResults(data?.objects ?? []);
                }
            } catch (error) {
            // eslint-disable-next-line no-console
                if (isCurrentQuery) console.error(error);
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
                        type="text"
                        placeholder="Search npm packages..."
                        value={query ?? ''}
                        onChange={(e) => setQuery(e?.target?.value ?? '')}
                        onFocus={() => setIsFocused(true)}
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
                                    📦 {r?.package?.name ?? 'Unknown'}{r?.package?.name ?? 'Unknown'}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
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
