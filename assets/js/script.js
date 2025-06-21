// script.js

// --- Game Definitions ---
const CELL_SIZE = 20; // tamanho de cada célula (bloco) em pixels
const BOARD_WIDTH_CELLS = 10; // largura do tabuleiro em células
const BOARD_HEIGHT_CELLS = 20; // altura do tabuleiro em células

// calcula a largura e altura da janela (canvas) em pixels
const WINDOW_WIDTH_PIXELS = BOARD_WIDTH_CELLS * CELL_SIZE;
const WINDOW_HEIGHT_PIXELS = BOARD_HEIGHT_CELLS * CELL_SIZE;

let board = []; // representa o tabuleiro do jogo (matriz)

// cores para as peças RGBA
const colors = {
    I: [0, 255, 255, 255],   // ciano
    O: [255, 255, 0, 255],   // amarelo
    T: [128, 0, 128, 255],   // roxo
    S: [0, 255, 0, 255],     // verde
    Z: [255, 0, 0, 255],     // vermelho
    J: [0, 0, 255, 255],     // azul
    L: [255, 165, 0, 255]    // laranja
};

// formas das peças (matrizes, 1 para bloco, 0 para vazio)
const shapes = {
    I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // peça I horizontal
    O: [[1,1], [1,1]],                               // peça O (2x2)
    T: [[0,1,0], [1,1,1], [0,0,0]],
    S: [[0,1,1], [1,1,0], [0,0,0]],
    Z: [[1,1,0], [0,1,1], [0,0,0]],
    J: [[0,0,1], [1,1,1], [0,0,0]],
    L: [[1,0,0], [1,1,1], [0,0,0]]
};

let currentPiece = null;
let nextPiece = null;
let pieceX = 0; // posição x da peça no tabuleiro (0-based)
let pieceY = 0; // posição y da peça no tabuleiro (0-based)

let dropTimer = 0;
const dropInterval = 0.5; // tempo em segundos para a peça cair

// variáveis para o canvas
let canvas;
let ctx;
let lastTime = 0; // para calcular o delta time (dt)

// --- Game Functions ---

/**
 * Inicializa o jogo: configura o canvas, o tabuleiro e as peças.
 */
function initGame() {
    // 1. Obter o elemento canvas e seu contexto 2D
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 2. Definir o tamanho do canvas
    canvas.width = WINDOW_WIDTH_PIXELS;
    canvas.height = WINDOW_HEIGHT_PIXELS;

    // 3. Inicializar o tabuleiro vazio
    for (let y = 0; y < BOARD_HEIGHT_CELLS; y++) {
        board[y] = [];
        for (let x = 0; x < BOARD_WIDTH_CELLS; x++) {
            board[y][x] = 0; // 0 para vazio, cor da peça para preenchido
        }
    }

    // 4. Gerar a primeira peça
    spawnNewPiece();
    nextPiece = getRandomPiece();

    // 5. Iniciar o loop do jogo
    requestAnimationFrame(gameLoop);
}

/**
 * Loop principal do jogo.
 * @param {DOMHighResTimeStamp} currentTime O tempo atual do navegador.
 */
function gameLoop(currentTime) {
    // calcula o delta time (dt) em segundos
    const dt = (currentTime - lastTime) / 1000; // converte milissegundos para segundos
    lastTime = currentTime;

    // atualiza a lógica do jogo
    update(dt);
    // desenha os elementos na tela
    draw();

    // solicita o próximo frame
    requestAnimationFrame(gameLoop);
}

/**
 * Lógica de atualização do jogo (substitui love.update).
 * @param {number} dt Delta time em segundos.
 */
function update(dt) {
    dropTimer += dt;

    if (dropTimer >= dropInterval) {
        movePiece(0, 1); // tenta mover a peça para baixo
        dropTimer = 0;
    }
}

/**
 * Função de desenho (substitui love.draw).
 */
