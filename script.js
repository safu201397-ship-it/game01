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

let currentLevel = 1;
let startTime = 0;
let currentDuration = 30;
let blocksArray = [];
let blinkTimeout = null;

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
    options: document.querySelectorAll('.option-btn')
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
    currentLevel = 1;
    currentDuration = (gameMode === 'numbers') ? DURATION_NUMBERS : DURATION_BLOCKS;
    timeRemaining = currentDuration;
    
    if (blinkTimeout) clearTimeout(blinkTimeout);
    
    displayElements.time.textContent = timeRemaining.toFixed(1);
    displayElements.time.classList.remove('warning');
    displayElements.score.textContent = score;
    
    if (gameMode === 'numbers') generateNumberQuestion();
    if (gameMode === 'blocks') startBlocksLevel(1);
    
    const notice = document.getElementById('level-notice');
    if (notice) notice.classList.add('hidden');
    
    switchScreen('play');
    
    startTime = performance.now();
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        timeRemaining = Math.max(0, currentDuration - elapsed);
        
        displayElements.time.textContent = timeRemaining.toFixed(1);
        if (timeRemaining <= 5 && !displayElements.time.classList.contains('warning')) {
            displayElements.time.classList.add('warning');
        }
        if (timeRemaining <= 0) {
            if (gameMode === 'blocks') {
                if (currentLevel === 1 && score >= 30) advanceToLevel(2);
                else if (currentLevel === 2 && score >= 80) advanceToLevel(3);
                else if (currentLevel === 3 && score >= 140) advanceToLevel(4);
                else endGame();
            } else {
                endGame();
            }
        }
    }, 50);
}

function advanceToLevel(level) {
    currentLevel = level;
    currentDuration = 30;
    timeRemaining = currentDuration;
    startTime = performance.now();
    
    displayElements.time.classList.remove('warning');
    
    const notice = document.getElementById('level-notice');
    if (notice) {
        notice.classList.remove('hidden');
        notice.textContent = 'LEVEL ' + level;
        notice.style.animation = 'none';
        void notice.offsetWidth;
        notice.style.animation = 'level-up-pop 1.5s forwards';
    }
    
    mainContainer.classList.add('success-flash');
    setTimeout(() => mainContainer.classList.remove('success-flash'), 500);
    playSuccessSound();
    
    if (blinkTimeout) clearTimeout(blinkTimeout);
    
    startBlocksLevel(level);
}

function startBlocksLevel(level) {
    let numBlocks = level === 1 ? 6 : 9;
    let cols = level === 1 ? 2 : 3;
    
    const blocksGrid = document.getElementById('blocks-grid');
    blocksGrid.innerHTML = '';
    blocksGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    blocksArray = [];
    currentBlock = -1;
    for(let i=0; i<numBlocks; i++) {
        let btn = document.createElement('div');
        btn.classList.add('block-btn');
        btn.dataset.bindex = i;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleBlockClick(i); }, {passive: false});
        btn.addEventListener('mousedown', (e) => { if (e.button === 0) handleBlockClick(i); });
        blocksGrid.appendChild(btn);
        blocksArray.push(btn);
    }
    
    generateNextBlock();
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
    blocksArray.forEach(b => b.classList.remove('active-target'));
    if (blinkTimeout) clearTimeout(blinkTimeout);
    
    let nextBlock;
    let numBlocks = blocksArray.length;
    do {
        nextBlock = Math.floor(Math.random() * numBlocks);
    } while (nextBlock === currentBlock); // 確保不與上個位置重複
    
    currentBlock = nextBlock;
    blocksArray[currentBlock].classList.add('active-target');

    // 閃爍機制
    if (currentLevel === 3) {
        blinkTimeout = setTimeout(() => {
            if (gameActive) generateNextBlock();
        }, 1000);
    } else if (currentLevel >= 4) {
        blinkTimeout = setTimeout(() => {
            if (gameActive) generateNextBlock();
        }, 500);
    }
}

function handleBlockClick(idx) {
    if (!gameActive || gameMode !== 'blocks') return;
    
    if (idx === currentBlock) {
        score += currentLevel; // L1: 1, L2: 2, L3: 3, L4: 4
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
    if (blinkTimeout) clearTimeout(blinkTimeout);
    playGameOverSound();
    
    displayElements.resultScore.textContent = score;
    displayElements.resultModeLabel.textContent = (gameMode === 'numbers') ? '數字模式得分' : '滅燈方塊得分';
    
    // 根據分數給予評語
    let evalText = "";
    if (gameMode === 'numbers') {
        if (score >= 40) evalText = "神級反應！你是外星人吧！ 👽";
        else if (score >= 30) evalText = "太厲害了！神經傳導速度超越常人！ ⚡";
        else if (score >= 20) evalText = "表現不錯！反應速度非常快！ 👏";
        else if (score >= 10) evalText = "有潛力！再暖身一下一定能破表！ 💪";
        else evalText = "剛睡醒嗎？慢慢來，多玩幾次手感就會來了！ 😴";
    } else {
        if (score >= 200) evalText = "反應之神！人類動態視力的極限！ 👑";
        else if (score >= 140) evalText = "超越極限！閃電般的反應速度！（抵達第四關） ⚡";
        else if (score >= 80) evalText = "高手境界！眼睛跟得上每一次閃爍！（抵達第三關） 🚀";
        else if (score >= 30) evalText = "不錯喔！熱身完畢，準備迎接真正的挑戰！（抵達第二關） 👏";
        else evalText = "剛睡醒嗎？多練幾次手感就會來了！ 😴";
    }
    
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
