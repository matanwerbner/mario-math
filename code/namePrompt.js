var Mario = Mario || {};

Mario.CurrentPlayer = 'luigi';

Mario.NamePrompt = (function() {
    var active = false;
    var inputStr = '';
    var cursorTimer = 0;
    var successCallback = null;
    var savedKeyDown = null;

    function onKeyDown(e) {
        var code = e.keyCode;
        // printable ASCII: letters, digits, space, common punctuation (32-126)
        if (code === 13) {
            submit();
        } else if (code === 8) {
            inputStr = inputStr.slice(0, -1);
        } else if (inputStr.length < 12) {
            // letters A-Z (shift or caps: just use lowercase)
            if (code >= 65 && code <= 90) {
                inputStr += String.fromCharCode(code + 32);
            // digits 0-9
            } else if (code >= 48 && code <= 57) {
                inputStr += String.fromCharCode(code);
            // numpad 0-9
            } else if (code >= 96 && code <= 105) {
                inputStr += String.fromCharCode(code - 48);
            }
        }
        e.preventDefault();
    }

    function submit() {
        var name = inputStr.trim().toLowerCase();
        if (!name) { name = 'luigi'; }
        Mario.CurrentPlayer = name;
        localStorage.setItem('playerName', name);
        active = false;
        document.onkeydown = savedKeyDown;
        savedKeyDown = null;
        if (successCallback) { successCallback(); }
    }

    function show(callback) {
        successCallback = callback;
        inputStr = localStorage.getItem('playerName') || '';
        cursorTimer = 0;
        active = true;
        savedKeyDown = document.onkeydown;
        document.onkeydown = onKeyDown;
    }

    function draw(context) {
        if (!active) { return; }

        cursorTimer += 0.05;

        // dim overlay
        context.fillStyle = 'rgba(0,0,0,0.8)';
        context.fillRect(0, 0, 320, 240);

        // box: 240x80 centered
        var bx = 40, by = 80, bw = 240, bh = 80;
        context.fillStyle = '#000033';
        context.fillRect(bx, by, bw, bh);
        context.strokeStyle = '#f5c518';
        context.lineWidth = 2;
        context.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

        drawText(context, 'ENTER YOUR NAME', 160, by + 10, '#f5c518', true);
        drawText(context, 'PRESS ENTER TO START', 160, by + 58, '#aaaaaa', true);

        // input display with blinking cursor
        var display = inputStr.toUpperCase();
        var showCursor = Math.floor(cursorTimer) % 2 === 0;
        var inputText = display + (showCursor ? '_' : ' ');
        drawText(context, inputText, 160, by + 32, '#ffffff', true);

        context.lineWidth = 1;
    }

    var fonts = {};
    function getFont(color) {
        if (!fonts[color]) {
            if (color === '#f5c518') {
                fonts[color] = Mario.SpriteCuts.CreateYellowFont();
            } else if (color === '#aaaaaa') {
                fonts[color] = Mario.SpriteCuts.CreateBlackFont();
            } else {
                fonts[color] = Mario.SpriteCuts.CreateWhiteFont();
            }
        }
        return fonts[color];
    }

    function drawText(context, str, cx, y, color, centered) {
        var font = getFont(color);
        // SpriteFont draws char i at X + 8*(i+1), so subtract 8 to left-align at X
        var x = centered ? cx - (str.length * 8) / 2 - 8 : cx - 8;
        font.Strings[0] = { String: str, X: x, Y: y };
        font.Draw(context, null);
    }

    return { show: show, draw: draw, isActive: function() { return active; } };
}());

Mario.ShowCongrats = (function() {
    var timer = 0;
    var lines = [];

    function show(firstTry) {
        if (firstTry) {
            lines = ['CONGRATS! FIRST TRY!', '+2 POINTS!'];
        } else {
            lines = ['NICE JOB!', '+1 POINT'];
        }
        timer = 2.5;
    }

    function draw(context) {
        if (timer <= 0) { return; }
        timer -= 0.05;

        var lineH = 14;
        var padding = 8;
        var bh = lines.length * lineH + padding * 2 - (lineH - 8);
        var maxLen = 0;
        var i;
        for (i = 0; i < lines.length; i++) {
            if (lines[i].length > maxLen) { maxLen = lines[i].length; }
        }
        var bw = maxLen * 8 + padding * 2;
        var bx = (320 - bw) / 2;
        var by = 44;

        context.fillStyle = '#f5c518';
        context.fillRect(bx, by, bw, bh);
        context.strokeStyle = '#000';
        context.lineWidth = 1;
        context.strokeRect(bx, by, bw, bh);

        var font = Mario.SpriteCuts.CreateBlackFont();
        for (i = 0; i < lines.length; i++) {
            // center each line: SpriteFont offset -8 applied via (bx + padding - 8)
            var lineX = (320 - lines[i].length * 8) / 2 - 8;
            font.Strings[0] = { String: lines[i], X: lineX, Y: by + padding + i * lineH };
            font.Draw(context, null);
        }
        context.lineWidth = 1;
    }

    return { show: show, draw: draw };
}());
