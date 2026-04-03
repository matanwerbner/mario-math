var Mario = Mario || {};

Mario.MathQuiz = (function() {
    var overlay = null;
    var questionEl = null;
    var inputEl = null;
    var errorEl = null;
    var correctAnswer = 0;
    var successCallback = null;

    function generate() {
        var ops = ['+', '-', '*'];
        var op = ops[(Math.random() * 3) | 0];
        var a, b, question, answer;

        if (op === '+') {
            a = ((Math.random() * 20) | 0) + 1;
            b = ((Math.random() * 20) | 0) + 1;
            answer = a + b;
            question = a + ' + ' + b + ' = ?';
        } else if (op === '-') {
            a = ((Math.random() * 19) | 0) + 2;
            b = ((Math.random() * (a - 1)) | 0) + 1;
            answer = a - b;
            question = a + ' - ' + b + ' = ?';
        } else {
            a = ((Math.random() * 9) | 0) + 2;
            b = ((Math.random() * 9) | 0) + 2;
            answer = a * b;
            question = a + ' \u00d7 ' + b + ' = ?';
        }

        return { question: question, answer: answer };
    }

    function onKeyDown(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    }

    function checkAnswer() {
        var val = parseInt(inputEl.value, 10);
        if (isNaN(val)) {
            errorEl.textContent = 'Enter a number.';
            return;
        }
        if (val === correctAnswer) {
            hide();
            if (successCallback) {
                successCallback();
            }
        } else {
            inputEl.value = '';
            errorEl.textContent = 'Wrong! Try again.';
            inputEl.classList.remove('shake');
            // Force reflow to restart animation
            void inputEl.offsetWidth;
            inputEl.classList.add('shake');
            inputEl.addEventListener('animationend', function onEnd() {
                inputEl.classList.remove('shake');
                inputEl.removeEventListener('animationend', onEnd);
            });
        }
    }

    function show(callback) {
        if (!overlay) {
            overlay = document.getElementById('math-quiz-overlay');
            questionEl = document.getElementById('math-quiz-question');
            inputEl = document.getElementById('math-quiz-input');
            errorEl = document.getElementById('math-quiz-error');
        }

        if (!overlay) {
            return;
        }

        var problem = generate();
        correctAnswer = problem.answer;
        successCallback = callback;

        questionEl.textContent = problem.question;
        inputEl.value = '';
        errorEl.textContent = '';

        overlay.classList.add('active');
        inputEl.focus();
        inputEl.removeEventListener('keydown', onKeyDown);
        inputEl.addEventListener('keydown', onKeyDown);
    }

    function hide() {
        overlay.classList.remove('active');
        inputEl.removeEventListener('keydown', onKeyDown);
    }

    return { show: show };
}());
