// 全域變數
let gameMode = 'numbers'; // 'numbers' or 'blocks'
const DURATION_NUMBERS = 30; 
const DURATION_BLOCKS = 30; // 滅燈模式給 30 秒

let timeRemaining = 0;
let score = 0;
let bestScoreNum = 0;
let bestScoreBlock = 0;
let bestScoreSchulte = 0;
let bestScoreColor = 0;
let timerInterval = null;
let gameActive = false;
let currentTarget = 0; // for numbers mode
let currentBlock = -1; // for blocks mode
let currentSchulteTarget = 1; // for schulte mode
let currentColorTarget = ''; // for color trap

let currentLevel = 1;
let startTime = 0;
let currentDuration = 30;
let blocksArray = [];
let blinkTimeout = null;
let colorRuleHistory = [];
let bwTimeout = null;
let currentBwType = ''; // 'black' or 'white'

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
    bestScoreSchulte: document.getElementById('best-score-schulte'),
    bestScoreColor: document.getElementById('best-score-color'),
    bestScoreBw: document.getElementById('best-score-bw'),
    countdown: document.getElementById('countdown-display'),
    time: document.getElementById('time-display'),
    score: document.getElementById('score-display'),
    targetNumber: document.getElementById('target-number'),
    schulteTarget: document.getElementById('schulte-target'),
    colorTargetWord: document.getElementById('color-target-word'),
    colorRuleText: document.getElementById('color-rule'),
    resultScore: document.getElementById('result-score'),
    resultModeLabel: document.getElementById('result-mode-label'),
    newRecordMsg: document.getElementById('new-record-msg'),
    evaluationMsg: document.getElementById('evaluation-msg')
};

const areas = {
    numbers: document.getElementById('game-numbers-area'),
    blocks: document.getElementById('game-blocks-area'),
    schulte: document.getElementById('game-schulte-area'),
    color: document.getElementById('game-color-area'),
    bw: document.getElementById('game-bw-area')
};

const mainContainer = document.getElementById('main-container');

const buttons = {
    modeSelections: document.querySelectorAll('.mode-btn'),
    restart: document.getElementById('btn-restart'),
    home: document.getElementById('btn-home'),
    options: document.querySelectorAll('.option-btn'),
    colorBtns: document.querySelectorAll('.color-btn')
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
    bestScoreSchulte = parseInt(localStorage.getItem('bestScoreSchulte') || '0', 10);
    bestScoreColor = parseInt(localStorage.getItem('bestScoreColor') || '0', 10);
    bestScoreBw = parseInt(localStorage.getItem('bestScoreBw') || '0', 10);
    displayElements.bestScoreNum.textContent = bestScoreNum;
    displayElements.bestScoreBlock.textContent = bestScoreBlock;
    displayElements.bestScoreSchulte.textContent = bestScoreSchulte;
    displayElements.bestScoreColor.textContent = bestScoreColor;
    displayElements.bestScoreBw.textContent = bestScoreBw;
}

