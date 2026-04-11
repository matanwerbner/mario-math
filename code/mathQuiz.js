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
        // Generate equation: a*x + b = c*x + d  where (a - c) != 0
        // x = (d - b) / (a - c), forced to be an integer
        var x, a, b, c, d, coefDiff;

        // Pick x in range [-9, 9] excluding 0
        do { x = ((Math.random() * 19) | 0) - 9; } while (x === 0);

        // Pick left coefficient a in range [1, 5] with random sign
        a = (((Math.random() * 5) | 0) + 1) * (Math.random() < 0.5 ? 1 : -1);

        // Pick right coefficient c != a, in [-4, 4] excluding 0
        do {
            c = (((Math.random() * 4) | 0) + 1) * (Math.random() < 0.5 ? 1 : -1);
        } while (c === a);

        // Pick b in range [-9, 9]
        b = ((Math.random() * 19) | 0) - 9;

        // d chosen so equation holds: a*x + b = c*x + d => d = (a-c)*x + b
        d = (a - c) * x + b;

        // Format a coefficient on x: e.g. 1x -> "x", -1x -> "-x", 2x -> "2x"
        function fmtCoef(n) {
            if (n === 1)  return 'x';
            if (n === -1) return '-x';
            return n + 'x';
        }

        // Format "+ b" or "- |b|" for the constant term (omit if 0)
        function fmtConst(n) {
            if (n === 0) return '';
            if (n > 0)   return ' + ' + n;
            return ' - ' + Math.abs(n);
        }

        var lhs = fmtCoef(a) + fmtConst(b);
        var rhs = fmtCoef(c) + fmtConst(d);
        var q = lhs + ' = ' + rhs;

        return { question: q, answer: x };
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

        // title: "SOLVE FOR X"
        drawText(context, 'SOLVE FOR X', 160 + shakeX, by + 10, '#f5c518', true);

        // question line
        drawText(context, question, 160 + shakeX, by + 28, '#ffffff', true);

        // input box area: "x = _"
        var inputDisplay = inputStr.length > 0 ? inputStr : '';
        var showCursor = Math.floor(cursorTimer) % 2 === 0;
        var inputText = 'x = ' + inputDisplay + (showCursor ? '_' : ' ');
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
