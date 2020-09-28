'use strict';

const LIVES = '<img class="misc-img" src="imgs/life.png">';
const HINTS_ON = '<img class="misc-img" src="imgs/bulbon.png">';
const HINTS_OFF = '<img class="misc-img" src="imgs/bulboff.png">';

const MINE_BLACK = '<img src="imgs/mineblack.png">';
const MINE_RED = '<img src="imgs/minered.png">';
const FLAG = '<img src="imgs/flag.png">';

const HAPPY = '<img class="smiley" src="imgs/happy.png">';
const SAD = '<img class="smiley" src="imgs/sad.png">';
const SHOCKED = '<img class="smiley" src="imgs/shocked.png">';
const WINNER = '<img class="smiley" src="imgs/winner.png">';

// localStorage.clear()

var gTempIdx = 0;
var gLastMoves = [];
var gTempLocations = [];

var gBoard = [];
var gLevel = {
    SIZE: 4,
    MINES: 2
};
var gGame = {};

var gDifficulty;
var gSecsPassed;
var gShownCount;
var gLifeCount;
var gHintsCount;
var gSafeClickCount;
var gGameInterval;


function initGame() {
    if (gGameInterval) clearInterval(gGameInterval);
    var elBtn = document.querySelector('.reset-game');
    elBtn.innerHTML = HAPPY;

    gTempIdx = 0;
    gGame = {
        isOver: false,
        isOn: false,
        isManual: false,
        isHintActive: false,
        isSafeOn: false,
        minesToPlace: gLevel.MINES,
        markedCount: gLevel.MINES,
        face: HAPPY
    };
    gSecsPassed = 0;
    gShownCount = 0;
    gLifeCount = 3;
    gHintsCount = 3;
    gSafeClickCount = 3;
    renderLives();
    renderHints();
    renderFlags();
    showTimer();
    renderSafeClicks();

    gBoard = buildBoard();
    renderBoard(gBoard);
    gDifficulty = 'Easy';
    if (gLevel.MINES === 12) gDifficulty = 'Normal';
    if (gLevel.MINES === 30) gDifficulty = 'Heroic';

    renderWinners(gDifficulty);
}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                isSafeMarked: false
            };
        }
    }
    return board;
}

function renderBoard(board) {
    var strHTML = '';
    var flags = [];
    for (var i = 0; i < board.length; i++) {
        var row = board[i];
        strHTML += `<tr>`;
        for (var j = 0; j < row.length; j++) {
            var location = { i: i, j: j }
            var cell = row[j];
            strHTML += `<td onmousedown="checkClick(this, event, ${i}, ${j})" class="`;
            if (!cell.isShown) strHTML += `covered`;
            strHTML += ` cell cell-${i}-${j}">`;
            if (cell.isShown) {
                if (!cell.isMine && cell.minesAroundCount > 0) {
                    strHTML += cell.minesAroundCount;
                }
            }
            strHTML += `</td>`;
            if (cell.isMarked) {
                flags.push(location);
            }
        }
    }
    strHTML += `</tr>`;

    var elField = document.querySelector('.mine-field');
    elField.innerHTML = strHTML;

    for (var i = 0; i < flags.length; i++) {
        var currLocation = flags[i];
        renderRevealedCell(currLocation, FLAG);
        var elCell = document.querySelector(`.cell-${currLocation.i}-${currLocation.j}`);
        elCell.classList.add(`covered`);
    }
}

function checkClick(elCell, ev, i, j) {

    var cell = gBoard[i][j];
    if (gGame.isManual && gGame.minesToPlace > 0) {
        placeMines(i, j);
        return;
    }
    if (gGame.isOver || cell.isShown) return;
    gLastMoves = [];

    if (gGame.isSafeOn) unMarkSafeSpot();

    if (!gGame.isOn) {
        gGameInterval = setInterval(showTimer, 1000);
        setMines(gBoard, i, j);
        addNumColors();
        gGame.isOn = true;
    }
    switch (ev.which) {
        case 1:
            cellClicked(elCell, i, j);
            break;
        case 3:
            cellMarked(elCell, i, j);
            break;
    }
    var prevGameCondition = createCurrGameCondition();

    gTempLocations[gTempIdx] = { condition: prevGameCondition, steps: [] };
    for (var idx = 0; idx < gLastMoves.length; idx++) {
        var i = gLastMoves[idx].i;
        var j = gLastMoves[idx].j;

        gTempLocations[gTempIdx].steps.push({ i, j })
    }
    gTempIdx++;
}

