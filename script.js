// 全域變數
let gameMode = 'numbers'; // 'numbers' or 'blocks'
const DURATION_NUMBERS = 30; 
const DURATION_BLOCKS = 30; // 滅燈模式給 30 秒

let timeRemaining = 0;
let score = 0;
let bestScoreNum = 0;
let bestScoreBlock = 0;
let timerInterval = null;
let gameActive = false;
let currentTarget = 0; // for numbers mode
let currentBlock = -1; // for blocks mode

// DOM
const screens = {
    start: document.getElementById('screen-start'),
    ready: document.getElementById('screen-ready'),
    play: document.getElementById('screen-play'),
    result: document.getElementById('screen-result')
};

const displayElements = {
    bestScoreNum: document.getElementById('best-score-num'),
    bestScoreBlock: document.getElementById('best-score-block'),
    countdown: document.getElementById('countdown-display'),
    time: document.getElementById('time-display'),
    score: document.getElementById('score-display'),
    targetNumber: document.getElementById('target-number'),
    resultScore: document.getElementById('result-score'),
    resultModeLabel: document.getElementById('result-mode-label'),
    newRecordMsg: document.getElementById('new-record-msg'),
    evaluationMsg: document.getElementById('evaluation-msg')
};

const areas = {
    numbers: document.getElementById('game-numbers-area'),
    blocks: document.getElementById('game-blocks-area')
};

const mainContainer = document.getElementById('main-container');

const buttons = {
    modeSelections: document.querySelectorAll('.mode-btn'),
    restart: document.getElementById('btn-restart'),
    home: document.getElementById('btn-home'),
    options: document.querySelectorAll('.option-btn'),
    blocks: document.querySelectorAll('.block-btn')
};

// 音效引擎
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSuccessSound() {
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playErrorSound() {
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playGameOverSound() {
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.8);
    
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

function init() {
    loadBestScores();
    bindEvents();
    switchScreen('start');
}

function loadBestScores() {
    bestScoreNum = parseInt(localStorage.getItem('bestScoreNum') || '0', 10);
    bestScoreBlock = parseInt(localStorage.getItem('bestScoreBlock') || '0', 10);
    displayElements.bestScoreNum.textContent = bestScoreNum;
    displayElements.bestScoreBlock.textContent = bestScoreBlock;
}

function saveBestScore(mode, s) {
    if (mode === 'numbers') {
        localStorage.setItem('bestScoreNum', s);
        bestScoreNum = s;
        displayElements.bestScoreNum.textContent = s;
    } else {
        localStorage.setItem('bestScoreBlock', s);
        bestScoreBlock = s;
        displayElements.bestScoreBlock.textContent = s;
    }
}

function bindEvents() {
    buttons.modeSelections.forEach(btn => {
        btn.addEventListener('click', () => {
            gameMode = btn.getAttribute('data-mode');
            initAudio();
            startReadyPhase();
        });
    });
    
    // 主選單與重啟按鈕
    buttons.restart.addEventListener('click', () => startReadyPhase());
    buttons.home.addEventListener('click', () => switchScreen('start'));
    
    // Numbers Mode 按鈕綁定
    buttons.options.forEach(btn => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleNumberClick(btn); }, {passive: false});
        btn.addEventListener('mousedown', (e) => { if (e.button === 0) handleNumberClick(btn); });
    });
    
    // Blocks Mode 按鈕綁定
    buttons.blocks.forEach((btn, idx) => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleBlockClick(idx); }, {passive: false});
        btn.addEventListener('mousedown', (e) => { if (e.button === 0) handleBlockClick(idx); });
    });
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if(screens[screenName]) {
        screens[screenName].classList.add('active');
    }
}

function startReadyPhase() {
    switchScreen('ready');
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    
    // 切換顯示的遊戲區域
    areas.numbers.classList.add('hidden');
    areas.blocks.classList.add('hidden');
    if (areas[gameMode]) {
        areas[gameMode].classList.remove('hidden');
    }
    
    let count = 3;
    displayElements.countdown.textContent = count;
    displayElements.countdown.classList.remove('countdown-anim');
    void displayElements.countdown.offsetWidth;
    displayElements.countdown.classList.add('countdown-anim');
    
    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            displayElements.countdown.textContent = count;
            displayElements.countdown.classList.remove('countdown-anim');
            void displayElements.countdown.offsetWidth;
            displayElements.countdown.classList.add('countdown-anim');
        } else {
            clearInterval(countInterval);
            displayElements.countdown.textContent = 'GO!';
            displayElements.countdown.classList.remove('countdown-anim');
            void displayElements.countdown.offsetWidth;
            displayElements.countdown.classList.add('countdown-anim');
            setTimeout(startGame, 500);
        }
    }, 1000);
}

