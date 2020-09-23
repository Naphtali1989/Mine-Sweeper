'use strict';


const MINE_BLACK = '<img src="imgs/mineblack.jpg">';
const MINE_RED = '<img src="imgs/minered.jpg">';
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



function initGame() {
    if (gGameInterval) clearInterval(gGameInterval);
    var elBtn = document.querySelector('.reset-game');
    elBtn.innerHTML = HAPPY;
    gGame = {
        life: 3,
        hint: 3,
        isHintActive: false,
        isOver: false,
        isOn: false,
        shownCount: 0,
        markedCount: gLevel.MINES,
        secsPassed: 0,
        face: HAPPY
    };

    gBoard = buildBoard();
    renderBoard(gBoard)
}

function changeDiff(size, mines) {
    gLevel.SIZE = size;
    gLevel.MINES = mines;
    initGame();
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
                isMarked: false
            };
        }
    }
    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        var row = board[i];
        strHTML += `<tr>`;
        for (var j = 0; j < row.length; j++) {
            // var cell = row[j];
            strHTML += `<td onmousedown="checkClick(this, event, ${i},
                         ${j})" class="covered cell cell-${i}-${j}">`;
            strHTML += `</td>`;
        }
    }
    strHTML += `</tr>`;

    var elField = document.querySelector('.mine-field');
    elField.innerHTML = strHTML;
}

function checkClick(elCell, ev, i, j) {
    if (gGame.isOver) return;

    if (gGame.isHintActive && gGame.hint > 0) {
        return revealNegs(gBoard, i, j); // WIP
    }

    if (!gGame.isOn) {
        gGameInterval = setInterval(showTimer, 1000);
        setMines(gBoard, i, j);
        gGame.isOn = true;
    }
    var cell = gBoard[i][j];
    if (cell.isShown) return;
    switch (ev.which) {
        case 1:
            cellClicked(elCell, i, j);
            break;
        case 3:
            cellMarked(elCell, i, j);
            break;
    }
    // checkGameOver(i, j);
}

function cellClicked(elCell, i, j) {
    // console.log('You left clicked me!');

    var elBtn = document.querySelector('.reset-game');
    elBtn.innerHTML = SHOCKED;
    setTimeout(function() {
        if (!gGame.isOver) elBtn.innerHTML = HAPPY;
    }, 200);


    var cell = gBoard[i][j];
    if (cell.isMarked) return;

    var location = { i: i, j: j };
    if (cell.isMine) {
        if (gGame.life === 0) renderCell(location, MINE_BLACK);
        if (gGame.life > 0) {
            gGame.life -= 1;
            var elLife = document.querySelector('.lives span');
            elLife.innerText = gGame.life
                // play sound?
            return;
        }
    } else if (cell.minesAroundCount > 0) {
        renderCell(location, cell.minesAroundCount);
    } else {
        renderEmptyCells(gBoard, i, j);
    }
    checkGameOver(i, j);

}

function cellMarked(elCell, i, j) {
    // console.log('You right clicked me!')

    var elFlagCounter = document.querySelector('.flags-left span');
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
    elFlagCounter.innerText = gGame.markedCount;
    if (cell.isMine && cell.isMarked) checkGameOver(i, j);
}



function checkGameOver(row, col) {
    console.log('Checking if the game ended');
    var location = { i: row, j: col };
    var elBtn = document.querySelector('.reset-game');
    if (!gBoard[row][col].isMarked && gBoard[row][col].isMine) {
        clearInterval(gGameInterval)
        console.log('GAME OVER!')
        gGame.isOver = true;
        renderExplodedBoard(gBoard, row, col)
        elBtn.innerHTML = SAD;

    }
    if (gGame.shownCount === ((gLevel.SIZE ** 2) - gLevel.MINES) &&
        gGame.markedCount === 0) {
        console.log('YOU WIN!!!!!!')
        clearInterval(gGameInterval)
        gGame.isOver = true;
        elBtn.innerHTML = WINNER;

    }
    return false;
}

function renderExplodedBoard(board, rowIdx, colIdx) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            if (cell.isMine) {
                var location = { i: i, j: j };
                renderCell(location, MINE_BLACK);
            }
        }
    }
    location = { i: rowIdx, j: colIdx };
    renderCell(location, MINE_RED);
}


function expandShown(board, elCell, i, j) {

}

function revealHint(el) { // WIP
    if (gGame.hint === 0) return
    var elHint = document.querySelector('.hints span')
    console.log('revealing a hint!');
    gGame.isHintActive = true;
    console.log('elHint is:', elHint);
    gGame.hint -= 1;

    return elHint.innerHTML = gGame.hint;
}