function saveBestScore(mode, s) {
    if (mode === 'numbers') {
        localStorage.setItem('bestScoreNum', s);
        bestScoreNum = s;
        displayElements.bestScoreNum.textContent = s;
    } else if (mode === 'blocks') {
        localStorage.setItem('bestScoreBlock', s);
        bestScoreBlock = s;
        displayElements.bestScoreBlock.textContent = s;
    } else if (mode === 'schulte') {
        localStorage.setItem('bestScoreSchulte', s);
        bestScoreSchulte = s;
        displayElements.bestScoreSchulte.textContent = s;
    } else if (mode === 'color') {
        localStorage.setItem('bestScoreColor', s);
        bestScoreColor = s;
        displayElements.bestScoreColor.textContent = s;
    } else if (mode === 'bw') {
        localStorage.setItem('bestScoreBw', s);
        bestScoreBw = s;
        displayElements.bestScoreBw.textContent = s;
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
    
    // Color Trap 綁定
    buttons.colorBtns.forEach(btn => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleColorClick(btn); }, {passive: false});
        btn.addEventListener('mousedown', (e) => { if (e.button === 0) handleColorClick(btn); });
    });
    
    // BW Defense 綁定
    const bwBtn = document.getElementById('bw-btn');
    bwBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleBwClick(); }, {passive: false});
    bwBtn.addEventListener('mousedown', (e) => { if (e.button === 0) handleBwClick(); });
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
    
    const instructions = {
        numbers: "🎯 目標：在 30 秒內<br>從四個選項中找出上方指定的數字",
        blocks: "🎯 目標：在 30 秒內<br>盡可能點擊亮起的紅色方塊",
        schulte: "🎯 目標：在 30 秒內<br>睜大眼睛，按照 1～25 的順序依序點開",
        color: "⚠️ 陷阱警告：小心大腦當機！<br>必須嚴格遵守畫面頂端臨時決定的指示",
        bw: "⚠️ 防禦系統啟動：<br>看見「黑」牌【立刻點擊】<br>看見「白」牌【忍住不點】"
    };
    
    const instructionEl = document.getElementById('ready-instruction');
    if (instructionEl) {
        instructionEl.innerHTML = instructions[gameMode] || "";
    }
    
    // 切換顯示的遊戲區域
    areas.numbers.classList.add('hidden');
    areas.blocks.classList.add('hidden');
    areas.schulte.classList.add('hidden');
    areas.color.classList.add('hidden');
    areas.bw.classList.add('hidden');
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
    currentDuration = 30; // 30s as default for all modes
    timeRemaining = currentDuration;
    colorRuleHistory = [];
    
    if (blinkTimeout) clearTimeout(blinkTimeout);
    if (bwTimeout) clearTimeout(bwTimeout);
    
    displayElements.time.textContent = timeRemaining.toFixed(1);
    displayElements.time.classList.remove('warning');
    displayElements.score.textContent = score;
    
    if (gameMode === 'numbers') generateNumberQuestion();
    if (gameMode === 'blocks') startBlocksLevel(1);
    if (gameMode === 'schulte') startSchulteLevel();
    if (gameMode === 'color') generateColorQuestion();
    if (gameMode === 'bw') generateBwCard();
    
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

// ==== MODE 3: SCHULTE ====
function startSchulteLevel() {
    currentSchulteTarget = 1;
    displayElements.schulteTarget.textContent = currentSchulteTarget;
    
    const grid = document.getElementById('schulte-grid');
    grid.innerHTML = '';
    
    let numbers = [];
    for(let i=1; i<=25; i++) numbers.push(i);
    // Shuffle Array
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    numbers.forEach(num => {
        let btn = document.createElement('div');
        btn.classList.add('schulte-btn');
        btn.textContent = num;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleSchulteClick(btn, num); }, {passive: false});
        btn.addEventListener('mousedown', (e) => { if (e.button === 0) handleSchulteClick(btn, num); });
        grid.appendChild(btn);
    });
}

function handleSchulteClick(btn, num) {
    if (!gameActive || gameMode !== 'schulte') return;
    
    if (num === currentSchulteTarget) {
        score++;
        displayElements.score.textContent = score;
        playSuccessSound();
        
        btn.classList.add('correct');
        setTimeout(() => btn.classList.remove('correct'), 150);
        
        currentSchulteTarget++;
        // If they complete 1-25, keep score but reset grid to 1-25
        if (currentSchulteTarget > 25) {
            mainContainer.classList.add('success-flash');
            setTimeout(() => mainContainer.classList.remove('success-flash'), 200);
            startSchulteLevel();
        } else {
            displayElements.schulteTarget.textContent = currentSchulteTarget;
        }
    } else {
        triggerError();
    }
}

// ==== MODE 4: COLOR TRAP ====
const colorMapping = [
    { text: '紅', value: 'red', hex: '#ff3333' },
    { text: '藍', value: 'blue', hex: '#3388ff' },
    { text: '綠', value: 'green', hex: '#00cc66' },
    { text: '黃', value: 'yellow', hex: '#ffcc00' }
];

