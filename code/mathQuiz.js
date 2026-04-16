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
        // Generate a harder multi-term equation with distribution and combining.
        // We pick x in [-9,9] \ {0}, then randomly choose one of several templates,
        // filling in coefficients so the equation is always valid.

        var x;
        do { x = ((Math.random() * 19) | 0) - 9; } while (x === 0);

        // Helper: random int in [lo, hi] (inclusive)
        function ri(lo, hi) { return ((Math.random() * (hi - lo + 1)) | 0) + lo; }

        // Helper: nonzero random int in [lo, hi]
        function rnz(lo, hi) {
            var v; do { v = ri(lo, hi); } while (v === 0); return v;
        }

        // Format coefficient before x: 1->"x", -1->"-x", n->"nx"
        function fc(n) {
            if (n === 1)  return 'x';
            if (n === -1) return '-x';
            return n + 'x';
        }

        // Format a constant term joined with a sign: fmtJoin(3) -> "+ 3", fmtJoin(-3) -> "- 3"
        // Never produces "- 0" or "+ 0"; returns '' when n === 0
        function fj(n) {
            if (n === 0) return '';
            if (n > 0) return '+ ' + n;
            return '- ' + Math.abs(n);
        }

        // Format outer term for parenthesised expressions: n -> "n(" or "-(" or "("
        function fOuter(n) {
            if (n === 1)  return '(';
            if (n === -1) return '-(';
            return n + '(';
        }

        var type = ri(0, 4);
        var lhs, rhs, q;

        if (type === 0) {
            // Template: a - (b + cx) = d(e - x) + fx
            // LHS expands: a - b - cx
            // RHS expands: de - dx + fx = de + (f-d)x
            // Combined: (a-b) - cx = de + (f-d)x
            // Setting equal: a - b - de = (f - d + c)x
            // x = (a - b - de) / (f - d + c),  denominator must != 0
            var ef = rnz(2, 6), d2 = rnz(2, 5);
            var f = ri(-4, 4);
            var cv = rnz(1, 4);
            // denominator = f - d2 + cv
            while (f - d2 + cv === 0) { f = ri(-4, 4); }
            var denom = f - d2 + cv;
            // a - b = x * denom + d2 * ef
            var ab = x * denom + d2 * ef;
            var b2 = ri(-5, 5);
            var a2 = ab + b2;
            // LHS: a2 - (b2 + cv*x)  — cv is always positive so inner is "b2 + cvx"
            var innerB2 = b2 === 0 ? fc(cv) : (b2 + ' + ' + fc(cv));
            lhs = a2 + ' - (' + innerB2 + ')';
            // RHS: d2*(ef - x) + f*x
            var rhsParen = fOuter(d2) + ef + ' - x)';
            var rhsTail = f === 0 ? '' : (f === 1 ? ' + x' : f === -1 ? ' - x' : ' ' + fj(f) + 'x');
            rhs = rhsParen + rhsTail;
            q = lhs + ' = ' + rhs;

        } else if (type === 1) {
            // Template: -ax + b(cx + d) = k   where k = (bc-a)*x*val + bd
            // Expand LHS: (bc-a)x + bd
            // RHS is just a constant k, computed from x
            // This avoids the ambiguous "nx(..." notation entirely.
            var a3 = rnz(1, 5), b3 = rnz(2, 5), c3 = rnz(1, 4);
            var lxCoef = b3 * c3 - a3;
            // Ensure lxCoef != 0 so x is uniquely determined
            while (lxCoef === 0) { a3 = rnz(1, 5); lxCoef = b3 * c3 - a3; }
            // Pick d3 freely; k = lxCoef*x + b3*d3
            var d3 = ri(-9, 9);
            var k3 = lxCoef * x + b3 * d3;
            var d3tail = fj(d3) ? ' ' + fj(d3) : '';
            lhs = '-' + fc(a3) + ' + ' + fOuter(b3) + fc(c3) + d3tail + ')';
            rhs = '' + k3;
            q = lhs + ' = ' + rhs;

        } else if (type === 2) {
            // Template: a(x + b) + c(x + b) = k
            // = (a+c)(x+b) = k  => x = k/(a+c) - b
            var a4 = rnz(1, 6), c4 = rnz(1, 6), b4 = ri(-9, 9);
            var k = (a4 + c4) * (x + b4);
            var b4str = fj(b4) ? 'x ' + fj(b4) : 'x';
            lhs = fOuter(a4) + b4str + ') + ' + fOuter(c4) + b4str + ')';
            rhs = '' + k;
            q = lhs + ' = ' + rhs;

        } else if (type === 3) {
            // Template: a(bx + c) - d(ex + f) = g
            // LHS: (ab-de)x + (ac-df)
            // g = (ab-de)*x + (ac-df)
            var a5 = rnz(1, 4), b5 = rnz(1, 4), c5 = ri(-8, 8);
            var d5 = rnz(1, 4), e5 = rnz(1, 4), f5 = ri(-8, 8);
            while (a5 * b5 === d5 * e5) { e5 = rnz(1, 4); }
            var g5 = (a5 * b5 - d5 * e5) * x + (a5 * c5 - d5 * f5);
            var c5tail = fj(c5) ? ' ' + fj(c5) : '';
            var f5tail = fj(f5) ? ' ' + fj(f5) : '';
            var lp1 = fOuter(a5) + fc(b5) + c5tail + ')';
            var lp2 = fOuter(d5) + fc(e5) + f5tail + ')';
            q = lp1 + ' - ' + lp2 + ' = ' + g5;

        } else {
            // Template: a(x + b) = c(x + d) + e
            // LHS: ax + ab   RHS: cx + cd + e
            // (a-c)x = cd + e - ab => pick a != c, then solve for relationship
            var a6 = rnz(1, 6), b6 = ri(-9, 9);
            var c6; do { c6 = rnz(1, 6); } while (c6 === a6);
            // (a6-c6)*x = c6*d6 + e6 - a6*b6
            // Pick e6 freely, derive d6 so equation holds
            var e6 = ri(-9, 9);
            var needed = (a6 - c6) * x + a6 * b6 - e6; // = c6*d6
            // If not divisible by c6, adjust e6
            while (needed % c6 !== 0) { e6 = ri(-9, 9); needed = (a6 - c6) * x + a6 * b6 - e6; }
            var d6 = needed / c6;
            var b6str = fj(b6) ? 'x ' + fj(b6) : 'x';
            var d6str = fj(d6) ? 'x ' + fj(d6) : 'x';
            var e6str = fj(e6) ? ' ' + fj(e6) : '';
            lhs = fOuter(a6) + b6str + ')';
            rhs = fOuter(c6) + d6str + ')' + e6str;
            q = lhs + ' = ' + rhs;
        }

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
