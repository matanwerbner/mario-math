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
        var op1 = ops[(Math.random() * 3) | 0];
        var op2 = ops[(Math.random() * 3) | 0];
        var a, b, c, answer, question;

        function randOperand() {
            var n = ((Math.random() * 10) | 0) + 1;
            return Math.random() < 0.5 ? n : -n;
        }

        a = randOperand();
        b = randOperand();
        c = randOperand();

        // Compute answer respecting operator precedence (× before +/−)
        if (op1 === '*' && op2 === '*') {
            answer = a * b * c;
        } else if (op1 === '*') {
            // (a * b) op2 c
            answer = (a * b) + (op2 === '+' ? c : -c);
        } else if (op2 === '*') {
            // a op1 (b * c)
            answer = a + (op1 === '+' ? 1 : -1) * (b * c);
        } else {
            // a op1 b op2 c  (all +/-)
            var ab = op1 === '+' ? a + b : a - b;
            answer = op2 === '+' ? ab + c : ab - c;
        }

        function displayOp(op) {
            return op === '*' ? '\u00d7' : op;
        }

        function fmt(n) {
            return n < 0 ? '(' + n + ')' : '' + n;
        }

        if (op1 === '*' && op2 !== '*') {
            // (a × b) OP2 c
            question = '(' + fmt(a) + ' \u00d7 ' + fmt(b) + ') ' + displayOp(op2) + ' ' + fmt(c) + ' = ?';
        } else if (op2 === '*' && op1 !== '*') {
            // a OP1 (b × c)
            question = fmt(a) + ' ' + displayOp(op1) + ' (' + fmt(b) + ' \u00d7 ' + fmt(c) + ') = ?';
        } else {
            // a OP1 b OP2 c  (all same precedence level, or both *)
            question = fmt(a) + ' ' + displayOp(op1) + ' ' + fmt(b) + ' ' + displayOp(op2) + ' ' + fmt(c) + ' = ?';
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
            if (overlay) {
                overlay.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                });
            }
        }

        if (!overlay) {
            if (callback) { callback(); }
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
