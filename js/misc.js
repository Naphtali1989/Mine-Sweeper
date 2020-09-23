'use strict';

var gFirstClick = {};

function showTimer() {
    gGame.secsPassed += 1;
    var elTimer = document.querySelector('.timer span');
    elTimer.innerText = gGame.secsPassed;
}

function getRandEmptyCell() {
    var rowIdx = getRandomInt(0, gLevel.SIZE);
    var colIdx = getRandomInt(0, gLevel.SIZE);
    var tempCell = gBoard[rowIdx][colIdx];
    if (tempCell.isMine || (gFirstClick.i === rowIdx && gFirstClick.j === colIdx)) return getRandEmptyCell();
    else {
        return { i: rowIdx, j: colIdx };
    }
}

function renderCell(location, value) {
    var cell = gBoard[location.i][location.j];
    var cellSelector = '.' + getClassName(location);
    var elCell = document.querySelector(cellSelector);
    elCell.classList.remove('covered');
    elCell.innerHTML = value;
    if (!cell.isShown) gGame.shownCount += 1;
    cell.isShown = true;
}



function setMines(board, rowIdx, colIdx) {
    console.log('setting Mines!');
    var minesToPlace = gLevel.MINES;
    while (minesToPlace > 0) {
        gFirstClick = { i: rowIdx, j: colIdx }
        var randEmptyCell = getRandEmptyCell();
        board[randEmptyCell.i][randEmptyCell.j].isMine = true;
        minesToPlace--;
    }
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            gBoard[i][j].minesAroundCount = setMinesNegsCount(board, i, j);
        }
    }
}

function renderEmptyCells(board, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            var cell = board[i][j];
            var location = { i: i, j: j };
            if (cell.isMarked) continue;
            if (!cell.isMine && cell.minesAroundCount > 0) {
                renderCell(location, cell.minesAroundCount);
            } else {
                renderCell(location, '');
                // return renderEmptyCells(board, i, j)
            }
        }
    }
}

function revealNegs(board, rowIdx, colIdx) { // WIP
    gGame.isHintActive = false;
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            var cell = board[i][j];
            if (cell.isShown) continue;
            var location = { i: i, j: j };
            if (cell.isMine) {
                revealCell(location, MINE_BLACK);
            } else if (cell.minesAroundCount > 0) {
                revealCell(location, cell.minesAroundCount);
            } else {
                revealCell(location, '');
            }
            console.log('lets see what does inside - is the cell shown?:', cell.isShown)

            setTimeout(unRevealNegs, 1000, board, rowIdx, colIdx);
        }
    }
}

function revealCell(location, value) {
    var cellSelector = '.' + getClassName(location);
    var elCell = document.querySelector(cellSelector);
    elCell.classList.remove('covered');
    elCell.innerHTML = value;
}

function unRevealNegs(board, rowIdx, colIdx) { // WIP
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            var cell = board[i][j];
            if (cell.isShown) continue;
            var location = { i: i, j: j };
            var cellSelector = '.' + getClassName(location);
            var elCell = document.querySelector(cellSelector);
            elCell.innerHTML = '';
            elCell.classList.add('covered');
        }
    }
}