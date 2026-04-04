# Quiz: Directed Numbers + Timer Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the math question generator with 3-operand directed-number expressions (integers −10 to 10, operators +/−/×, standard precedence with parentheses), change the box-hit trigger to 1-in-3 chance, add a 60-second forced quiz timer, and display a running solved-exercises count on the HUD.

**Architecture:** Two files change. `code/mathQuiz.js`: rewrite `generate()` only — the rest of the module is untouched. `code/levelState.js`: add `QuizTimer` and `QuizSolved` counters to constructor/Enter/Update, change `Bump()` to roll 1-in-3 and reset the timer on quiz fire, and draw the solved count in `Draw()`.

**Tech Stack:** Vanilla JS (ES5), existing Enjine game loop (30fps `setInterval`)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `code/mathQuiz.js` | Modify | Replace `generate()` with 3-operand directed-number generator |
| `code/levelState.js` | Modify | Add `QuizTimer` + `QuizSolved`, increment/reset in `Update()` and `Bump()`, fire quiz at 60s, draw solved count in HUD |

---

### Task 1: Replace `generate()` in mathQuiz.js

**Files:**
- Modify: `code/mathQuiz.js` — `generate()` function only (lines 11–34)

The new generator picks three non-zero integers from [−10, 10] and two operators independently from `['+', '-', '*']`. It computes the answer using standard JS operator precedence. It builds a display string that wraps any `*` sub-expression in parentheses when it is adjacent to a `+` or `−` operator, so the displayed question is unambiguous.

Parenthesisation rules for display (the JS computation is always correct regardless):
- If op1 is `*` and op2 is not `*`: display as `(a × b) OP2 c`
- If op2 is `*` and op1 is not `*`: display as `a OP1 (b × c)`
- If both ops are `*` or neither is `*`: no parens needed — display as `a OP1 b OP2 c`

- [ ] **Step 1: Replace `generate()` in `code/mathQuiz.js`**

Find and replace the entire `generate()` function (from `function generate() {` through its closing `}`). Replace with:

```javascript
    function generate() {
        var ops = ['+', '-', '*'];
        var op1 = ops[(Math.random() * 3) | 0];
        var op2 = ops[(Math.random() * 3) | 0];
        var a, b, c, answer, question;

        // Pick three non-zero integers in [-10, 10]
        function randOperand() {
            var n = ((Math.random() * 10) | 0) + 1;
            return Math.random() < 0.5 ? n : -n;
        }

        a = randOperand();
        b = randOperand();
        c = randOperand();

        // Compute answer using standard JS precedence
        // Build a JS-evaluable expression and use Function to avoid eval
        var exprStr = '(' + a + ')' + op1 + '(' + b + ')' + op2 + '(' + c + ')';
        answer = (new Function('return ' + exprStr))();

        // Build display string with × symbol and parentheses for clarity
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
```

- [ ] **Step 2: Verify generate() manually in browser console**

Open `main.html` in a browser. In DevTools console run:

```javascript
// Trigger show to test generate() indirectly
var results = [];
for (var i = 0; i < 20; i++) {
    Mario.MathQuiz.show(function(){});
    // hide immediately — we just want to see the question displayed
}
```

Or more directly, since `generate` is private, call `show` once and read the displayed question text:

```javascript
Mario.MathQuiz.show(function() {});
document.getElementById('math-quiz-question').textContent;
// Should show something like: "(-3) × (4) + (7) = ?" or "(5) + (-2) × (3) = ?"
```

Confirm the question contains three operands, two operators, and uses parentheses correctly. Close overlay manually (type any number, press Enter) or reload.

- [ ] **Step 3: Commit**

```bash
git add code/mathQuiz.js
git commit -m "feat: replace generate() with 3-operand directed-number questions"
```

---

### Task 2: Add `QuizTimer` to LevelState and fire quiz at 60 seconds

**Files:**
- Modify: `code/levelState.js` — constructor (line ~14), `Enter` (line ~52), `Update` (line ~105)

- [ ] **Step 1: Add `QuizTimer` to the constructor**

In `code/levelState.js`, in the constructor `Mario.LevelState = function(difficulty, type)`, after the line `this.QuizActive = false;` (line 14), add:

