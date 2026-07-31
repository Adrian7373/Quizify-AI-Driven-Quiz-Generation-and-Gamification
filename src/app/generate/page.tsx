"use client"

import { useState } from 'react';

export default function QuizGenerator() {
    const [sourceText, setSourceText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState("5");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Calling the API route we created earlier
            const response = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: sourceText,
                    // Using a hardcoded ID for testing purposes.
                    // In a real app, this would come from your authentication context.
                    authorId: "cms7df07c00002khlm0y4ni46",
                    questionCount: questionCount
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate quiz');
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1>AI Quiz Generator Test</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste your source text here..."
                    rows={6}
                    required
                    style={{ width: '100%', padding: '0.5rem' }}
                />

                <label className=''>Number of Questions:
                    <input onChange={(e) => setQuestionCount(e.target.value)} type="number" max="20" min="5" className='py-4' />
                </label>


                <button
                    type="submit"
                    disabled={isLoading || !sourceText.trim()}
                    style={{ padding: '0.5rem 1rem', cursor: isLoading ? 'wait' : 'pointer' }}
                >
                    {isLoading ? 'Generating (This takes a few seconds)...' : 'Generate Quiz'}
                </button>
            </form>

            {error && (
                <div style={{ color: 'red', marginTop: '1rem' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
                    <h2>Success!</h2>
                    <p><strong>Title:</strong> {result.title}</p>
                    <p><strong>Description:</strong> {result.description}</p>
                    <h3>Generated Questions ({result.questions.length}):</h3>
                    <ul style={{ textAlign: 'left' }}>
                        {result.questions.map((q: any, index: number) => (
                            <li key={index} style={{ marginBottom: '1rem' }}>
                                <p><strong>Q: {q.questionText}</strong></p>
                                <ul>
                                    <li>A: {q.optionA}</li>
                                    <li>B: {q.optionB}</li>
                                    <li>C: {q.optionC}</li>
                                    <li>D: {q.optionD}</li>
                                </ul>
                                <p><em>Correct Answer: {q.correctAnswer}</em></p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </main>
    );
}