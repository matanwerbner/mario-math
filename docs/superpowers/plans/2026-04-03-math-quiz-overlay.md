# Math Quiz Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every time Mario hits a question mark block, a math quiz overlay freezes the game until the player types the correct answer.

**Architecture:** A new `Mario.MathQuiz` singleton manages HTML overlay show/hide and answer validation. A `QuizActive` flag on `LevelState` short-circuits the entire `Update()` loop while the quiz is shown. The existing `Bump()` function is modified to call the quiz before executing block reward logic, passing the reward logic as a success callback.

**Tech Stack:** Vanilla JS, HTML/CSS overlay, existing Enjine state machine

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `main.html` | Modify | Add quiz overlay HTML + CSS; load mathQuiz.js |
| `code/mathQuiz.js` | Create | Generate problems, show/hide overlay, validate answer |
| `code/levelState.js` | Modify | Add `QuizActive` flag; freeze in `Update()`; hook `Bump()` |

---

### Task 1: Add quiz overlay HTML and CSS to main.html

**Files:**
- Modify: `main.html`

- [ ] **Step 1: Add the overlay div and CSS inside `<head>` and `<body>`**

Open `main.html`. After the existing `<style>` block (inside `<head>`), add:

```html
<style>
    #math-quiz-overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 10;
        justify-content: center;
        align-items: center;
    }
    #math-quiz-overlay.active {
        display: flex;
    }
    #math-quiz-box {
        background: #1a1a2e;
        border: 4px solid #f5c518;
        border-radius: 12px;
        padding: 40px 60px;
        text-align: center;
        font-family: monospace;
        color: #fff;
    }
    #math-quiz-box h2 {
        font-size: 2rem;
        margin-bottom: 20px;
        color: #f5c518;
    }
    #math-quiz-question {
        font-size: 2.5rem;
        margin-bottom: 20px;
    }
    #math-quiz-input {
        font-size: 2rem;
        width: 120px;
        text-align: center;
        border: 2px solid #f5c518;
        background: #0d0d1a;
        color: #fff;
        border-radius: 6px;
        padding: 8px;
        outline: none;
    }
    #math-quiz-input.shake {
        animation: shake 0.3s;
        border-color: #e74c3c;
    }
    #math-quiz-error {
        color: #e74c3c;
        font-size: 1.1rem;
        margin-top: 12px;
        min-height: 1.4em;
    }
    @keyframes shake {
        0%   { transform: translateX(0); }
        20%  { transform: translateX(-8px); }
        40%  { transform: translateX(8px); }
        60%  { transform: translateX(-8px); }
        80%  { transform: translateX(8px); }
        100% { transform: translateX(0); }
    }
</style>
```

Then add this div immediately after `<body>` opens (before the `<canvas>`):

```html
<div id="math-quiz-overlay">
    <div id="math-quiz-box">
        <h2>? MATH CHALLENGE ?</h2>
        <div id="math-quiz-question"></div>
        <input id="math-quiz-input" type="number" autocomplete="off" />
        <div id="math-quiz-error"></div>
    </div>
</div>
```

- [ ] **Step 2: Load mathQuiz.js before the inline init script**

In `main.html`, add this line just before the closing `</body>` inline `<script>` tag:

```html
<script src="code/mathQuiz.js"></script>
```

- [ ] **Step 3: Verify HTML renders without errors**

Open `main.html` in a browser. Open DevTools console — confirm zero errors. The overlay should be invisible (not active yet).

---

### Task 2: Create Mario.MathQuiz singleton

**Files:**
- Create: `code/mathQuiz.js`

- [ ] **Step 1: Write the MathQuiz module**

Create `/Users/mwerbner/projects/mariohtml5/code/mathQuiz.js` with this content:

```javascript
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
            a = ((Math.random() * 20) | 0) + 1;
            b = ((Math.random() * a) | 0) + 1;
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

        var problem = generate();
        correctAnswer = problem.answer;
        successCallback = callback;

        questionEl.textContent = problem.question;
        inputEl.value = '';
        errorEl.textContent = '';

        overlay.classList.add('active');
        inputEl.focus();
        inputEl.addEventListener('keydown', onKeyDown);
    }

    function hide() {
        overlay.classList.remove('active');
        inputEl.removeEventListener('keydown', onKeyDown);
    }

    return { show: show };
}());
```

- [ ] **Step 2: Verify in browser console**

Open browser DevTools console and run:

