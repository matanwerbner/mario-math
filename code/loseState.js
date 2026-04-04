/**
	State shown when the player loses — displays hall of fame.
*/

Mario.LoseState = function() {
    this.drawManager = null;
    this.camera = null;
    this.gameOver = null;
    this.fontWhite = null;
    this.fontYellow = null;
    this.fontShadow = null;
    this.wasKeyDown = false;
};

Mario.LoseState.prototype = new Enjine.GameState();

Mario.LoseState.prototype.Enter = function() {
    this.drawManager = new Enjine.DrawableManager();
    this.camera = new Enjine.Camera();

    this.gameOver = new Enjine.AnimatedSprite();
    this.gameOver.Image = Enjine.Resources.Images["gameOverGhost"];
    this.gameOver.SetColumnCount(9);
    this.gameOver.SetRowCount(1);
    this.gameOver.AddNewSequence("turnLoop", 0, 0, 0, 8);
    this.gameOver.PlaySequence("turnLoop", true);
    this.gameOver.FramesPerSecond = 1/15;
    this.gameOver.X = 112;
    this.gameOver.Y = 10;

    this.drawManager.Add(this.gameOver);

    this.fontWhite = Mario.SpriteCuts.CreateWhiteFont();
    this.fontYellow = Mario.SpriteCuts.CreateYellowFont();
    this.fontShadow = Mario.SpriteCuts.CreateBlackFont();
};

Mario.LoseState.prototype.Exit = function() {
    this.drawManager.Clear();
    delete this.drawManager;
    delete this.camera;
    delete this.gameOver;
    delete this.fontWhite;
    delete this.fontYellow;
    delete this.fontShadow;
};

Mario.LoseState.prototype.Update = function(delta) {
    this.drawManager.Update(delta);
    if (Enjine.KeyboardInput.IsKeyDown(Enjine.Keys.S)) {
        this.wasKeyDown = true;
    }
};

Mario.LoseState.prototype.DrawStr = function(context, font, shadow, str, x, y) {
    // x, y in pixels on the 320x240 canvas
    shadow.Strings[0] = { String: str, X: x + 1, Y: y + 1 };
    font.Strings[0]   = { String: str, X: x,     Y: y     };
    shadow.Draw(context, this.camera);
    font.Draw(context, this.camera);
};

Mario.LoseState.prototype.Draw = function(context) {
    var top10, i, entry, rank, name, score, line, rowFont, startY;

    // black background
    context.fillStyle = "#000";
    context.fillRect(0, 0, 320, 240);

    this.drawManager.Draw(context, this.camera);

    // Title
    this.DrawStr(context, this.fontYellow, this.fontShadow, "HALL OF FAME", 72, 58);

    // Column headers
    this.DrawStr(context, this.fontWhite, this.fontShadow, "#  NAME   PTS", 16, 74);

    top10 = Mario.Scores.getTop10();
    startY = 88;
    for (i = 0; i < top10.length; i++) {
        entry = top10[i];
        rank = (i + 1) + ".";
        name = entry.name.substring(0, 6).toUpperCase();
        while (name.length < 6) { name += " "; }
        score = "" + entry.score;
        line = rank + " " + name + " " + score;

        rowFont = (entry.name === Mario.CurrentPlayer) ? this.fontYellow : this.fontWhite;
        this.DrawStr(context, rowFont, this.fontShadow, line, 16, startY + i * 12);
    }

    if (top10.length === 0) {
        this.DrawStr(context, this.fontWhite, this.fontShadow, "NO SCORES YET!", 64, 110);
    }

    var prompt = Mario.MarioCharacter.Lives > 0 ? "PRESS S TO CONTINUE" : "PRESS S TO PLAY AGAIN";
    this.DrawStr(context, this.fontWhite, this.fontShadow, prompt, 16, 228);
};

Mario.LoseState.prototype.CheckForChange = function(context) {
    if (this.wasKeyDown && !Enjine.KeyboardInput.IsKeyDown(Enjine.Keys.S)) {
        if (Mario.MarioCharacter.Lives > 0) {
            context.ChangeState(Mario.GlobalMapState);
        } else {
            context.ChangeState(new Mario.TitleState());
        }
    }
};