```javascript
    this.QuizTimer = 0;
```

- [ ] **Step 2: Reset `QuizTimer` in `Enter`**

In `Mario.LevelState.prototype.Enter`, after the line `this.QuizActive = false;` (line 52), add:

```javascript
    this.QuizTimer = 0;
```

- [ ] **Step 3: Increment `QuizTimer` in `Update()` and fire quiz at 60s**

In `Mario.LevelState.prototype.Update`, the early return for `QuizActive` is at lines 109–111. Immediately after that block (before `this.Delta = delta;`), add the timer increment and trigger:

```javascript
    this.QuizTimer += delta;
    if (this.QuizTimer >= 60) {
        this.QuizTimer = 0;
        this.QuizActive = true;
        Mario.MathQuiz.show(function() {
            Mario.LevelState._activeWorld.QuizActive = false;
        });
        return;
    }
```

Wait — `this` inside a callback loses context. Use a local variable instead. The correct insertion is:

```javascript
    this.QuizTimer += delta;
    if (this.QuizTimer >= 60) {
        this.QuizTimer = 0;
        var timerWorld = this;
        timerWorld.QuizActive = true;
        Mario.MathQuiz.show(function() {
            timerWorld.QuizActive = false;
        });
        return;
    }
```

Place this block immediately after the `if (this.QuizActive) { return; }` block and before `this.Delta = delta;`. The full top of `Update()` should now read:

```javascript
Mario.LevelState.prototype.Update = function(delta) {
    var i = 0, j = 0, xd = 0, yd = 0, sprite = null, hasShotCannon = false, xCannon = 0, x = 0, y = 0,
        dir = 0, st = null, b = 0;

    if (this.QuizActive) {
        return;
    }

    this.QuizTimer += delta;
    if (this.QuizTimer >= 60) {
        this.QuizTimer = 0;
        var timerWorld = this;
        timerWorld.QuizActive = true;
        Mario.MathQuiz.show(function() {
            timerWorld.QuizActive = false;
        });
        return;
    }

    this.Delta = delta;
    // ... rest of function unchanged
```

- [ ] **Step 4: Verify timer fires in browser**

Open `main.html`. Start a level. Wait ~60 seconds without hitting any blocks. Confirm the math quiz overlay appears automatically.

- [ ] **Step 5: Commit**

```bash
git add code/levelState.js
git commit -m "feat: add 60-second forced quiz timer to LevelState"
```

---

### Task 3: Change box-hit trigger to 1-in-3 chance and reset timer on quiz fire

**Files:**
- Modify: `code/levelState.js` — `Bump()` function (lines ~420–448)

- [ ] **Step 1: Update `Bump()` to 1-in-3 chance and timer reset**

In `Bump()`, the Bumpable branch currently looks like:

