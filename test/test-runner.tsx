import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { srsServiceTests } from './unit/srsService.test';
import { quizFlowTests } from './integration/quizFlow.test';

const allTestCases = [...quizFlowTests, ...srsServiceTests];

type TestResult = 'idle' | 'running' | 'passed' | 'failed';

interface TestState {
    name: string;
    status: TestResult;
    error: string | null;
}


// Test Runner Component
const TestRunner: React.FC = () => {
    const [results, setResults] = useState<TestState[]>(
        allTestCases.map(tc => ({ name: tc.name, status: 'idle', error: null }))
    );
    const [isTesting, setIsTesting] = useState(false);

    const runTests = async () => {
        setIsTesting(true);

        // Create a mutable copy of the initial state, with an explicit type to prevent inference errors.
        const currentResults: TestState[] = allTestCases.map(tc => ({ name: tc.name, status: 'idle', error: null }));
        setResults(currentResults);


        for (let i = 0; i < allTestCases.length; i++) {
            // Setup: clear localStorage before each test for isolation
            localStorage.clear();
            
            currentResults[i] = { ...currentResults[i], status: 'running' };
            setResults([...currentResults]);

            try {
                await allTestCases[i].testFn();
                currentResults[i] = { ...currentResults[i], status: 'passed', error: null };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                currentResults[i] = { ...currentResults[i], status: 'failed', error: errorMessage };
            } finally {
                setResults([...currentResults]);
                // Teardown: clear localStorage after each test
                localStorage.clear();
            }
        }
        setIsTesting(false);
    };

    return (
        <div className="bg-slate-900 text-white min-h-screen p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">LingoAnki Test Suite</h1>
                <button
                    onClick={runTests}
                    disabled={isTesting}
                    className="bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed mb-8"
                >
                    {isTesting ? 'Running...' : 'Run All Tests'}
                </button>
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <ul className="space-y-4">
                        {results.map((result, index) => (
                            <li key={index} className="p-4 rounded-lg border transition-colors" style={{
                                borderColor: result.status === 'passed' ? 'rgba(74, 222, 128, 0.4)' : result.status === 'failed' ? 'rgba(248, 113, 113, 0.4)' : 'rgb(51 65 85)',
                                backgroundColor: result.status === 'passed' ? 'rgba(74, 222, 128, 0.1)' : result.status === 'failed' ? 'rgba(248, 113, 113, 0.1)' : 'transparent',
                            }}>
                               <div className="flex items-center">
                                    {result.status === 'passed' && <span className="text-green-400 font-bold text-lg mr-3">✔</span>}
                                    {result.status === 'failed' && <span className="text-red-400 font-bold text-lg mr-3">✖</span>}
                                    {result.status === 'running' && <span className="text-yellow-400 animate-pulse font-bold text-lg mr-3">●</span>}
                                    {result.status === 'idle' && <span className="text-slate-500 font-bold text-lg mr-3">○</span>}
                                    <span className="font-semibold">{result.name}</span>
                                </div>
                                {result.status === 'failed' && (
                                    <pre className="mt-2 ml-7 text-red-300 bg-red-900/20 p-3 rounded-md text-sm whitespace-pre-wrap font-mono">
                                        <code>{result.error}</code>
                                    </pre>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TestRunner />
  </React.StrictMode>
);