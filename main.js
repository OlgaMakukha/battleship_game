const gridSize = 10;//игровое поле
let shipLengths;
const gridArray = [];//[Array(gridSize) * 10]
let isGameStarted = false;
let difficulty;
let ships = [];

const difficultySettings = {
    beginner: {
        ships: [5, 4, 3, 2],
        touchingAllowed: false
    },
    intermediate: {
        ships: [5, 4, 3, 3, 2, 2],
        touchingAllowed: true
    },
    professional: {
        ships: [5, 4, 4, 3, 3, 2, 2, 2],
        touchingAllowed: true
    }
};

//функция для создания игрового поля
function createGrid(grid) {
    for (let i = 0; i < gridSize; i++) {
        const row = [];
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-item');
            cell.setAttribute('data-x', j);
            cell.setAttribute('data-y', i);
            grid.appendChild(cell);
            row.push(cell);
        }
        gridArray.push(row);
    }
}

//функция для размещения кораблей браузера на поле
function placeBrowserShips() {
    ships = [];
    for (const length of shipLengths) {
        let shipPlaced = false;
        while (!shipPlaced) {
            const horizontal = Math.random() < 0.5;//случайный выбор горизонтального или вертикального размещения корабля
            const xMax = horizontal ? gridSize - length : gridSize;
            const yMax = horizontal ? gridSize : gridSize - length;
            const x = Math.floor(Math.random() * xMax);
            const y = Math.floor(Math.random() * yMax);
            if (canPlaceShip(x, y, length, horizontal)) {
                const ship = placeShip(x, y, length, horizontal);
                ships.push(ship);
                shipPlaced = true;
            }
        }
    }
}

//функция для проверки возможности расположения корабля на поле
function canPlaceShip(x, y, length, horizontal) {
    if (x < 0 || x >= gridSize || y >= gridSize || y < 0) {
        return false;
    }
    if (horizontal && x + length > gridSize) {
        return false;
    } 
    if (!horizontal && y + length > gridSize) {
        return false;
    }
    const touchingAllowed = difficultySettings[difficulty].touchingAllowed;

    for (let i = -1; i <= length; i++) {
        for (let j = -1; j <= 1; j++) {
            const row = gridArray[y + (horizontal ? j : i)];
            if (!row) continue;
            const cell = row[x + (horizontal ? i : j)];
            if (cell && cell.classList.contains('ship')) {
                if (!touchingAllowed) return false;
                if (touchingAllowed && difficulty !== 'professional' && 
                    (i === -1 || i === length || j === -1 || j === 1)) {
                    return false;
                }
            }
        }
    }
    return true;
}

//функция для размещения корабля
function placeShip(x, y, length, horizontal) {
    const shipCells = [];
    for (let i = 0; i < length; i++) {
        if (horizontal) {
            gridArray[y][x + i].classList.add('ship');
            shipCells.push({x: x + i, y: y});
        } else {
            gridArray[y + i][x].classList.add('ship');
            shipCells.push({x: x, y: y + i});
        }
    }
    return {cells: shipCells, hits: 0};
}

//функция для отображения результатов вызова
function renderShortResults(x, y, result) {
    const cell = gridArray[y][x];
    cell.classList.add(result);
    cell.classList.add('shot');
    cell.removeEventListener('click', gridItemClick);
}

//функция для обработки клика по ячейке игрового поля
function gridItemClick(event) {
    if (isGameStarted) {
        const cell = event.target;
        const x = parseInt(cell.getAttribute('data-x'), 10);
        const y = parseInt(cell.getAttribute('data-y'), 10);
        if (!cell.classList.contains('ship')) {
            renderShortResults(x, y, 'miss');
        } else {
            renderShortResults(x, y, 'hit');
            const hitShip = ships.find(ship => ship.cells.some(c => c.x === x && c.y === y));
            hitShip.hits++;
            if (hitShip.hits === hitShip.cells.length) {
                sinkShip(hitShip);
            }
        }
        if (areBrowserShipsSunk()) {
            const victoryMessage = document.createElement('div');
            victoryMessage.textContent = 'Поздравляю, вы победили!';
            victoryMessage.classList.add('sink-message');
            document.body.appendChild(victoryMessage);

            setTimeout(() => {
                document.body.removeChild(victoryMessage);
                gridArray.forEach((row) => {
                    row.forEach((cell) => {
                        cell.classList.remove('shot', 'hit', 'miss', 'ship');
                    });
                });
                ships = [];
                isGameStarted = false;
            }, 2000);
        }
    }
}

//функция для потопленных кораблей
function sinkShip(ship) {
    const shipLength = ship.cells.length;
    markSurroundingCells(ship);
    showSinkMessage(shipLength);
}

//функция которая маркирует ячейки вокруг потопленного корабля
function markSurroundingCells(ship) {
    ship.cells.forEach(cell => {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = cell.x + dx;
                const y = cell.y + dy;
                if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                    const surroundingCell = gridArray[y][x];
                    if (!surroundingCell.classList.contains('hit') && !surroundingCell.classList.contains('ship')) {
                        renderShortResults(x, y, 'miss');
                    }
                }
            }
        }
    });
}

//функция которая показывает сообщение о потоплении корабля
function showSinkMessage(shipLength) {
    if (!areBrowserShipsSunk()) {
        const message = `Вы потопили корабль длиной ${shipLength}!`;
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.classList.add('sink-message');
        document.body.appendChild(messageElement);
    
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 2000);
    }
}

//функция которая проверяет остались ли на поле корабли 
function areBrowserShipsSunk() {
    let browserShipsLeft = 0;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = gridArray[i][j];
            if (cell.classList.contains('ship') && !cell.classList.contains('hit')) {
                browserShipsLeft++;
            }
        }
    }
    return browserShipsLeft === 0;
}

//функция которая устанавливает сложность
function setDifficulty(level) {
    difficulty = level;
    shipLengths = difficultySettings[level].ships;
}

function startBattleShipGame() {
    createGrid(document.getElementById('grid'));

    document.getElementById('startButton').addEventListener('click', () => {
        const difficultySelect = document.getElementById('difficultySelect');
        setDifficulty(difficultySelect.value);
        isGameStarted = true;

        const startMessage = document.createElement('div');
        startMessage.textContent = 'Игра началась';
        startMessage.classList.add('start-message');
        document.body.appendChild(startMessage);

        setTimeout(() => {
            document.body.removeChild(startMessage);
        }, 2000);

        gridArray.forEach((row) => {
            row.forEach((cell) => {
                cell.classList.remove('shot', 'hit', 'miss', 'ship');
                cell.addEventListener('click', gridItemClick);
            })
        })
        placeBrowserShips();
    });
}

startBattleShipGame();
