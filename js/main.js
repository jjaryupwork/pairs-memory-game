let $greeter, $board, $cards, $leaders, $form,
    symbols = [
        'fingerprint', 'bug_report', 'alarm', 'assignment', 'grade',
        'motorcycle', 'pets', 'work', 'store', 'theaters',
        'shopping_cart', 'album', 'movie', 'radio', 'business',
        'videocam', 'save', 'weekend', 'drafts', 'mail',
        'airplanemode_active', 'bluetooth', 'battery_charging_full', 'dvr', 'format_paint',
        'whatshot', 'public', 'school', 'cake', 'location_city',
        'beach_access', 'spa'
    ];
document.addEventListener('DOMContentLoaded', () => {
    $form = $greeter = document.getElementById('greeter');
$board = document.getElementById('board');
$cards = document.getElementById('cards');
$leaders = document.getElementById('leaders');

let gameSymbols, gameCompletionTimeout, gameStartTime, gameEndTime, gameStorage;

let readStorage = () => {
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
    console.log('Reading game storage gave:', gameStorage);
};

let initGame = (e) => {
    e.preventDefault();
    console.log(
        '"%s" wants to play game on level %d',
        $form.elements['name'].value,
        $form.elements['difficulty'].value
    );
    gameStorage.player = $form.elements['name'].value;
    gameStorage.difficulty = $form.elements['difficulty'].value;
    $cards.dataset['difficulty'] = $form.elements['difficulty'].value;
    let cardCount = 0;
    switch ($form.elements['difficulty'].value) {
        case "0":
            cardCount = 2 * 2;
            break;
        case "1":
            cardCount = 4 * 4;
            break;
        case "2":
            cardCount = 6 * 6;
            break;
        case "3":
            cardCount = 8 * 8;
            break;
    }
    console.log('Generating ' + cardCount + ' cards');
    shuffleArray(symbols);
    gameSymbols = symbols.slice(0, cardCount / 2);
    console.log('Will use this symbols: ', gameSymbols);
    Array.prototype.push.apply(gameSymbols, gameSymbols);
    shuffleArray(gameSymbols);
    $cards.innerText = '';
    for (let i = 0; i < gameSymbols.length; i++) {
        let $card = document.createElement('div');
        $card.className = 'card';
        $card.dataset['idx'] = i.toString();
        $card.innerHTML = '<i class="material-icons">' + gameSymbols[i] + '</i>';
        $cards.appendChild($card);
    }
    $board.classList.add('playing');
    gameStartTime = new Date();
    window.localStorage.setItem('gameStorage', JSON.stringify(gameStorage));
};
let abortGame = (e) => {
    $board.classList.remove('playing');
    $board.classList.remove('completed');
};

let switchCard = (e) => {
    if (!e.target.classList.contains('card')) {
        console.log('Not a card');
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    let $card = e.target;
    let idx = parseInt($card.dataset['idx']);
    let $$visibleCard = $cards.querySelectorAll('.card.visible:not(.found)');
    if ($$visibleCard.length >= 2) {
        console.log('More than two cards visible O.o');
        return;
    }
    if ($$visibleCard.length === 1) {
        let $visibleCard = $$visibleCard[0];
        let visibleIdx = $visibleCard.dataset['idx'];
        if (gameSymbols[visibleIdx] === gameSymbols[idx]) {
            console.log('YAAAY! Cards match!');
            $visibleCard.classList.add('found');
            $card.classList.add('found');
            let foundCards = $cards.querySelectorAll('.card.found').length;
            console.log('Total count of found cards: ' + foundCards);
            if (foundCards === gameSymbols.length) {
                gameEndTime = new Date();
                gameCompletionTimeout = setTimeout(completeGame, 200);
            }
        } else {
            console.log('One card was visible... setting timeout');
            // one card visible... should show another and lock for few seconds...
            $board.classList.add('locked');
            setTimeout(hideCards, 2000);
        }
    }
    console.log('Switching card! ' + idx + ' ' + gameSymbols[idx]);
    $card.classList.toggle('visible');
};

let hideCards = () => {
    console.log('Hiding cards');
    let $$visibleCard = $cards.querySelectorAll('.visible:not(.found)');
    console.log('Got ' + $$visibleCard.length + ' to hide');
    for (let i = 0; i < $$visibleCard.length; i++) {
        console.log('Hiding card: ', $$visibleCard[i]);
        $$visibleCard[i].classList.remove('visible');
    }
    $board.classList.remove('locked');
};

let completeGame = () => {
    console.log('WOOOHOOO!!! Game is completed!!!');

    let gameTime = gameEndTime.getTime() - gameStartTime.getTime();
    console.log('Game took ' + gameTime + 'ms');

    // leader board handling
    let thisGame = {
        player: gameStorage.player,
        difficulty: gameStorage.difficulty,
        startTime: gameStartTime.getTime(),
        endTime: gameEndTime.getTime(),
        gameTime: gameTime
    }

    gameStorage.leaders[gameStorage.difficulty].push(thisGame);
    sortLeaders();

    console.log('Storage will be: ', gameStorage);
    window.localStorage.setItem('gameStorage', JSON.stringify(gameStorage));

    $board.classList.add('completed');
    showLeaders();
};

let sortLeaders = () => {
    let sorter = (a, b) => {
        return a.gameTime < b.gameTime
            ? -1
            : a.gameTime > b.gameTime
                ? 1
                : 0
    }
    gameStorage.leaders[0].sort(sorter);
    gameStorage.leaders[1].sort(sorter);
    gameStorage.leaders[2].sort(sorter);
    gameStorage.leaders[3].sort(sorter);
};

let showLeaders = (e) => {
    e && e.preventDefault();
    $leaders.classList.add('visible');
    readStorage();
    sortLeaders();
    for (let d = 0; d < 4; d++) {
        let $statList = $leaders.querySelector('[data-difficulty="' + d + '"] .list');
        let stats = gameStorage.leaders[d];
        $statList.dataset['items'] = stats.length.toString();
        $statList.innerText = '';
        for (let i = 0; i < stats.length; i++) {
            let stat = stats[i];
            let $item = document.createElement('div');
            $item.className = 'item';

            let $name = document.createElement('h4');
            $name.className = 'name';
            $name.innerText = stat.player;
            $item.appendChild($name);

            let $gameTime = document.createElement('div');
            $gameTime.className = 'time';
            $gameTime.innerText = (stat.gameTime / 1000).toFixed(2) + 's';
            $item.appendChild($gameTime);

            let $date = document.createElement('time');
            let date = new Date(stat.startTime);
            $date.className = 'date';
            $date.dateTime = date.toISOString();
            $date.innerText = date.toISOString().slice(0, 19).replace('T', ' ');
            $item.appendChild($date);

            $statList.appendChild($item);
        }
    }
};

let hideLeaders = (e) => {
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