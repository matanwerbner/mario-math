var Mario = Mario || {};

Mario.PlayMusic = function() {
    var el = document.getElementById('bg-music');
    if (!el) { return; }
    if (el.paused) {
        el.currentTime = 0;
        el.play();
    }
};

Mario.StopMusic = function() {
    var el = document.getElementById('bg-music');
    if (!el) { return; }
    el.pause();
};

Mario.PlayLevelComplete = function() {
    var el = document.getElementById('jingle-level-complete');
    if (el) { el.currentTime = 0; el.play(); }
};

Mario.PlayLostALife = function() {
    var el = document.getElementById('jingle-lost-a-life');
    if (el) { el.currentTime = 0; el.play(); }
};

Mario.PlayGameOver = function() {
    var el = document.getElementById('jingle-game-over');
    if (el) { el.currentTime = 0; el.play(); }
};

Mario.PlayTitleMusic    = Mario.PlayMusic;
Mario.PlayMapMusic      = Mario.PlayMusic;
Mario.PlayOvergroundMusic = Mario.PlayMusic;
Mario.PlayUndergroundMusic = Mario.PlayMusic;
Mario.PlayCastleMusic   = Mario.PlayMusic;
