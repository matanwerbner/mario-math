var Mario = Mario || {};

Mario.MathQuiz = (function() {
    var correctAnswer = 0;
    var successCallback = null;
    var firstTry = true;
    var active = false;
    var inputStr = '';
    var errorMsg = '';
    var errorTimer = 0;
    var shakeTimer = 0;
    var cursorTimer = 0;
    var question = '';
    var savedKeyDown = null;

    function generate() {
        var ops = ['+', '-', '*'];
        var op1 = ops[(Math.random() * 3) | 0];
        var op2 = ops[(Math.random() * 3) | 0];
        var a, b, c, answer, q;

        function randOperand() {
            var n = ((Math.random() * 10) | 0) + 1;
            return Math.random() < 0.5 ? n : -n;
        }

        a = randOperand();
        b = randOperand();
        c = randOperand();

        if (op1 === '*' && op2 === '*') {
            answer = a * b * c;
        } else if (op1 === '*') {
            answer = (a * b) + (op2 === '+' ? c : -c);
        } else if (op2 === '*') {
            answer = a + (op1 === '+' ? 1 : -1) * (b * c);
        } else {
            var ab = op1 === '+' ? a + b : a - b;
            answer = op2 === '+' ? ab + c : ab - c;
        }

        function displayOp(op) { return op === '*' ? 'x' : op; }
        function fmt(n) { return n < 0 ? '(' + n + ')' : '' + n; }

        if (op1 === '*' && op2 !== '*') {
            q = '(' + fmt(a) + ' x ' + fmt(b) + ') ' + displayOp(op2) + ' ' + fmt(c) + ' = ?';
        } else if (op2 === '*' && op1 !== '*') {
            q = fmt(a) + ' ' + displayOp(op1) + ' (' + fmt(b) + ' x ' + fmt(c) + ') = ?';
        } else {
            q = fmt(a) + ' ' + displayOp(op1) + ' ' + fmt(b) + ' ' + displayOp(op2) + ' ' + fmt(c) + ' = ?';
        }

        return { question: q, answer: answer };
    }

    function onKeyDown(e) {
        var code = e.keyCode;
        // digits 0-9
        if (code >= 48 && code <= 57) {
            inputStr += String.fromCharCode(code);
        // numpad 0-9
        } else if (code >= 96 && code <= 105) {
            inputStr += String.fromCharCode(code - 48);
        // minus / numpad minus (allow negative input)
        } else if ((code === 189 || code === 109) && inputStr === '') {
            inputStr = '-';
        // backspace
        } else if (code === 8) {
            inputStr = inputStr.slice(0, -1);
        // enter
        } else if (code === 13) {
            checkAnswer();
        }
        e.preventDefault();
    }

    function checkAnswer() {
        var val = parseInt(inputStr, 10);
        if (isNaN(val)) {
            errorMsg = 'ENTER A NUMBER';
            errorTimer = 2;
            shakeTimer = 0.4;
            return;
        }
        if (val === correctAnswer) {
            var wasFirstTry = firstTry;
            hide();
            if (successCallback) { successCallback(wasFirstTry); }
        } else {
            firstTry = false;
            inputStr = '';
            errorMsg = 'WRONG! TRY AGAIN';
            errorTimer = 2;
            shakeTimer = 0.4;
        }
    }

    function hide() {
        active = false;
        document.onkeydown = savedKeyDown;
        savedKeyDown = null;
    }

    function show(callback) {
        var problem = generate();
        correctAnswer = problem.answer;
        successCallback = callback;
        firstTry = true;
        inputStr = '';
        errorMsg = '';
        errorTimer = 0;
        shakeTimer = 0;
        cursorTimer = 0;
        question = problem.question;
        active = true;

        savedKeyDown = document.onkeydown;
        document.onkeydown = onKeyDown;
    }

    function draw(context) {
        if (!active) { return; }

        cursorTimer += 0.05;
        if (shakeTimer > 0) { shakeTimer -= 0.05; }
        if (errorTimer > 0) { errorTimer -= 0.05; }

        // dim overlay
        context.fillStyle = 'rgba(0,0,0,0.7)';
        context.fillRect(0, 0, 320, 240);

        // box: 220x110 centered at 160,120
        var bx = 50, by = 75, bw = 220, bh = 90;

        // shake offset
        var shakeX = 0;
        if (shakeTimer > 0) {
            shakeX = (Math.random() * 6 - 3) | 0;
        }

        // box background + border
        context.fillStyle = '#000033';
        context.fillRect(bx + shakeX, by, bw, bh);
        context.strokeStyle = '#f5c518';
        context.lineWidth = 2;
        context.strokeRect(bx + shakeX + 1, by + 1, bw - 2, bh - 2);

        // title: "MATH CHALLENGE"
        drawText(context, 'MATH CHALLENGE', 160 + shakeX, by + 10, '#f5c518', true);

        // question line
        drawText(context, question, 160 + shakeX, by + 28, '#ffffff', true);

        // input box area
        var inputDisplay = inputStr.length > 0 ? inputStr : '';
        var showCursor = Math.floor(cursorTimer) % 2 === 0;
        var inputText = inputDisplay + (showCursor ? '_' : ' ');
        drawText(context, inputText, 160 + shakeX, by + 48, '#f5c518', true);

        // error message
        if (errorTimer > 0 && errorMsg) {
            drawText(context, errorMsg, 160 + shakeX, by + 66, '#ff4444', true);
        }

        context.lineWidth = 1;
    }

    // Draw pixel-font text using the game's SpriteFont system
    // centered=true centers on cx, otherwise cx is left edge
    function drawText(context, str, cx, y, color, centered) {
        var font = getFont(color);
        // SpriteFont draws char i at X + 8*(i+1), so subtract 8 to left-align at X
        var x = centered ? cx - (str.length * 8) / 2 - 8 : cx - 8;
        font.Strings[0] = { String: str, X: x, Y: y };
        font.Draw(context, null);
    }

    var fonts = {};
    function getFont(color) {
        if (!fonts[color]) {
            // Pick closest available SpriteCuts color
            if (color === '#f5c518' || color === 'yellow') {
                fonts[color] = Mario.SpriteCuts.CreateYellowFont();
            } else if (color === '#ff4444' || color === 'red') {
                fonts[color] = Mario.SpriteCuts.CreateRedFont();
            } else {
                fonts[color] = Mario.SpriteCuts.CreateWhiteFont();
            }
        }
        return fonts[color];
    }

    return { show: show, draw: draw, isActive: function() { return active; } };
}());
