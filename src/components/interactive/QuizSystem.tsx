import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  code?: string;
}

interface Props {
  questions: Question[];
  title?: string;
  shuffleQuestions?: boolean;
}

export default function QuizSystem({ questions, title = 'Knowledge Check', shuffleQuestions = false }: Props) {
  const orderedQuestions = useMemo(() => {
    if (!shuffleQuestions) return questions;
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [questions, shuffleQuestions]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Record<number, { selected: number; correct: boolean }>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const q = orderedQuestions[current];
  const isAnswered = current in answered;
  const score = Object.values(answered).filter((a) => a.correct).length;
  const total = orderedQuestions.length;

  const handleAnswer = useCallback(() => {
    if (selected === null) return;
    const correct = selected === q.correct;
    setAnswered((prev) => ({ ...prev, [current]: { selected, correct } }));
    setShowExplanation(true);
  }, [selected, q, current]);

  const handleNext = useCallback(() => {
    if (current < total - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  }, [current, total]);

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered({});
    setShowExplanation(false);
    setQuizComplete(false);
  };

  const difficultyColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

  if (quizComplete) {
    const percentage = Math.round((score / total) * 100);
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
    const gradeColor = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';

    return (
      <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: gradeColor, lineHeight: 1 }}>{grade}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>{score}/{total} Correct</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--sl-color-gray-3)' }}>{percentage}%</div>
          </motion.div>
          <div style={{ margin: '1.5rem 0' }}>
            <div style={{ height: 8, background: 'var(--sl-color-gray-5)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: gradeColor, borderRadius: 4 }} />
            </div>
          </div>
          <p style={{ color: 'var(--sl-color-gray-3)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {percentage >= 90 ? 'Excellent! You have a strong understanding of this topic.' :
             percentage >= 70 ? 'Good job! Review the explanations for questions you missed.' :
             'Keep studying! Review the material and try again.'}
          </p>

          {/* Review answers */}
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            {orderedQuestions.map((question, i) => {
              const ans = answered[i];
              return (
                <div key={i} style={{ padding: '0.6rem 0.8rem', borderRadius: '0.375rem', marginBottom: '0.4rem', background: ans?.correct ? '#10b98115' : '#ef444415', border: `1px solid ${ans?.correct ? '#10b981' : '#ef4444'}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span>{i + 1}. {question.question.slice(0, 60)}...</span>
                  <span style={{ color: ans?.correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>{ans?.correct ? '✓' : '✗'}</span>
                </div>
              );
            })}
          </div>

          <button onClick={handleRestart} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.375rem', border: 'none', background: '#0066cc', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
            ↺ Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Question {current + 1} of {total}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: `${difficultyColor[q.difficulty]}20`, color: difficultyColor[q.difficulty] }}>
            {q.difficulty.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>{score}/{total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--sl-color-gray-5)' }}>
        <div style={{ height: '100%', background: '#0066cc', width: `${((current + 1) / total) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Question */}
      <div style={{ padding: '1.25rem' }}>
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', lineHeight: 1.5 }}>{q.question}</p>

            {q.code && (
              <pre style={{ background: '#1e1e1e', color: '#e0e0e0', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem', overflow: 'auto', marginBottom: '1rem', fontFamily: '"Fira Code", monospace' }}>{q.code}</pre>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {q.options.map((opt, i) => {
                let bg = 'transparent';
                let border = '1px solid var(--sl-color-gray-4)';
                let color = 'var(--sl-color-text)';

                if (isAnswered) {
                  if (i === q.correct) { bg = '#10b98120'; border = '2px solid #10b981'; color = '#10b981'; }
                  else if (i === answered[current].selected && !answered[current].correct) { bg = '#ef444420'; border = '2px solid #ef4444'; color = '#ef4444'; }
                } else if (selected === i) { bg = '#0066cc20'; border = '2px solid #0066cc'; color = '#0066cc'; }

                return (
                  <button key={i} onClick={() => !isAnswered && setSelected(i)} disabled={isAnswered}
                    style={{ padding: '0.7rem 1rem', borderRadius: '0.5rem', border, background: bg, color, cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem', borderRadius: '0.5rem', background: answered[current]?.correct ? '#10b98110' : '#ef444410', border: `1px solid ${answered[current]?.correct ? '#10b981' : '#ef4444'}30`, marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem', color: answered[current]?.correct ? '#10b981' : '#ef4444' }}>
                  {answered[current]?.correct ? '✓ Correct!' : '✗ Incorrect'}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--sl-color-gray-2)', margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {!isAnswered ? (
                <button onClick={handleAnswer} disabled={selected === null} style={{ padding: '0.5rem 1.2rem', borderRadius: '0.375rem', border: 'none', background: selected !== null ? '#0066cc' : '#6b7280', color: '#fff', cursor: selected !== null ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.85rem' }}>
                  Check Answer
                </button>
              ) : (
                <button onClick={handleNext} style={{ padding: '0.5rem 1.2rem', borderRadius: '0.375rem', border: 'none', background: '#0066cc', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  {current < total - 1 ? 'Next Question →' : 'View Results'}
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {orderedQuestions.map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i in answered ? (answered[i].correct ? '#10b981' : '#ef4444') : i === current ? '#0066cc' : 'var(--sl-color-gray-4)' }} />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