function draw() {
    // limpa o canvas a cada frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // desenha o tabuleiro com os blocos fixos
    for (let y = 0; y < BOARD_HEIGHT_CELLS; y++) {
        for (let x = 0; x < BOARD_WIDTH_CELLS; x++) {
            if (board[y][x] !== 0) {
                // define a cor do bloco fixo
                const color = board[y][x];
                ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

                // desenha a borda do bloco
                ctx.strokeStyle = `rgba(0, 0, 0, 1)`; // cor da borda preta
                ctx.lineWidth = 1;
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // desenha a peça atual
    if (currentPiece) {
        const shape = shapes[currentPiece.type];
        const pieceColor = colors[currentPiece.type];
        ctx.fillStyle = `rgba(${pieceColor[0]}, ${pieceColor[1]}, ${pieceColor[2]}, ${pieceColor[3] / 255})`;

        for (let sy = 0; sy < shape.length; sy++) { // sy é a linha dentro da forma da peça (0-based)
            for (let sx = 0; sx < shape[sy].length; sx++) { // sx é a coluna dentro da forma da peça (0-based)
                if (shape[sy][sx] === 1) {
                    // pieceX/Y é a origem da peça no tabuleiro (0-based)
                    // sx/sy é a posição do bloco dentro da forma (0-based)
                    const drawX = (pieceX + sx) * CELL_SIZE;
                    const drawY = (pieceY + sy) * CELL_SIZE;

                    ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
                    ctx.strokeStyle = `rgba(0, 0, 0, 1)`; // cor da borda preta
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    // desenha a grade do tabuleiro
    ctx.strokeStyle = `rgba(50, 50, 50, 1)`; // cor cinza escuro para a grade
    ctx.lineWidth = 1;

    // linhas verticais
    for (let x_pixel = 0; x_pixel <= WINDOW_WIDTH_PIXELS; x_pixel += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x_pixel, 0);
        ctx.lineTo(x_pixel, WINDOW_HEIGHT_PIXELS);
        ctx.stroke();
    }
    // linhas horizontais
    for (let y_pixel = 0; y_pixel <= WINDOW_HEIGHT_PIXELS; y_pixel += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y_pixel);
        ctx.lineTo(WINDOW_WIDTH_PIXELS, y_pixel);
        ctx.stroke();
    }
}

/**
 * Lida com a entrada do teclado.
 * @param {KeyboardEvent} event O evento do teclado.
 */
function handleKeyPress(event) {
    switch (event.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            dropTimer = 0; // reseta o timer para queda mais rápida
            break;
        case 'ArrowUp':
        case 'x':
            rotatePiece();
            break;
    }
}

/**
 * Gera uma nova peça aleatória.
 * @returns {object} Um objeto representando a peça (tipo e rotação).
 */
function getRandomPiece() {
    const pieceTypes = ["I", "J", "L", "O", "S", "T", "Z"];
    const randomIndex = Math.floor(Math.random() * pieceTypes.length);
    return {
        type: pieceTypes[randomIndex],
        rotation: 0 // rotação inicial
    };
}

/**
 * Faz o "spawn" de uma nova peça no topo do tabuleiro.
 */
function spawnNewPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();

    // centraliza a peça.
    const pieceShape = shapes[currentPiece.type];
    pieceX = Math.floor((BOARD_WIDTH_CELLS - pieceShape[0].length) / 2);
    pieceY = 0; // peças começam na linha 0 do tabuleiro (topo)

    // Game Over: se a peça já nasce colidindo
    if (checkCollision(currentPiece, pieceX, pieceY)) {
        alert("Game Over!");
        // reinicia o jogo ou exibe uma tela de game over
        initGame(); // para simplificar, reinicia o jogo
    }
}

/**
 * Move a peça no tabuleiro.
 * @param {number} dx Deslocamento no eixo X.
 * @param {number} dy Deslocamento no eixo Y.
 */
function movePiece(dx, dy) {
    const newX = pieceX + dx;
    const newY = pieceY + dy;

    // se a nova posição NÃO CAUSA colisão, move a peça.
    if (!checkCollision(currentPiece, newX, newY)) {
        pieceX = newX;
        pieceY = newY;
    } else {
        // se colidiu, e o movimento era para baixo (dy > 0), a peça deve ser fixada.
        if (dy > 0) {
            lockPiece();
            clearLines();
            spawnNewPiece();
        }
    }
}

/**
 * Rotaciona a peça no sentido horário.
 */
function rotatePiece() {
    const originalShape = shapes[currentPiece.type];
    const n = originalShape.length; // assumindo que a peça é quadrada (n x n)
    const newShape = Array(n).fill(0).map(() => Array(n).fill(0));

    // lógica de rotação 90 graus no sentido horário
    // (row, col) original se torna (col, n - 1 - row) na nova matriz
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            newShape[x][n - 1 - y] = originalShape[y][x];
        }
    }

    // temporariamente aplica a nova forma para checar colisão
    const tempOriginalShape = shapes[currentPiece.type];
    shapes[currentPiece.type] = newShape;

    // verifica colisão após a rotação
    if (checkCollision(currentPiece, pieceX, pieceY)) {
        // se colidiu, tenta ajustar a posição (simples "wall kick")
        // tenta mover para a esquerda, depois para a direita, depois para cima
        if (!checkCollision(currentPiece, pieceX - 1, pieceY)) {
            pieceX--;
        } else if (!checkCollision(currentPiece, pieceX + 1, pieceY)) {
            pieceX++;
        } else if (!checkCollision(currentPiece, pieceX, pieceY - 1)) { // tenta mover para cima (útil para rotações em espaços apertados)
            pieceY--;
        }
        else {
            // se nenhuma tentativa de ajuste funcionou, reverte a rotação
            shapes[currentPiece.type] = tempOriginalShape;
        }
    }
}

/**
 * Verifica colisão de uma peça em uma dada posição.
 * @param {object} piece A peça a ser verificada.
 * @param {number} x A possível nova posição X da peça no tabuleiro (0-based).
 * @param {number} y A possível nova posição Y da peça no tabuleiro (0-based).
 * @returns {boolean} True se houver colisão, false caso contrário.
 */
function checkCollision(piece, x, y) {
    const shape = shapes[piece.type];

    for (let sy = 0; sy < shape.length; sy++) { // sy é a linha dentro da forma da peça (0-based)
        for (let sx = 0; sx < shape[sy].length; sx++) { // sx é a coluna dentro da forma da peça (0-based)
            if (shape[sy][sx] === 1) { // se há um bloco nesta parte da forma da peça
                const boardX = x + sx; // calcula a coordenada X no tabuleiro (0-based)
                const boardY = y + sy; // calcula a coordenada Y no tabuleiro (0-based)

                // verifica colisão com as bordas do tabuleiro
                if (boardX < 0 || boardX >= BOARD_WIDTH_CELLS ||
                    boardY >= BOARD_HEIGHT_CELLS) {
                    return true; // colidiu com uma borda
                }

                // serifica colisão com o topo do tabuleiro (onde a peça pode estar fora)
                // se boardY < 0, a peça está acima do tabuleiro, então não colide com blocos fixos
                if (boardY >= 0 && board[boardY][boardX] !== 0) {
                    return true; // colidiu com um bloco já existente
                }
            }
        }
    }
    return false; // nenhuma colisão detectada
}

/**
 * Fixa a peça atual no tabuleiro.
 */
function lockPiece() {
    const shape = shapes[currentPiece.type];
    const pieceColor = colors[currentPiece.type];

    for (let sy = 0; sy < shape.length; sy++) {
        for (let sx = 0; sx < shape[sy].length; sx++) {
            if (shape[sy][sx] === 1) {
                const boardX = pieceX + sx;
                const boardY = pieceY + sy;
                // garante que só se fixa blocos dentro dos limites válidos do tabuleiro
                if (boardY >= 0 && boardY < BOARD_HEIGHT_CELLS &&
                    boardX >= 0 && boardX < BOARD_WIDTH_CELLS) {
                    board[boardY][boardX] = pieceColor;
                }
            }
        }
    }
}

/**
 * Remove linhas completas do tabuleiro e move as linhas acima para baixo.
 */
function clearLines() {
    let linesCleared = 0;
    // itera de baixo para cima (do último índice para o primeiro)
    for (let y = BOARD_HEIGHT_CELLS - 1; y >= 0; y--) {
        let lineFull = true;
        for (let x = 0; x < BOARD_WIDTH_CELLS; x++) {
            if (board[y][x] === 0) { // se algum bloco estiver vazio, a linha não está completa
                lineFull = false;
                break;
            }
        }

        if (lineFull) {
            linesCleared++;
            // move todas as linhas acima para baixo
            // começa da linha atual 'y' e vai subindo até a segunda linha (índice 1)
            for (let moveY = y; moveY > 0; moveY--) {
                for (let x = 0; x < BOARD_WIDTH_CELLS; x++) {
                    board[moveY][x] = board[moveY - 1][x];
                }
            }
            // limpa a primeira linha (topo do tabuleiro)
            for (let x = 0; x < BOARD_WIDTH_CELLS; x++) {
                board[0][x] = 0;
            }
            // reajusta o índice 'y' para re-verificar a mesma nova linha
            // que agora contém o conteúdo da linha acima
            y++;
        }
    }
    // TODO: Implementar pontuação com base em 'linesCleared'
    if (linesCleared > 0) {
        console.log(`Linhas removidas: ${linesCleared}`);
    }
}

// --- Event Listeners ---
// adiciona o listener para teclas pressionadas
document.addEventListener('keydown', handleKeyPress);

// inicia o jogo quando a página estiver totalmente carregada
window.onload = initGame;
