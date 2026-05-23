import { useState } from 'react';
import { pickRandomQuiz } from '../../data/quizzes';

export default function QuizGame({ onWin, onLose }) {
    const [quiz] = useState(() => pickRandomQuiz());
    const [picked, setPicked] = useState(null);
    const [done, setDone] = useState(false);

    const choose = (idx) => {
        if (done) return;
        setPicked(idx);
        setDone(true);
        const correct = idx === quiz.answer;
        setTimeout(() => (correct ? onWin?.() : onLose?.()), 700);
    };

    return (
        <div className="game-quiz">
            <div className="game-tag">📚 퀴즈</div>
            <div className="game-q">{quiz.question}</div>
            <div className="game-choices">
                {quiz.choices.map((c, i) => {
                    const isPicked = picked === i;
                    const isCorrect = done && i === quiz.answer;
                    const isWrong = done && isPicked && i !== quiz.answer;
                    const cls = ['gq-btn'];
                    if (isCorrect) cls.push('is-correct');
                    if (isWrong) cls.push('is-wrong');
                    return (
                        <button
                            key={i}
                            type="button"
                            className={cls.join(' ')}
                            onClick={() => choose(i)}
                            disabled={done}
                        >
                            <span className="gq-idx">{i + 1}</span>
                            <span className="gq-text">{c}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
