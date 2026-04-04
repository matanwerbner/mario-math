var Mario = Mario || {};

Mario.Scores = (function() {
    var STORAGE_KEY = 'hallOfFame';

    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function add(name, points) {
        var data = load();
        data[name] = (data[name] || 0) + points;
        save(data);
    }

    function getTop10() {
        var data = load();
        var list = [];
        for (var name in data) {
            if (data.hasOwnProperty(name)) {
                list.push({ name: name, score: data[name] });
            }
        }
        list.sort(function(a, b) { return b.score - a.score; });
        return list.slice(0, 10);
    }

    function getScore(name) {
        var data = load();
        return data[name] || 0;
    }

    return { add: add, getTop10: getTop10, getScore: getScore };
}());