function generateColorQuestion() {
    let randomTextId = Math.floor(Math.random() * 4);
    let randomColorId = Math.floor(Math.random() * 4);
    
    // 70% 機率是陷阱（顏色與文字不符）
    if (Math.random() < 0.7) {
        let attempts = 0;
        while (randomColorId === randomTextId && attempts < 10) {
            randomColorId = Math.floor(Math.random() * 4);
            attempts++;
        }
    }
    
    let textObj = colorMapping[randomTextId];
    let colorObj = colorMapping[randomColorId];
    
    displayElements.colorTargetWord.textContent = textObj.text;
    displayElements.colorTargetWord.style.color = colorObj.hex;
    
    // 隨機決定目前的規則（防止連續出現三次相同規則，打破人類對偽規律的錯覺）
    let ruleIsMeaning;
    if (colorRuleHistory.length >= 2 && colorRuleHistory[0] === colorRuleHistory[1]) {
        ruleIsMeaning = !(colorRuleHistory[0] === 'meaning');
    } else {
        ruleIsMeaning = Math.random() < 0.5;
    }
    
    colorRuleHistory.push(ruleIsMeaning ? 'meaning' : 'color');
    if (colorRuleHistory.length > 2) colorRuleHistory.shift();
    
    if (ruleIsMeaning) {
        displayElements.colorRuleText.textContent = "點擊「字義」";
        displayElements.colorRuleText.style.color = "#ff3333";
        displayElements.colorRuleText.style.borderColor = "#ff3333";
        displayElements.colorRuleText.style.boxShadow = "0 0 15px rgba(255,51,51,0.6)";
        currentColorTarget = textObj.value; // 答案是文字本身的意義
    } else {
        displayElements.colorRuleText.textContent = "點擊「顏色」";
        displayElements.colorRuleText.style.color = "#00f0ff";
        displayElements.colorRuleText.style.borderColor = "#00f0ff";
        displayElements.colorRuleText.style.boxShadow = "0 0 15px rgba(0,240,255,0.6)";
        currentColorTarget = colorObj.value; // 答案是真實墨水的顏色
    }
    
    // reset animation
    displayElements.colorTargetWord.style.animation = 'none';
    void displayElements.colorTargetWord.offsetWidth;
    displayElements.colorTargetWord.style.animation = 'target-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
}

function handleColorClick(btn) {
    if (!gameActive || gameMode !== 'color') return;
    const clickedColor = btn.getAttribute('data-color');
    if (clickedColor === currentColorTarget) {
        score++;
        displayElements.score.textContent = score;
        playSuccessSound();
        mainContainer.classList.add('success-flash');
        setTimeout(() => mainContainer.classList.remove('success-flash'), 100);
        generateColorQuestion();
    } else {
        triggerError(); // 按錯自動扣一秒
    }
}

// ==== MODE 5: BLack White Defense ====
function generateBwCard() {
    if (bwTimeout) clearTimeout(bwTimeout);
    
    // 動態調整給予玩家反應的時間 (人類對於「選擇與辨識」的反應極限約為 400~500ms)
    // 我們將後期的極限放寬一些，避免玩家真的按下去了卻被系統判定「太慢超時」而扣分
    let speed = 1000;
    if (score >= 50) speed = 500;
    else if (score >= 35) speed = 600;
    else if (score >= 20) speed = 750;
    else speed = 900;
    
    // 60% 黑 (必須點), 40% 白 (必須忍住)
    let isBlack = Math.random() < 0.6;
    currentBwType = isBlack ? 'black' : 'white';
    
    const btn = document.getElementById('bw-btn');
    btn.textContent = isBlack ? '黑' : '白';
    
    if (isBlack) {
        btn.classList.remove('card-white');
        btn.classList.add('card-black');
    } else {
        btn.classList.remove('card-black');
        btn.classList.add('card-white');
    }
    
    // Reset animation
    btn.style.animation = 'none';
    void btn.offsetWidth;
    btn.style.animation = 'target-pop 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    
    bwTimeout = setTimeout(() => {
        if (!gameActive) return;
        if (currentBwType === 'black') {
            // 沒點到黑色，扣秒
            triggerError();
            generateBwCard();
        } else {
            // 成功忍住沒點白色，得分！
            score++;
            displayElements.score.textContent = score;
            playSuccessSound();
            generateBwCard();
        }
    }, speed);
}

function handleBwClick() {
    if (!gameActive || gameMode !== 'bw') return;
    
    if (currentBwType === 'black') {
        // 點對黑色
        score++;
        displayElements.score.textContent = score;
        playSuccessSound();
        mainContainer.classList.add('success-flash');
        setTimeout(() => mainContainer.classList.remove('success-flash'), 100);
        generateBwCard();
    } else {
        // 誤點白色
        triggerError();
        generateBwCard();
    }
}

