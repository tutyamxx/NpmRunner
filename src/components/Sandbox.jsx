import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Runner from './Runner';
import { useFetchReadme, defaultPkg } from '../hooks/useRunnerEffects';

/**
 * Sandbox component that fetches the README of an NPM package
 * and displays it alongside a Runner component.
 *
 * @component
 * @returns {JSX.Element} The Sandbox component layout
 */
const Sandbox = () => {
    const { pkg } = useParams();
    const { readme, initialCode } = useFetchReadme(pkg);

    // --| Use defaultPkg if pkg is undefined
    const currentPkg = pkg ?? defaultPkg;

    return (
        <div className="sandbox-container">
            <div className="sandbox-grid" style={{ height: '100%' }}>
                {/* Readme panel */}
                <div className="sandbox-readme" style={{ height: '100%', overflowY: 'auto' }}>
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {readme ?? 'No README available'}
                    </ReactMarkdown>
                </div>

                {/* Runner panel */}
                <Runner pkg={currentPkg} initialCode={initialCode} />
            </div>
        </div>
    );
};

export default Sandbox;