function cellClicked(elCell, i, j) {

    var elBtn = document.querySelector('.reset-game');
    elBtn.innerHTML = SHOCKED;
    setTimeout(function() {
        if (!gGame.isOver) elBtn.innerHTML = HAPPY;
    }, 200);

    var cell = gBoard[i][j];
    if (cell.isMarked) return;

    if (gGame.isHintActive && gHintsCount > 0) {
        gHintsCount -= 1;
        return revealNegs(gBoard, i, j);
    }

    var location = { i: i, j: j };
    if (cell.isMine) {
        if (gLifeCount === 0) renderCellShown(location, MINE_BLACK);
        if (gLifeCount > 0) {
            gLifeCount -= 1;
            renderLives();
            playExplosionSound();
            return;
        }
    } else if (cell.minesAroundCount > 0) {
        renderCellShown(location, cell.minesAroundCount);
    } else {
        renderEmptyCells(gBoard, i, j);
    }
    checkGameOver(i, j);

}

function cellMarked(elCell, i, j) {

    var cell = gBoard[i][j];
    var location = { i, j }

    if (!cell.isMarked) {
        if (gGame.markedCount < 1) return;
        elCell.innerHTML = FLAG;
        gGame.markedCount -= 1;
        getPrevLocations(location)
    } else {
        elCell.innerHTML = '';
        gGame.markedCount += 1;
    }
    cell.isMarked = !cell.isMarked;
    renderFlags()

    if (cell.isMine && cell.isMarked) checkGameOver(i, j);
}

function checkGameOver(row, col) {

    var elBtn = document.querySelector('.reset-game');
    if (!gBoard[row][col].isMarked && gBoard[row][col].isMine) {
        clearInterval(gGameInterval)
        gGame.isOver = true;
        renderExplodedBoard(gBoard, row, col)
        elBtn.innerHTML = SAD;
        playSadSound();

    }
    if (gShownCount === ((gLevel.SIZE ** 2) - gLevel.MINES) && gGame.markedCount === 0) {
        clearInterval(gGameInterval)
        gGame.isOver = true;
        elBtn.innerHTML = WINNER;
        playVictorySound();
        setTimeout(function() {
            createNewWinnerStr();
            renderWinners(gDifficulty);
        }, 1000)
    }
    return false;
}

function renderExplodedBoard(board, rowIdx, colIdx) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            if (cell.isMine) {
                var location = { i: i, j: j };
                renderCellShown(location, MINE_BLACK);
            }
        }
    }
    location = { i: rowIdx, j: colIdx };
    renderCellShown(location, MINE_RED);
}

function manageHint() {
    if (!gGame.isOn || gGame.isOver || gHintsCount < 0 || gGame.isHintActive) return
    gGame.isHintActive = true;
    renderHints();
}

function randomizeSafeBlock() {
    if (!gGame.isOn ||
        gGame.isSafeOn ||
        gGame.isOver ||
        gSafeClickCount === 0 ||
        gShownCount === (gLevel.SIZE ** 2) - gLevel.MINES
    ) return;

    var safeSpot = getRandEmptyCell();

    gGame.isSafeOn = true;
    gSafeClickCount -= 1;

    var elSafeClick = document.querySelector('.safe-click span');
    elSafeClick.innerText = gSafeClickCount;

    var tempCell = '.' + getClassName(safeSpot)
    var elSafeCell = document.querySelector(tempCell);
    elSafeCell.classList.add('safe')

    gBoard[safeSpot.i][safeSpot.j].isSafeMarked = true;
    setTimeout(unMarkSafeSpot, 3000);
}

function unMarkSafeSpot() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j];
            var location = { i: i, j: j }
            if (cell.isSafeMarked) {
                var tempCell = '.' + getClassName(location)
                var elSafeCell = document.querySelector(tempCell);
                elSafeCell.classList.remove('safe')
                cell.isSafeMarked = false;
                return gGame.isSafeOn = false;
            }
        }
    }
}

function toggleManualMode() {
    if (gGame.isOn) return;
    gGame.isManual = !gGame.isManual;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j];
            cell.isShown = !cell.isShown;
        }
        renderBoard(gBoard)
    }
    var elModalSpan = document.querySelector('.modal span');
    elModalSpan.innerText = gGame.minesToPlace;

    var elModal = document.querySelector('.modal');
    elModal.classList.toggle('show');
}

