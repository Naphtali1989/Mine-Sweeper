'use strict';

const LIVES = '<img src="imgs/life.png">';
const HINTS_ON = '<img src="imgs/bulbon.png">';
const HINTS_OFF = '<img src="imgs/bulboff.png">';

const MINE_BLACK = '<img src="imgs/mineblack.png">';
const MINE_RED = '<img src="imgs/minered.png">';
const FLAG = '<img src="imgs/flag.png">';

const HAPPY = '<img src="imgs/happy.png">';
const SAD = '<img src="imgs/sad.png">';
const SHOCKED = '<img src="imgs/shocked.png">';
const WINNER = '<img src="imgs/winner.png">';

var gBoard = [];
var gLevel = {
    SIZE: 4,
    MINES: 2
};
var gGame = {};
var gGameInterval;
var gNextId = 101;



function initGame() {
    if (gGameInterval) clearInterval(gGameInterval);
    var elBtn = document.querySelector('.reset-game');
    elBtn.innerHTML = HAPPY;
    gGame = {
        isOver: false,
        isOn: false,
        isManual: false,
        lifesCount: 3,
        hintsCount: 3,
        safeClickCount: 3,
        isHintActive: false,
        isSafeOn: false,
        shownCount: 0,
        minesToPlace: gLevel.MINES,
        markedCount: gLevel.MINES,
        secsPassed: 0,
        face: HAPPY
    };
    gNextId = 101
    gBoard = buildBoard();
    renderBoard(gBoard);
    renderLives();
    renderHints();
    renderFlags();
    showTimer();
    var elSafeClick = document.querySelector('.safe-click span');
    elSafeClick.innerText = gGame.safeClickCount;
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
}

function cellClicked(elCell, i, j) {

    var elBtn = document.querySelector('.reset-game');
    elBtn.innerHTML = SHOCKED;
    setTimeout(function() {
        if (!gGame.isOver) elBtn.innerHTML = HAPPY;
    }, 200);

    var cell = gBoard[i][j];
    if (cell.isMarked) return;

    if (gGame.isHintActive && gGame.hintsCount > 0) {
        gGame.hintsCount -= 1;
        return revealNegs(gBoard, i, j);
    }

    var location = { i: i, j: j };
    if (cell.isMine) {
        if (gGame.lifesCount === 0) renderCellShown(location, MINE_BLACK);
        if (gGame.lifesCount > 0) {
            gGame.lifesCount -= 1;
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

    if (!cell.isMarked) {
        if (gGame.markedCount < 1) return;
        elCell.innerHTML = FLAG;
        gGame.markedCount -= 1;
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
    if (gGame.shownCount === ((gLevel.SIZE ** 2) - gLevel.MINES) &&
        gGame.markedCount === 0) {
        clearInterval(gGameInterval)
        gGame.isOver = true;
        elBtn.innerHTML = WINNER;
        playVictorySound();
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
    if (!gGame.isOn || gGame.hintsCount < 0 || gGame.isHintActive) return
    gGame.isHintActive = true;
    renderHints();
}

function randomizeSafeBlock() {
    if (!gGame.isOn ||
        gGame.isSafeOn ||
        gGame.isOver ||
        gGame.safeClickCount === 0 ||
        gGame.shownCount === (gLevel.SIZE ** 2) - gLevel.MINES
    ) return;

    var safeSpot = getRandEmptyCell();

    gGame.isSafeOn = true;
    gGame.safeClickCount -= 1;

    var elSafeClick = document.querySelector('.safe-click span');
    elSafeClick.innerText = gGame.safeClickCount;

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
    gGame.isManual = true;
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
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard.length; j++) {
                gBoard[i][j].minesAroundCount = setMinesNegsCount(gBoard, i, j);
            }
        }
        toggleManualMode();
        gGameInterval = setInterval(showTimer, 1000);
        addNumColors();
        gGame.isOn = true;
    }
}

function undo() {
    console.log('Undoing!')
        // WIP
}