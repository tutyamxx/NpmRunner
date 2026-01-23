import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Runner from './Runner';

/**
 * Extract only JS code blocks that contain at least one import statement
 * (ignores require() code blocks)
 *
 * @param {string} markdown - The README markdown
 * @returns {string[]} Array of JS code blocks containing imports
 */
const extractJsImportCode = (markdown) => {
    const regex = /```(?:js|javascript)\s*([\s\S]*?)```/gi;
    const matches = [];

    let match;

    while ((match = regex?.exec(markdown ?? ''))) {
        const codeBlock = match?.[1]?.trim() ?? '';

        if (/import\s+.*\s+from\s+['"].*['"]/.test(codeBlock)) {
            matches?.push(codeBlock);
        }
    }

    return matches;
};

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
    const [readme, setReadme] = useState('');
    const [initialCode, setInitialCode] = useState('');

    const defaultPkg = 'contains-emoji';

    useEffect(() => {
        const fetchReadme = async () => {
            // --| Redirect to default package if URL missing pkg
            if (!pkg) {
                navigate(`/sandbox/${defaultPkg}`, { replace: true });

                return;
            }

            try {
                const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
                const data = await res.json();

                const md = data?.readme ?? 'No README or Package not found.';
                setReadme(md);

                // --| Extract first ESM import code block
                const jsBlocks = extractJsImportCode(md);

                if (jsBlocks?.length > 0) {
                    setInitialCode(jsBlocks[0]);
                } else {
                    setInitialCode(`import mod from '${pkg}';\nconsole.log(mod);`);
                }
            // eslint-disable-next-line no-unused-vars
            } catch (_err) {
                setReadme('Package not found!');
                setInitialCode(`import mod from '${pkg}';\nconsole.log(mod);`);
            }
        };

        fetchReadme();
    }, [pkg, navigate]);

    return (
        <div className="sandbox-container">
            <div className="sandbox-grid" style={{ height: '100%' }}>
                {/* Readme panel */}
                <div className="sandbox-readme" style={{ height: '100%', overflowY: 'auto' }}>
                    <ReactMarkdown rehypePlugins={ [rehypeRaw] }>
                        {readme ?? 'No README available'}
                    </ReactMarkdown>
                </div>

                {/* Runner panel */}
                <Runner pkg={pkg ?? defaultPkg} initialCode={initialCode} />
            </div>
        </div>
    );
};

export default Sandbox;
