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

    // Adaptive difficulty: tier 1 (one/two-step) -> 2 (distribute, both sides)
    // -> 3 (multi-step with distribution). 3 first-try solves in a row moves
    // up, 2 non-first-try quizzes in a row moves down.
    var tier = 1;
    var winStreak = 0;
    var failStreak = 0;

    var wrongCount = 0;
    var revealMode = false;   // after 3 wrong answers: show worked solution
    var steps = [];           // worked-solution lines

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

    // Format a constant term joined with a sign: fj(3) -> "+ 3", fj(-3) -> "- 3"
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

    // Format linear expression px + q (p may be 0 -> just the constant)
    function fLin(p, q) {
        if (p === 0) { return '' + q; }
        var s = fc(p);
        if (q !== 0) { s += ' ' + fj(q); }
        return s;
    }

    // Generic worked solution for an equation that expands to px + q = rx + s
    function linSteps(p, q, r, s, x) {
        var out = [];
        out.push(fLin(p, q) + ' = ' + fLin(r, s));
        if (r !== 0 || q !== 0) {
            out.push(fLin(p - r, 0) + ' = ' + (s - q));
        }
        out.push('x = ' + x);
        return out;
    }

    function generateOnce() {
        // Answer is always an integer in [-9,9] \ {0}
        var x;
        do { x = ((Math.random() * 19) | 0) - 9; } while (x === 0);

        var q, st;
        var type;

        if (tier === 1) {
            // One- and two-step equations
            type = ri(0, 3);
            if (type === 0) {
                // x + b = c
                var b = rnz(-10, 10);
                q = 'x ' + fj(b) + ' = ' + (x + b);
                st = linSteps(1, b, 0, x + b, x);
            } else if (type === 1) {
                // x - b = c  (b positive so a real subtraction is shown)
                var b1 = ri(1, 10);
                q = 'x - ' + b1 + ' = ' + (x - b1);
                st = linSteps(1, -b1, 0, x - b1, x);
            } else if (type === 2) {
                // ax = c
                var a1 = ri(2, 9);
                q = fc(a1) + ' = ' + (a1 * x);
                st = linSteps(a1, 0, 0, a1 * x, x);
            } else {
                // ax + b = c
                var a2 = ri(2, 6), b2 = rnz(-10, 10);
                q = fc(a2) + ' ' + fj(b2) + ' = ' + (a2 * x + b2);
                st = linSteps(a2, b2, 0, a2 * x + b2, x);
            }

        } else if (tier === 2) {
            // Single distribution, variables on both sides, or division
            type = ri(0, 2);
            if (type === 0) {
                // a(x + b) = k
                var a3 = ri(2, 6), b3 = rnz(-9, 9);
                var k3 = a3 * (x + b3);
                q = fOuter(a3) + 'x ' + fj(b3) + ') = ' + k3;
                st = linSteps(a3, a3 * b3, 0, k3, x);
            } else if (type === 1) {
                // ax + b = cx + d
                var a4 = rnz(1, 6), c4;
                do { c4 = rnz(1, 6); } while (c4 === a4);
                var b4 = rnz(-9, 9);
                var d4 = (a4 - c4) * x + b4;
                q = fc(a4) + ' ' + fj(b4) + ' = ' + fLin(c4, d4);
                st = linSteps(a4, b4, c4, d4, x);
            } else {
                // (x + a)/b = c
                var b5 = ri(2, 6), c5 = rnz(-6, 6);
                var a5 = c5 * b5 - x;
                var inner = a5 === 0 ? 'x' : 'x ' + fj(a5);
                q = '(' + inner + ')/' + b5 + ' = ' + c5;
                st = ['x ' + fj(a5) + ' = ' + (c5 * b5), 'x = ' + x];
            }

        } else {
            // Tier 3: multi-step with distribution (plus a division form)
            type = ri(0, 5);
            if (type === 0) {
                // a - (b + cx) = d(e - x) + fx
                var ef = rnz(2, 6), d2 = rnz(2, 5);
                var f = ri(-4, 4);
                var cv = rnz(1, 4);
                while (f - d2 + cv === 0) { f = ri(-4, 4); }
                var denom = f - d2 + cv;
                var ab = x * denom + d2 * ef;
                var bb = ri(-5, 5);
                var aa = ab + bb;
                var innerB = bb === 0 ? fc(cv) : (bb + ' + ' + fc(cv));
                var rhsTail = f === 0 ? '' : (f === 1 ? ' + x' : f === -1 ? ' - x' : ' ' + fj(f) + 'x');
                q = aa + ' - (' + innerB + ') = ' + fOuter(d2) + ef + ' - x)' + rhsTail;
                st = linSteps(-cv, aa - bb, f - d2, d2 * ef, x);
            } else if (type === 1) {
                // -ax + b(cx + d) = k
                var a6 = rnz(1, 5), b6 = rnz(2, 5), c6 = rnz(1, 4);
                var lxCoef = b6 * c6 - a6;
                while (lxCoef === 0) { a6 = rnz(1, 5); lxCoef = b6 * c6 - a6; }
                var d6 = ri(-9, 9);
                var k6 = lxCoef * x + b6 * d6;
                var d6tail = fj(d6) ? ' ' + fj(d6) : '';
                q = '-' + fc(a6) + ' + ' + fOuter(b6) + fc(c6) + d6tail + ') = ' + k6;
                st = linSteps(lxCoef, b6 * d6, 0, k6, x);
            } else if (type === 2) {
                // a(x + b) + c(x + b) = k
                var a7 = rnz(1, 6), c7 = rnz(1, 6), b7 = ri(-9, 9);
                var k7 = (a7 + c7) * (x + b7);
                var b7str = fj(b7) ? 'x ' + fj(b7) : 'x';
                q = fOuter(a7) + b7str + ') + ' + fOuter(c7) + b7str + ') = ' + k7;
                st = linSteps(a7 + c7, (a7 + c7) * b7, 0, k7, x);
            } else if (type === 3) {
                // a(bx + c) - d(ex + f) = g
                var a8 = rnz(1, 4), b8 = rnz(1, 4), c8 = ri(-8, 8);
                var d8 = rnz(1, 4), e8 = rnz(1, 4), f8 = ri(-8, 8);
                while (a8 * b8 === d8 * e8) { e8 = rnz(1, 4); }
                var g8 = (a8 * b8 - d8 * e8) * x + (a8 * c8 - d8 * f8);
                var c8tail = fj(c8) ? ' ' + fj(c8) : '';
                var f8tail = fj(f8) ? ' ' + fj(f8) : '';
                q = fOuter(a8) + fc(b8) + c8tail + ') - ' + fOuter(d8) + fc(e8) + f8tail + ') = ' + g8;
                st = linSteps(a8 * b8 - d8 * e8, a8 * c8 - d8 * f8, 0, g8, x);
            } else if (type === 4) {
                // a(x + b) = c(x + d) + e
                var a9 = rnz(1, 6), b9 = ri(-9, 9);
                var c9; do { c9 = rnz(1, 6); } while (c9 === a9);
                var e9 = ri(-9, 9);
                var needed = (a9 - c9) * x + a9 * b9 - e9;
                while (needed % c9 !== 0) { e9 = ri(-9, 9); needed = (a9 - c9) * x + a9 * b9 - e9; }
                var d9 = needed / c9;
                var b9str = fj(b9) ? 'x ' + fj(b9) : 'x';
                var d9str = fj(d9) ? 'x ' + fj(d9) : 'x';
                var e9str = fj(e9) ? ' ' + fj(e9) : '';
                q = fOuter(a9) + b9str + ') = ' + fOuter(c9) + d9str + ')' + e9str;
                st = linSteps(a9, a9 * b9, c9, c9 * d9 + e9, x);
            } else {
                // (ax + b)/c = d
                var aA = ri(2, 5), cA = ri(2, 6);
                var bA = ri(-9, 9);
                var dA_num = aA * x + bA;
                while (dA_num % cA !== 0) { bA = ri(-9, 9); dA_num = aA * x + bA; }
                var dA = dA_num / cA;
                var innerA = bA === 0 ? fc(aA) : fc(aA) + ' ' + fj(bA);
                q = '(' + innerA + ')/' + cA + ' = ' + dA;
                st = [innerA + ' = ' + (dA * cA), 'x = ' + x];
            }
        }

        return { question: q, answer: x, steps: st };
    }

    function generate() {
        // Reject questions with any constant over 60 — the skill practiced is
        // equation solving, not 3-digit mental arithmetic.
        var p, tries = 0;
        do {
            p = generateOnce();
            tries++;
            var nums = p.question.match(/\d+/g) || [];
            var ok = true;
            for (var i = 0; i < nums.length; i++) {
                if (parseInt(nums[i], 10) > 60) { ok = false; break; }
            }
        } while (!ok && tries < 50);
        return p;
    }

    function onKeyDown(e) {
        var key = e.key;
        // digits 0-9 (answers are always 1-2 digits, cap input there)
        if (key.length === 1 && key >= '0' && key <= '9') {
            if (inputStr.replace('-', '').length < 2) {
                inputStr += key;
            }
        // minus (layout-independent, allow negative input)
        } else if (key === '-' && inputStr === '') {
            inputStr = '-';
        } else if (key === 'Backspace') {
            inputStr = inputStr.slice(0, -1);
        } else if (key === 'Enter') {
            checkAnswer();
        } else if (key === 'Escape') {
            // quiz is mandatory — make that visible
            shakeTimer = 0.4;
        }
        e.preventDefault();
    }

    function finish(gaveUp) {
        var result = { firstTry: firstTry && !gaveUp, tier: tier, gaveUp: gaveUp };
        // adapt difficulty
        if (result.firstTry) {
            winStreak++;
            failStreak = 0;
            if (winStreak >= 3 && tier < 3) { tier++; winStreak = 0; }
        } else {
            winStreak = 0;
            failStreak++;
            if (failStreak >= 2 && tier > 1) { tier--; failStreak = 0; }
        }
        hide();
        if (successCallback) { successCallback(result); }
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
            finish(revealMode);
        } else {
            firstTry = false;
            wrongCount++;
            inputStr = '';
            if (wrongCount >= 3 && !revealMode) {
                revealMode = true;
                errorMsg = 'TYPE THE ANSWER TO GO ON';
                errorTimer = 3;
            } else {
                errorMsg = revealMode ? 'TYPE THE ANSWER TO GO ON' : 'WRONG! TRY AGAIN';
                errorTimer = 2;
            }
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
        steps = problem.steps;
        successCallback = callback;
        firstTry = true;
        wrongCount = 0;
        revealMode = false;
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

        // box grows when the worked solution is shown
        var extra = revealMode ? steps.length * 12 + 6 : 0;
        var bw = 300, bh = 90 + extra;
        var bx = 10, by = 75 - (extra / 2) | 0;

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

        // title with difficulty stars
        var stars = tier === 1 ? '*' : tier === 2 ? '**' : '***';
        drawText(context, 'SOLVE FOR X  ' + stars, 160 + shakeX, by + 10, '#f5c518', true);

        // question line
        drawText(context, question, 160 + shakeX, by + 28, '#ffffff', true);

        var lineY = by + 28;

        // worked solution (after 3 wrong answers)
        if (revealMode) {
            for (var i = 0; i < steps.length; i++) {
                lineY += 12;
                drawText(context, steps[i], 160 + shakeX, lineY, '#ffffff', true);
            }
            lineY += 6;
        }

        // input box area: "x = _"
        var inputDisplay = inputStr.length > 0 ? inputStr : '';
        var showCursor = Math.floor(cursorTimer) % 2 === 0;
        var inputText = 'x = ' + inputDisplay + (showCursor ? '_' : ' ');
        drawText(context, inputText, 160 + shakeX, lineY + 20, '#f5c518', true);

        // error message
        if (errorTimer > 0 && errorMsg) {
            drawText(context, errorMsg, 160 + shakeX, lineY + 38, '#ff4444', true);
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

    return {
        show: show,
        draw: draw,
        isActive: function() { return active; },
        // exposed for testing
        _generate: generate,
        _setTier: function(t) { tier = t; }
    };
}());