function triggerError() {
    if (!gameActive) return;
    
    currentDuration -= 1; // 按錯扣 1 秒
    
    const elapsed = (performance.now() - startTime) / 1000;
    timeRemaining = Math.max(0, currentDuration - elapsed);
    displayElements.time.textContent = timeRemaining.toFixed(1);
    
    displayElements.time.classList.add('warning');
    
    playErrorSound();
    mainContainer.classList.add('error-shake');
    setTimeout(() => mainContainer.classList.remove('error-shake'), 400);
}

// ==== END GAME ====
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    if (blinkTimeout) clearTimeout(blinkTimeout);
    if (bwTimeout) clearTimeout(bwTimeout);
    playGameOverSound();
    
    displayElements.resultScore.textContent = score;
    displayElements.resultModeLabel.textContent = 
        (gameMode === 'numbers') ? '數字模式得分' : 
        (gameMode === 'blocks') ? '滅燈方塊得分' : 
        (gameMode === 'schulte') ? '舒爾特得分' : 
        (gameMode === 'color') ? '色彩陷阱得分' : '黑白防禦得分';
    
    // 根據分數給予評語
    let evalText = "";
    if (gameMode === 'numbers' || gameMode === 'color') {
        if (score >= 40) evalText = "神級反應！你是外星人吧！ 👽";
        else if (score >= 30) evalText = "太厲害了！神經傳導速度超越常人！ ⚡";
        else if (score >= 20) evalText = "表現不錯！反應速度非常快！ 👏";
        else if (score >= 10) evalText = "有潛力！再暖身一下一定能破表！ 💪";
        else evalText = "剛睡醒嗎？慢慢來，多玩幾次手感就會來了！ 😴";
    } else if (gameMode === 'blocks') {
        if (score >= 200) evalText = "反應之神！人類動態視力的極限！ 👑";
        else if (score >= 140) evalText = "超越極限！閃電般的反應速度！（抵達第四關） ⚡";
        else if (score >= 80) evalText = "高手境界！眼睛跟得上每一次閃爍！（抵達第三關） 🚀";
        else if (score >= 30) evalText = "不錯喔！熱身完畢，準備迎接真正的挑戰！（抵達第二關） 👏";
        else evalText = "剛睡醒嗎？多練幾次手感就會來了！ 😴";
    } else if (gameMode === 'schulte') {
        if (score >= 60) evalText = "主宰宇宙的專注力！你一定是天才！ 🪐";
        else if (score >= 40) evalText = "神級視野！你的周邊視覺超乎常人！ 🦅";
        else if (score >= 25) evalText = "超越常人！順利突破第一輪！ 👀";
        else if (score >= 15) evalText = "表現優良！多練習能掌握整體節奏！ 📘";
        else evalText = "眼睛花了嗎？放鬆一下再來挑戰！ 😵‍💫";
    } else if (gameMode === 'bw') {
        if (score >= 60) evalText = "絕對防禦！你的煞車神經無懈可擊！ 🛡️";
        else if (score >= 45) evalText = "超強定力！黑白分明毫不猶豫！ 👁️";
        else if (score >= 30) evalText = "反應出眾！成功抵抗大腦的衝動！ 🧠";
        else if (score >= 15) evalText = "不錯喔！再冷靜一點分數會更高！ ❄️";
        else evalText = "是不是看到什麼就想點？太衝動啦！ 💥";
    }
    
    displayElements.evaluationMsg.textContent = evalText;
    
    let isNewRecord = false;
    if (gameMode === 'numbers' && score > bestScoreNum) {
        isNewRecord = true;
        saveBestScore('numbers', score);
    } else if (gameMode === 'blocks' && score > bestScoreBlock) {
        isNewRecord = true;
        saveBestScore('blocks', score);
    } else if (gameMode === 'schulte' && score > bestScoreSchulte) {
        isNewRecord = true;
        saveBestScore('schulte', score);
    } else if (gameMode === 'color' && score > bestScoreColor) {
        isNewRecord = true;
        saveBestScore('color', score);
    } else if (gameMode === 'bw' && score > bestScoreBw) {
        isNewRecord = true;
        saveBestScore('bw', score);
    }
    
    if (isNewRecord) {
        displayElements.newRecordMsg.classList.remove('hidden');
    } else {
        displayElements.newRecordMsg.classList.add('hidden');
    }
    
    switchScreen('result');
}

window.onload = init;
