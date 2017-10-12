const symbols = [
    'fingerprint', 'bug_report', 'alarm', 'assignment', 'grade',
    'motorcycle', 'pets', 'work', 'store', 'theaters',
    'shopping_cart', 'album', 'movie', 'radio', 'business',
    'videocam', 'save', 'weekend', 'drafts', 'mail',
    'airplanemode_active', 'bluetooth', 'battery_charging_full', 'dvr', 'format_paint',
    'whatshot', 'public', 'school', 'cake', 'location_city',
    'beach_access', 'spa'
];

$(document).ready(function() {
    const $form = $greeter = document.getElementById('greeter');
    const $board = document.getElementById('board');
    const $cards = document.getElementById('cards');
    const $leaders = document.getElementById('leaders');

    let gameSymbols, gameCompletionTimeout, gameStartTime, gameEndTime, gameStorage;

    const readStorage = () => {
        gameStorage = window.localStorage.getItem('gameStorage');
        if (!gameStorage) {
            gameStorage = '{}';
        }
        gameStorage = JSON.parse(gameStorage);
        if (!gameStorage.player) {
            gameStorage.player = '';
        }
        if (!gameStorage.difficulty) {
            gameStorage.difficulty = '1';
        }
        if (!gameStorage.leaders || gameStorage.leaders.length !== 4) {
            gameStorage.leaders = [
                [],
                [],
                [],
                []
            ];
        }
    };

    function getGameConfig() {
        gameStorage.player = $form.elements['name'].value;
        gameStorage.difficulty = $form.elements['difficulty'].value;
        $cards.dataset['difficulty'] = $form.elements['difficulty'].value;
    };

    function prepareGameSymbols() {
        let cardCount = [0];
        const config = {
            '0': 4,
            '1': 12,
            '2': 36,
            '3': 48,
        };
        cardCount = config[$form.elements['difficulty'].value];

        shuffleArray(symbols);
        gameSymbols = symbols.slice(0, cardCount / 2);
        Array.prototype.push.apply(gameSymbols, gameSymbols);
        shuffleArray(gameSymbols);
        $cards.innerText = '';
    };

    function startGameTimer() {
        for (let i = 0; i < gameSymbols.length; i++) {
            let $card = document.createElement('div');
            $card.className = 'card';
            $card.dataset['idx'] = i.toString();
            $card.innerHTML = '<i class="material-icons">' + gameSymbols[i] + '</i>';
            $cards.appendChild($card);
        }
    };

    function saveGameData() {
        $board.classList.add('playing');
        gameStartTime = new Date();
        window.localStorage.setItem('gameStorage', JSON.stringify(gameStorage));
    };

    let initGame = (e) => {
        e.preventDefault();
        getGameConfig();
        prepareGameSymbols();
        startGameTimer();
        saveGameData();
    };
    const abortGame = (e) => {
        $board.classList.remove('playing');
        $board.classList.remove('completed');
    };

    const switchCard = (e) => {
        if (!e.target.classList.contains('card')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const $card = e.target;
        const idx = parseInt($card.dataset['idx']);
        const $$visibleCard = $cards.querySelectorAll('.card.visible:not(.found)');
        if ($$visibleCard.length >= 2) {
            return;
        }
        if ($$visibleCard.length === 1) {
            let $visibleCard = $$visibleCard[0];
            let visibleIdx = $visibleCard.dataset['idx'];
            if (gameSymbols[visibleIdx] === gameSymbols[idx]) {
                $visibleCard.classList.add('found');
                $card.classList.add('found');
                let foundCards = $cards.querySelectorAll('.card.found').length;
                if (foundCards === gameSymbols.length) {
                    gameEndTime = new Date();
                    gameCompletionTimeout = setTimeout(completeGame, 200);
                }
            } else {
                // one card visible... should show another and lock for few seconds...
                $board.classList.add('locked');
                setTimeout(hideCards, 2000);
            }
        }
        $card.classList.toggle('visible');
    };

    let hideCards = () => {
        let $$visibleCard = $cards.querySelectorAll('.visible:not(.found)');
        for (let i = 0; i < $$visibleCard.length; i++) {
            $$visibleCard[i].classList.remove('visible');
        }
        $board.classList.remove('locked');
    };

    const completeGame = () => {
        const gameTime = gameEndTime.getTime() - gameStartTime.getTime();

        // leader board handling
        const thisGame = {
            player: gameStorage.player,
            difficulty: gameStorage.difficulty,
            startTime: gameStartTime.getTime(),
            endTime: gameEndTime.getTime(),
            gameTime: gameTime
        }

        gameStorage.leaders[gameStorage.difficulty].push(thisGame);
        sortLeaders();
        window.localStorage.setItem('gameStorage', JSON.stringify(gameStorage));
        $board.classList.add('completed');
        showLeaders();
    };

    const sortLeaders = () => {
        const sorter = (a, b) => {
            return a.gameTime < b.gameTime ?
                -1 :
                a.gameTime > b.gameTime ?
                    1 :
                    0
        }
        gameStorage.leaders[0].sort(sorter);
        gameStorage.leaders[1].sort(sorter);
        gameStorage.leaders[2].sort(sorter);
        gameStorage.leaders[3].sort(sorter);
    };

    const showLeaders = (e) => {
        e && e.preventDefault();
        $leaders.classList.add('visible');
        readStorage();
        sortLeaders();
        for (let d = 0; d < 4; d++) {
            const $statList = $leaders.querySelector('[data-difficulty="' + d + '"] .list');
            const stats = gameStorage.leaders[d];
            $statList.dataset['items'] = stats.length.toString();
            $statList.innerText = '';
            for (let i = 0; i < stats.length; i++) {
                const stat = stats[i];
                const $item = document.createElement('div');
                $item.className = 'item';

                const $name = document.createElement('h4');
                $name.className = 'name';
                $name.innerText = stat.player;
                $item.appendChild($name);

                const $gameTime = document.createElement('div');
                $gameTime.className = 'time';
                $gameTime.innerText = (stat.gameTime / 1000).toFixed(2) + 's';
                $item.appendChild($gameTime);

                const $date = document.createElement('time');
                const date = new Date(stat.startTime);
                $date.className = 'date';
                $date.dateTime = date.toISOString();
                $date.innerText = date.toISOString().slice(0, 19).replace('T', ' ');
                $item.appendChild($date);

                $statList.appendChild($item);
            }
        }
    };

    const hideLeaders = (e) => {
        e.preventDefault();
        $leaders.classList.remove('visible');
        $board.classList.remove('completed');
        $board.classList.remove('playing');
    };

    readStorage();
    $form.elements['name'].value = gameStorage.player;

    $greeter.addEventListener('submit', initGame, false);
    document.getElementById('abort').addEventListener('click', abortGame, false);
    document.getElementById('leadersButton').addEventListener('click', showLeaders, false);
    document.getElementById('leadersCloseButton').addEventListener('click', hideLeaders, false);
    $board.addEventListener('click', switchCard, false);

}, false);

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}