function placeMines(rowIdx, colIdx) {

    var location = { i: rowIdx, j: colIdx };
    gBoard[rowIdx][colIdx].isMine = true;

    var cellSelector = '.' + getClassName(location);
    var elCell = document.querySelector(cellSelector);
    elCell.innerHTML = MINE_BLACK;

    gGame.minesToPlace -= 1;

    var elModalSpan = document.querySelector('.modal span');
    elModalSpan.innerText = gGame.minesToPlace;

    if (gGame.minesToPlace === 0) {
        setTimeout(function() {
            for (var i = 0; i < gBoard.length; i++) {
                for (var j = 0; j < gBoard.length; j++) {
                    gBoard[i][j].minesAroundCount = setMinesNegsCount(gBoard, i, j);
                }
            }
            toggleManualMode();
            gGameInterval = setInterval(showTimer, 1000);
            addNumColors();
            gGame.isOn = true;
        }, 1000)
    }
}

function undo() {
    if (gTempIdx === 0 || gGame.isOver) return;

    gTempIdx--;
    gGame = {};
    gGame = gTempLocations[gTempIdx].condition;
    var prevMovesCount = gTempLocations[gTempIdx].steps.length;
    for (var idx = 0; idx < prevMovesCount; idx++) {
        var i = gTempLocations[gTempIdx].steps[idx].i;
        var j = gTempLocations[gTempIdx].steps[idx].j;

        var location = { i, j };
        var cell = gBoard[i][j];

        if (cell.isShown) {
            cell.isShown = false;
            gShownCount--;
        }
        if (cell.isMarked) {
            cell.isShown = false;
            cell.isMarked = false;
            gGame.markedCount++;
        }

        var cellSelector = '.' + getClassName(location);
        var elCell = document.querySelector(cellSelector);
        elCell.classList.add('covered');
        elCell.innerHTML = '';

        renderLives();
        renderFlags();
        renderBoard(gBoard)
        addNumColors()
    }
    gTempLocations.pop();
}

// WIP

function createNewWinnerStr() {
    var difficulty;
    switch (gLevel.MINES) {
        case 2:
            difficulty = 'Easy';
            break;
        case 12:
            difficulty = 'Normal';
            break;
        case 30:
            difficulty = 'Heroic';
            break;
    }
    var currScoreStr = localStorage.getItem(`Winners-${difficulty}`)
    var time = gSecsPassed;
    var name = prompt('Hero, What is your name?'); // 'Naphtali'; // add a prompt later
    var winner = `${name},${time},${difficulty};`

    if (!currScoreStr) {
        localStorage.setItem(`Winners-${difficulty}`, winner);
    } else {
        localStorage.setItem(`Winners-${difficulty}`, currScoreStr + winner);
    }
}

function organizeWinnersIntoArr(str) {
    var tempWinners = str.split(';');
    var winners = [];
    for (var i = 0; i < tempWinners.length; i++) {
        if (!tempWinners[i]) break;
        var currWinnerObj = {};
        var tempCurrWinner = tempWinners[i];
        tempCurrWinner = tempCurrWinner.split(',');
        currWinnerObj = { name: tempCurrWinner[0], time: tempCurrWinner[1], difficulty: tempCurrWinner[2] };
        winners.push(currWinnerObj);
    }
    sortWinners(winners)
    return winners;
}

function sortWinners(allWinners) {
    allWinners.sort(function(a, b) {
        return a.time - b.time
    });
    if (allWinners.length > 5) allWinners.pop();
}

function changeObjsToStr(objs) {
    var str = '';
    for (var i = 0; i < objs.length; i++) {
        str += `${objs[i].name},${objs[i].time},${objs[i].difficulty};`;
    }
    return str;
}

function renderWinners(difficulty) {
    var currStorage = localStorage.getItem(`Winners-${difficulty}`);
    if (!currStorage) return;

    var currWinners = organizeWinnersIntoArr(currStorage);
    var strHTML = `<tr>
                <td class="high-score-head">Name</td>
                <td class="high-score-head">Seconds</td>
                <td class="high-score-head">difficulty</td>
                </tr>`;
    for (var i = 0; i < currWinners.length; i++) {
        strHTML += '<tr>';
        for (var key in currWinners[i]) {
            var value = currWinners[i][key];
            strHTML += `<td class="high-score-cell">${value}</td>`;
        }
        strHTML += '</tr>';
    }

    var elHighScore = document.querySelector('.high-scores');
    elHighScore.innerHTML = strHTML;

    var winnersStr = changeObjsToStr(currWinners);
    localStorage.setItem(`Winners-${difficulty}`, winnersStr);
}