```javascript
    if ((Mario.Tile.Behaviors[block & 0xff] & Mario.Tile.Bumpable) > 0) {
        if (this.QuizActive) { return; }
        var world = this;
        var isSpecial = (Mario.Tile.Behaviors[block & 0xff] & Mario.Tile.Special) > 0;
        var isLarge = Mario.MarioCharacter.Large;

        world.Level.SetBlock(x, y, 4);
        world.Level.SetBlockData(x, y, 4);
        world.QuizActive = true;

        Mario.MathQuiz.show(function() {
            world.QuizActive = false;

            world.BumpInto(x, y - 1);

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

Replace it with:

```javascript
    if ((Mario.Tile.Behaviors[block & 0xff] & Mario.Tile.Bumpable) > 0) {
        if (this.QuizActive) { return; }
        var world = this;
        var isSpecial = (Mario.Tile.Behaviors[block & 0xff] & Mario.Tile.Special) > 0;
        var isLarge = Mario.MarioCharacter.Large;

        world.Level.SetBlock(x, y, 4);
        world.Level.SetBlockData(x, y, 4);

        if (Math.random() < 1/3) {
            world.QuizTimer = 0;
            world.QuizActive = true;
            Mario.MathQuiz.show(function() {
                world.QuizActive = false;
                world.BumpInto(x, y - 1);
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
        } else {
            world.BumpInto(x, y - 1);
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
        }
    }
```

Key changes:
- `Math.random() < 1/3` gates the quiz (≈33% chance)
- `world.QuizTimer = 0` resets the 60s timer whenever a box-hit quiz fires
- The `else` branch executes the reward immediately (no quiz)

- [ ] **Step 2: Verify in browser**

Open `main.html`. Hit several question mark blocks in a row. Confirm:
- Roughly 1 in 3 hits triggers the quiz overlay
- The other hits give the reward immediately (coin sound, coin animation or power-up)
- After a quiz fires from a box hit, the 60s timer resets (you can verify by checking that the timer quiz doesn't appear until ~60s after the last box-hit quiz)

- [ ] **Step 3: Commit**

```bash
git add code/levelState.js
git commit -m "feat: change box-hit quiz to 1-in-3 chance, reset timer on quiz fire"
```

---

### Task 4: Track and display solved exercises count on the HUD

**Files:**
- Modify: `code/levelState.js` — constructor, `Enter`, quiz callbacks in `Update()` and `Bump()`, `Draw()`

The existing HUD uses `this.DrawStringShadow(context, text, col, row)` where `col` is a character-column index (multiplied by 8px) and `row` is 0 (label) or 1 (value). Current HUD columns: MARIO at 0, COIN at 14, WORLD at 24, TIME at 34. There is space before column 14 to add a "SOLVED" counter. We'll place it at column 7 (56px from left), sitting between the score and coins.

- [ ] **Step 1: Add `QuizSolved` to the constructor**

In `code/levelState.js`, in the constructor, after `this.QuizTimer = 0;`, add:

```javascript
    this.QuizSolved = 0;
```

- [ ] **Step 2: Reset `QuizSolved` in `Enter`**

In `Mario.LevelState.prototype.Enter`, after `this.QuizTimer = 0;`, add:

```javascript
    this.QuizSolved = 0;
```

- [ ] **Step 3: Increment `QuizSolved` in the timer quiz callback**

In `Update()`, the timer quiz callback currently reads:

```javascript
        Mario.MathQuiz.show(function() {
            timerWorld.QuizActive = false;
        });
```

Change it to:

```javascript
        Mario.MathQuiz.show(function() {
            timerWorld.QuizActive = false;
            timerWorld.QuizSolved += 1;
        });
```

- [ ] **Step 4: Increment `QuizSolved` in the box-hit quiz callback in `Bump()`**

In `Bump()`, the quiz success callback currently starts with:

```javascript
            Mario.MathQuiz.show(function() {
                world.QuizActive = false;
                world.BumpInto(x, y - 1);
```

Change it to:

```javascript
            Mario.MathQuiz.show(function() {
                world.QuizActive = false;
                world.QuizSolved += 1;
                world.BumpInto(x, y - 1);
```

- [ ] **Step 5: Draw the solved count in `Draw()`**

In `Mario.LevelState.prototype.Draw`, the HUD block currently reads (around line 297):

```javascript
    this.DrawStringShadow(context, "MARIO " + Mario.MarioCharacter.Lives, 0, 0);
    this.DrawStringShadow(context, "00000000", 0, 1);
    this.DrawStringShadow(context, "COIN", 14, 0);
```

Add two lines after `"00000000"` to render the solved counter at column 7:

```javascript
    this.DrawStringShadow(context, "MARIO " + Mario.MarioCharacter.Lives, 0, 0);
    this.DrawStringShadow(context, "00000000", 0, 1);
    this.DrawStringShadow(context, "SOLVED", 7, 0);
    this.DrawStringShadow(context, "  " + this.QuizSolved, 7, 1);
    this.DrawStringShadow(context, "COIN", 14, 0);
```

- [ ] **Step 6: Verify in browser**

Open `main.html`. Start a level. Confirm "SOLVED" and "0" appear on the HUD between the score and COIN counter. Solve one quiz (from a box hit or wait 60s for the timer). Confirm the count increments to 1.

- [ ] **Step 7: Commit**

```bash
git add code/levelState.js
git commit -m "feat: track and display solved exercises count on HUD"
```