function startGame() {
    score = 0;
    gameActive = true;
    timeRemaining = (gameMode === 'numbers') ? DURATION_NUMBERS : DURATION_BLOCKS;
    
    displayElements.time.textContent = timeRemaining.toFixed(1);
    displayElements.time.classList.remove('warning');
    displayElements.score.textContent = score;
    
    if (gameMode === 'numbers') generateNumberQuestion();
    if (gameMode === 'blocks') generateNextBlock();
    
    switchScreen('play');
    
    const startTime = performance.now();
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const dur = (gameMode === 'numbers') ? DURATION_NUMBERS : DURATION_BLOCKS;
        timeRemaining = Math.max(0, dur - elapsed);
        
        displayElements.time.textContent = timeRemaining.toFixed(1);
        if (timeRemaining <= 5 && !displayElements.time.classList.contains('warning')) {
            displayElements.time.classList.add('warning');
        }
        if (timeRemaining <= 0) endGame();
    }, 50);
}

// ==== MODE 1: NUMBERS ====
function generateNumberQuestion() {
    currentTarget = Math.floor(Math.random() * 100);
    let options = [currentTarget];
    while (options.length < 4) {
        let rng = Math.floor(Math.random() * 100);
        if (!options.includes(rng)) options.push(rng);
    }
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    displayElements.targetNumber.textContent = currentTarget;
    displayElements.targetNumber.classList.remove('target-num');
    void displayElements.targetNumber.offsetWidth;
    displayElements.targetNumber.classList.add('target-num');
    buttons.options.forEach((btn, index) => btn.textContent = options[index]);
}

function handleNumberClick(btn) {
    if (!gameActive || gameMode !== 'numbers') return;
    const clickedVal = parseInt(btn.textContent, 10);
    if (clickedVal === currentTarget) {
        score++;
        displayElements.score.textContent = score;
        playSuccessSound();
        mainContainer.classList.add('success-flash');
        setTimeout(() => mainContainer.classList.remove('success-flash'), 150);
        generateNumberQuestion();
    } else {
        triggerError();
    }
}

// ==== MODE 2: BLOCKS ====
function generateNextBlock() {
    // 移除現有的紅燈
    buttons.blocks.forEach(b => b.classList.remove('active-target'));
    
    let nextBlock;
    do {
        nextBlock = Math.floor(Math.random() * 6);
    } while (nextBlock === currentBlock); // 確保不與上個位置重複
    
    currentBlock = nextBlock;
    buttons.blocks[currentBlock].classList.add('active-target');
}

function handleBlockClick(idx) {
    if (!gameActive || gameMode !== 'blocks') return;
    
    if (idx === currentBlock) {
        score++;
        displayElements.score.textContent = score;
        playSuccessSound();
        mainContainer.classList.add('success-flash');
        setTimeout(() => mainContainer.classList.remove('success-flash'), 100);
        generateNextBlock();
    } else {
        triggerError();
    }
}

function triggerError() {
    playErrorSound();
    mainContainer.classList.add('error-shake');
    setTimeout(() => mainContainer.classList.remove('error-shake'), 400);
}

// ==== END GAME ====
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    playGameOverSound();
    
    displayElements.resultScore.textContent = score;
    displayElements.resultModeLabel.textContent = (gameMode === 'numbers') ? '數字模式得分' : '滅燈方塊得分';
    
    // 根據分數給予評語
    let evalText = "";
    if (score >= 60) evalText = "神級反應！你是外星人吧！ 👽";
    else if (score >= 45) evalText = "太厲害了！神經傳導速度超越常人！ ⚡";
    else if (score >= 30) evalText = "表現不錯！反應速度非常快！ 👏";
    else if (score >= 15) evalText = "有潛力！再暖身一下一定能破表！ 💪";
    else evalText = "剛睡醒嗎？慢慢來，多玩幾次手感就會來了！ 😴";
    
    displayElements.evaluationMsg.textContent = evalText;
    
    let isNewRecord = false;
    if (gameMode === 'numbers' && score > bestScoreNum) {
        isNewRecord = true;
        saveBestScore('numbers', score);
    } else if (gameMode === 'blocks' && score > bestScoreBlock) {
        isNewRecord = true;
        saveBestScore('blocks', score);
    }
    
    if (isNewRecord) {
        displayElements.newRecordMsg.classList.remove('hidden');
    } else {
        displayElements.newRecordMsg.classList.add('hidden');
    }
    
    switchScreen('result');
}

window.onload = init;