```javascript
Mario.MathQuiz.show(function() { console.log('correct!'); });
```

The overlay should appear. Type the wrong answer and press Enter — the input should shake and clear. Type the correct answer and press Enter — the overlay should close and `"correct!"` should log.

- [ ] **Step 3: Commit**

```bash
git add main.html code/mathQuiz.js
git commit -m "feat: add math quiz overlay HTML, CSS, and MathQuiz module"
```

---

### Task 3: Add QuizActive freeze to LevelState

**Files:**
- Modify: `code/levelState.js:6-33` (constructor), `code/levelState.js:50` (Enter), `code/levelState.js:103` (Update)

- [ ] **Step 1: Add QuizActive to the constructor**

In `code/levelState.js`, the constructor `Mario.LevelState = function(difficulty, type)` has properties listed starting at line 6. After line 13 (`this.Paused = false;`), add:

```javascript
    this.QuizActive = false;
```

- [ ] **Step 2: Reset QuizActive in Enter**

In `Mario.LevelState.prototype.Enter`, after `this.Paused = false;` (line 50), add:

```javascript
    this.QuizActive = false;
```

- [ ] **Step 3: Short-circuit Update when QuizActive**

In `Mario.LevelState.prototype.Update`, the function body starts at line 103. Add a guard at the very top of the function body, right after the `var` declarations (after line 105):

```javascript
    if (this.QuizActive) {
        return;
    }
```

The result should look like:

```javascript
Mario.LevelState.prototype.Update = function(delta) {
    var i = 0, j = 0, xd = 0, yd = 0, sprite = null, hasShotCannon = false, xCannon = 0, x = 0, y = 0,
        dir = 0, st = null, b = 0;

    if (this.QuizActive) {
        return;
    }

    this.Delta = delta;
    // ... rest of function unchanged
```

- [ ] **Step 4: Verify freeze works**

Open the game in a browser. In DevTools console run:

```javascript
Mario.LevelState && (function(){
    // find the active LevelState via the app
    console.log('QuizActive field exists:', 'QuizActive' in Enjine.Application.prototype);
})();
```

This is a structural check — the real freeze will be validated in Task 4.

- [ ] **Step 5: Commit**

```bash
git add code/levelState.js
git commit -m "feat: add QuizActive freeze flag to LevelState"
```

---

### Task 4: Hook math quiz into Bump()

**Files:**
- Modify: `code/levelState.js:411-445` (Bump function)

- [ ] **Step 1: Rewrite the Bumpable branch of Bump() to call MathQuiz**

In `code/levelState.js`, replace the entire `Bumpable` branch inside `Bump()` (lines 414–431) with:

```javascript
    if ((Mario.Tile.Behaviors[block & 0xff] & Mario.Tile.Bumpable) > 0) {
        var world = this;
        var isSpecial = (Mario.Tile.Behaviors[block & 0xff] & Mario.Tile.Special) > 0;
        var isLarge = Mario.MarioCharacter.Large;

        world.QuizActive = true;

        Mario.MathQuiz.show(function() {
            world.QuizActive = false;

            world.BumpInto(x, y - 1);
            world.Level.SetBlock(x, y, 4);
            world.Level.SetBlockData(x, y, 4);

            if (isSpecial) {
                Enjine.Resources.PlaySound("sprout");
                if (!isLarge) {
                    world.AddSprite(new Mario.Mushroom(world, x * 16 + 8, y * 16 + 8));
                } else {
                    world.AddSprite(new Mario.FireFlower(world, x * 16 + 8, y * 16 + 8));
                }
            } else {
                Mario.MarioCharacter.GetCoin();
                Enjine.Resources.PlaySound("coin");
                world.AddSprite(new Mario.CoinAnim(world, x, y));
            }
        });
    }
```

The `Breakable` branch below (lines 433–444) remains **completely unchanged**.

- [ ] **Step 2: Verify end-to-end in browser**

1. Open `main.html` in the browser.
2. Play the game and jump into a question mark block.
3. Confirm: the overlay appears with a math question.
4. Confirm: Mario and all enemies are frozen (nothing moves while overlay is showing).
5. Type a wrong answer and press Enter — input shakes, clears, overlay stays.
6. Type the correct answer and press Enter — overlay closes, coin/power-up appears, game resumes.

- [ ] **Step 3: Commit**

```bash
git add code/levelState.js
git commit -m "feat: freeze game and show math quiz on every question block hit"
```
