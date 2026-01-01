// 企鹅猜词 - 主要逻辑
// 高级毛玻璃圆角扁平风格猜词游戏 - 完全重构版

class WordGuessingGame {
    constructor() {
        // 游戏状态
        this.targetWord = '';
        this.wordLength = 5; // 默认5位
        this.availableLengths = []; // 词库中实际存在的单词长度
        this.currentAttempt = 1;
        this.maxAttempts = 12;
        this.attemptsHistory = []; // 当前游戏的尝试历史
        this.gameHistory = []; // 所有游戏的历史记录
        this.bestRecord = localStorage.getItem('penguinWordGuessBestRecord') || null;
        this.wordList = [];
        this.filteredWordList = []; // 根据长度筛选后的词库
        this.letterStates = {}; // 记录每个字母的状态: correct, present, absent, unknown
        this.currentInput = [];
        this.currentFocusIndex = 0; // 当前聚焦的输入框索引
        
        // 候选字母状态
        this.positionStates = []; // 每个位置的可能字母和排除字母
        this.candidateLetters = new Set(); // 可能的候选字母集合
        
        // DOM 元素
        this.elements = {
            // 头部信息
            wordLength: document.getElementById('word-length'),
            attemptCount: document.getElementById('attempt-count'),
            bestRecord: document.getElementById('best-record'),
            wordCount: document.getElementById('word-count'),
            currentAttempt: document.getElementById('current-attempt'),
            
            // 字母状态面板
            letterStatus: document.getElementById('letter-status'),
            toggleLetters: document.getElementById('toggle-letters'),
            
            // 候选字母面板
            candidatePanel: document.getElementById('candidate-panel'),
            positionHintRow: document.getElementById('position-hint-row'),
            candidateLetters: document.getElementById('candidate-letters'),
            
            // 控制区域
            inputRow: document.querySelector('.input-row'),
            feedbackRow: document.querySelector('.feedback-row'),
            checkBtn: document.getElementById('check-btn'),
            hintBtn: document.getElementById('hint-btn'),
            revealBtn: document.getElementById('reveal-btn'),
            newGameBtn: document.getElementById('new-game-btn'),
            messageArea: document.getElementById('message'),
            
            // 历史推理记录
            historyContainer: document.getElementById('history-container'),
            historyCount: document.getElementById('history-count'),
            
            // 右栏组件
            historyList: document.getElementById('history-list'),
            lengthOptions: document.querySelector('.length-options'),
            clearHistory: document.getElementById('clear-history'),
            toggleTheme: document.getElementById('toggle-theme'),
            keyboardHelp: document.getElementById('keyboard-help'),
            shareGame: document.getElementById('share-game'),
            toggleHelp: document.getElementById('toggle-help'),
            toggleAbout: document.getElementById('toggle-about'),
            
            // 模态框
            answerModal: document.getElementById('answer-modal'),
            winModal: document.getElementById('win-modal'),
            hintModal: document.getElementById('hint-modal'),
            keyboardHelpModal: document.getElementById('keyboard-help-modal'),
            helpModal: document.getElementById('help-modal'),
            aboutModal: document.getElementById('about-modal'),
            answerWord: document.getElementById('answer-word'),
            winWord: document.getElementById('win-word'),
            winAttempts: document.getElementById('win-attempts'),
            newRecord: document.getElementById('new-record'),
            confirmReveal: document.getElementById('confirm-reveal'),
            playAgain: document.getElementById('play-again'),
            shareResult: document.getElementById('share-result')
        };
        
        // 隐藏输入框用于移动端
        this.hiddenInput = null;
        
        // 初始化
        this.init();
    }
    
    // 初始化游戏
    init() {
        this.initLetterStates();
        this.setupMobileInput();
        this.bindEvents();
        this.loadWordList();
        this.loadGameHistory();
        this.loadThemePreference();
    }
    
    // 初始化字母状态
    initLetterStates() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        for (let letter of alphabet) {
            this.letterStates[letter] = 'unknown';
        }
    }
    
    // 初始化位置状态
    initPositionStates() {
        this.positionStates = [];
        this.candidateLetters.clear();
        
        for (let i = 0; i < this.wordLength; i++) {
            this.positionStates.push({
                correctLetter: '', // 已确认的正确字母
                possibleLetters: new Set('abcdefghijklmnopqrstuvwxyz'.split('')), // 可能出现在此位置的字母
                excludedLetters: new Set() // 不可能出现在此位置的字母
            });
        }
    }
    
    // 设置移动端输入
    setupMobileInput() {
        this.hiddenInput = document.createElement('input');
        this.hiddenInput.type = 'text';
        this.hiddenInput.style.position = 'fixed';
        this.hiddenInput.style.top = '-100px';
        this.hiddenInput.style.left = '0';
        this.hiddenInput.style.width = '1px';
        this.hiddenInput.style.height = '1px';
        this.hiddenInput.style.opacity = '0.01';
        this.hiddenInput.autocapitalize = 'none';
        this.hiddenInput.autocorrect = 'off';
        this.hiddenInput.spellcheck = false;
        this.hiddenInput.inputmode = 'text';
        
        document.body.appendChild(this.hiddenInput);
        
        // 处理输入事件
        let lastInputTime = 0;
        this.hiddenInput.addEventListener('input', (e) => {
            const now = Date.now();
            if (now - lastInputTime < 50) return;
            lastInputTime = now;
            
            const value = e.target.value.toLowerCase();
            if (value && /^[a-z]$/.test(value)) {
                this.addLetterToInput(value, this.currentFocusIndex);
                
                if (this.currentFocusIndex < this.wordLength - 1) {
                    setTimeout(() => {
                        this.focusInputAtIndex(this.currentFocusIndex + 1);
                    }, 50);
                }
            }
            
            e.target.value = '';
        });
        
        // 处理键盘事件
        this.hiddenInput.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            if (key === 'backspace') {
                e.preventDefault();
                this.removeLetterFromInput(this.currentFocusIndex);
                
                if (!this.currentInput[this.currentFocusIndex] && this.currentFocusIndex > 0) {
                    setTimeout(() => {
                        this.focusInputAtIndex(this.currentFocusIndex - 1);
                    }, 50);
                }
            } else if (key === 'enter') {
                e.preventDefault();
                this.checkGuess();
            } else if (key === 'arrowleft' && this.currentFocusIndex > 0) {
                e.preventDefault();
                this.focusInputAtIndex(this.currentFocusIndex - 1);
            } else if (key === 'arrowright' && this.currentFocusIndex < this.wordLength - 1) {
                e.preventDefault();
                this.focusInputAtIndex(this.currentFocusIndex + 1);
            }
        });
    }
    
    // 绑定事件
    bindEvents() {
        // 控制按钮
        this.elements.checkBtn.addEventListener('click', () => this.checkGuess());
        this.elements.hintBtn.addEventListener('click', () => this.showModal(this.elements.hintModal));
        this.elements.revealBtn.addEventListener('click', () => this.showAnswerModal());
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        
        // 字母面板切换
        this.elements.toggleLetters.addEventListener('click', () => this.toggleLetterPanel());
        
        // 右栏按钮
        this.elements.clearHistory.addEventListener('click', () => this.clearHistory());
        this.elements.toggleTheme.addEventListener('click', () => this.toggleTheme());
        this.elements.keyboardHelp.addEventListener('click', () => this.showModal(this.elements.keyboardHelpModal));
        this.elements.shareGame.addEventListener('click', () => this.shareGame());
        this.elements.toggleHelp.addEventListener('click', () => this.showModal(this.elements.helpModal));
        this.elements.toggleAbout.addEventListener('click', () => this.showModal(this.elements.aboutModal));
        
        // 模态框关闭按钮
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // 取消按钮
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // 确认查看答案
        this.elements.confirmReveal.addEventListener('click', () => this.revealAnswer());
        
        // 再玩一次
        this.elements.playAgain.addEventListener('click', () => {
            this.closeAllModals();
            this.startNewGame();
        });
        
        // 分享结果
        this.elements.shareResult.addEventListener('click', () => this.shareResult());
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 点击外部关闭模态框
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // 点击页面其他区域移除焦点
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('letter-input')) {
                this.removeAllFocusStyles();
                if (this.hiddenInput) {
                    this.hiddenInput.blur();
                }
            }
        });
    }
    
    // 加载词库
    async loadWordList() {
        try {
            const response = await fetch('words.txt');
            if (!response.ok) throw new Error('词库文件加载失败');
            
            const text = await response.text();
            this.wordList = text.split('\n')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length >= 3 && word.length <= 12 && /^[a-z]+$/.test(word));
            
            if (this.wordList.length === 0) {
                throw new Error('词库为空');
            }
            
            console.log(`成功加载词库，共 ${this.wordList.length} 个单词`);
            this.elements.wordCount.textContent = this.wordList.length;
            
            // 检测可用单词长度
            this.detectAvailableLengths();
            
            // 创建单词长度选择器
            this.createLengthSelector();
            
            // 开始游戏
            this.startNewGame();
            
        } catch (error) {
            console.warn(error.message, '，使用内置词库');
            this.loadDefaultWordList();
        }
    }
    
    // 加载默认词库
    loadDefaultWordList() {
        const defaultWords = [
            'apple', 'brain', 'chair', 'dance', 'earth', 'flame', 'grape', 'heart', 'igloo', 'jelly',
            'knife', 'lemon', 'music', 'night', 'ocean', 'piano', 'queen', 'river', 'smile', 'table',
            'umbra', 'voice', 'water', 'xerox', 'yacht', 'zebra', 'actor', 'beach', 'cloud', 'drama',
            'eagle', 'fruit', 'ghost', 'hotel', 'image', 'joker', 'kitty', 'light', 'magic', 'north',
            'opera', 'panda', 'quiet', 'robot', 'sunny', 'tiger', 'unity', 'vivid', 'world', 'young'
        ];
        
        this.wordList = defaultWords;
        this.elements.wordCount.textContent = defaultWords.length;
        
        this.detectAvailableLengths();
        this.createLengthSelector();
        this.startNewGame();
        
        this.showMessage('使用内置词库，共' + defaultWords.length + '个单词', 'info');
    }
    
    // 检测可用单词长度
    detectAvailableLengths() {
        if (this.wordList.length === 0) return;
        
        const lengthsSet = new Set(this.wordList.map(word => word.length));
        this.availableLengths = Array.from(lengthsSet).sort((a, b) => a - b);
        
        // 如果当前长度不在可用长度中，选择第一个可用长度
        if (!this.availableLengths.includes(this.wordLength)) {
            this.wordLength = this.availableLengths[0];
        }
        
        console.log(`可用单词长度: ${this.availableLengths.join(', ')}`);
    }
    
    // 创建单词长度选择器
    createLengthSelector() {
        this.elements.lengthOptions.innerHTML = '';
        
        this.availableLengths.forEach(length => {
            const button = document.createElement('button');
            button.className = `length-option ${length === this.wordLength ? 'selected' : ''}`;
            button.textContent = length;
            button.dataset.length = length;
            
            button.addEventListener('click', () => {
                const newLength = parseInt(button.dataset.length);
                if (newLength !== this.wordLength) {
                    this.wordLength = newLength;
                    this.filterWordListByLength();
                    this.startNewGame();
                    
                    // 更新按钮状态
                    document.querySelectorAll('.length-option').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    button.classList.add('selected');
                }
            });
            
            this.elements.lengthOptions.appendChild(button);
        });
    }
    
    // 根据长度筛选词库
    filterWordListByLength() {
        if (this.wordList.length === 0) return;
        
        this.filteredWordList = this.wordList.filter(word => word.length === this.wordLength);
        
        if (this.filteredWordList.length === 0) {
            console.warn(`没有找到 ${this.wordLength} 个字母的单词，自动调整长度`);
            
            // 找到最接近的可用长度
            let closestLength = this.availableLengths[0];
            let minDiff = Math.abs(this.wordLength - closestLength);
            
            for (const length of this.availableLengths) {
                const diff = Math.abs(this.wordLength - length);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestLength = length;
                }
            }
            
            this.wordLength = closestLength;
            this.filteredWordList = this.wordList.filter(word => word.length === this.wordLength);
            
            // 更新选择器
            document.querySelectorAll('.length-option').forEach(btn => {
                btn.classList.remove('selected');
                if (parseInt(btn.dataset.length) === this.wordLength) {
                    btn.classList.add('selected');
                }
            });
        }
        
        console.log(`已筛选出 ${this.filteredWordList.length} 个 ${this.wordLength} 字母的单词`);
    }
    
    // 开始新游戏
    startNewGame() {
        // 确保词库已筛选
        if (this.filteredWordList.length === 0) {
            this.filterWordListByLength();
        }
        
        // 选择随机单词
        const randomIndex = Math.floor(Math.random() * this.filteredWordList.length);
        this.targetWord = this.filteredWordList[randomIndex];
        
        // 重置游戏状态
        this.currentAttempt = 1;
        this.attemptsHistory = [];
        this.currentInput = new Array(this.wordLength).fill('');
        this.currentFocusIndex = 0;
        
        // 重置字母状态
        this.initLetterStates();
        this.initPositionStates();
        
        // 更新UI
        this.updateGameInfo();
        this.createLetterStatusGrid();
        this.createInputRow();
        this.clearHistoryContainer();
        this.updateCandidatePanel();
        this.updateCheckButton();
        this.closeAllModals();
        this.removeAllFocusStyles();
        
        // 显示消息
        this.showMessage(`新游戏开始！目标单词有 ${this.wordLength} 个字母。`, 'info');
        
        // 调试信息
        console.log('目标单词:', this.targetWord, `(${this.wordLength}字母)`);
    }
    
    // 更新游戏信息
    updateGameInfo() {
        this.elements.wordLength.textContent = this.wordLength;
        this.elements.attemptCount.textContent = this.currentAttempt - 1;
        this.elements.bestRecord.textContent = this.bestRecord ? this.bestRecord : '-';
        this.elements.currentAttempt.textContent = this.currentAttempt;
    }
    
    // 创建字母状态网格
    createLetterStatusGrid() {
        this.elements.letterStatus.innerHTML = '';
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        
        for (let letter of alphabet) {
            const letterDiv = document.createElement('div');
            letterDiv.className = `letter-item letter-${this.letterStates[letter]}`;
            letterDiv.textContent = letter;
            letterDiv.dataset.letter = letter;
            
            letterDiv.addEventListener('click', () => {
                if (!this.isCurrentRowFull()) {
                    const emptyIndex = this.currentInput.findIndex(char => char === '');
                    if (emptyIndex !== -1) {
                        this.addLetterToInput(letter, emptyIndex);
                        this.focusInputAtIndex(emptyIndex);
                    }
                }
            });
            
            this.elements.letterStatus.appendChild(letterDiv);
        }
    }
    
    // 创建输入行
    createInputRow() {
        this.elements.inputRow.innerHTML = '';
        this.elements.feedbackRow.innerHTML = '';
        
        for (let i = 0; i < this.wordLength; i++) {
            // 创建字母输入框
            const inputCell = document.createElement('div');
            inputCell.className = `letter-input ${this.currentInput[i] ? 'filled' : 'empty'}`;
            inputCell.textContent = this.currentInput[i] || '';
            inputCell.dataset.index = i;
            
            inputCell.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.focusInputAtIndex(i);
            });
            
            this.elements.inputRow.appendChild(inputCell);
            
            // 创建反馈框
            const feedbackCell = document.createElement('div');
            feedbackCell.className = 'feedback-item';
            feedbackCell.dataset.index = i;
            this.elements.feedbackRow.appendChild(feedbackCell);
        }
    }
    
    // 聚焦到指定索引的输入框
    focusInputAtIndex(index) {
        this.currentFocusIndex = index;
        this.updateFocusStyles();
        
        setTimeout(() => {
            if (this.hiddenInput) {
                this.hiddenInput.focus();
            }
        }, 10);
    }
    
    // 更新焦点样式
    updateFocusStyles() {
        const inputCells = document.querySelectorAll('.letter-input');
        inputCells.forEach((cell, index) => {
            cell.classList.remove('focused');
            if (index === this.currentFocusIndex) {
                cell.classList.add('focused');
            }
        });
    }
    
    // 移除所有焦点样式
    removeAllFocusStyles() {
        document.querySelectorAll('.letter-input.focused').forEach(input => {
            input.classList.remove('focused');
        });
    }
    
    // 添加字母到输入
    addLetterToInput(letter, index) {
        // 从当前索引开始填充，覆盖后面的字母
        for (let i = index; i < this.wordLength; i++) {
            this.currentInput[i] = i === index ? letter : '';
        }
        
        this.updateInputRow();
        this.updateCheckButton();
    }
    
    // 从输入中删除字母
    removeLetterFromInput(index) {
        if (this.currentInput[index]) {
            this.currentInput[index] = '';
        } else if (index > 0) {
            this.currentInput[index - 1] = '';
        }
        
        this.updateInputRow();
        this.updateCheckButton();
    }
    
    // 更新输入行显示
    updateInputRow() {
        const inputCells = document.querySelectorAll('.letter-input');
        inputCells.forEach((cell, index) => {
            const letter = this.currentInput[index];
            cell.textContent = letter || '';
            cell.className = `letter-input ${letter ? 'filled' : 'empty'}`;
        });
        
        this.updateFocusStyles();
    }
    
    // 更新检查按钮状态
    updateCheckButton() {
        const isRowFull = this.isCurrentRowFull();
        this.elements.checkBtn.disabled = !isRowFull;
        this.elements.checkBtn.classList.toggle('active', isRowFull);
    }
    
    // 检查当前行是否已填满
    isCurrentRowFull() {
        return this.currentInput.every(letter => letter !== '');
    }
    
    // 处理键盘事件
    handleKeydown(e) {
        const key = e.key.toLowerCase();
        
        if (key === 'escape') {
            this.closeAllModals();
            return;
        }
        
        if (document.querySelector('.modal.active')) {
            return;
        }
        
        if (/^[a-z]$/.test(key)) {
            const emptyIndex = this.currentInput.findIndex(char => char === '');
            if (emptyIndex !== -1) {
                this.addLetterToInput(key, emptyIndex);
                this.focusInputAtIndex(emptyIndex);
                
                if (emptyIndex < this.wordLength - 1) {
                    setTimeout(() => {
                        this.focusInputAtIndex(emptyIndex + 1);
                    }, 10);
                }
            }
        } else if (key === 'enter') {
            e.preventDefault();
            this.checkGuess();
        } else if (key === 'arrowleft' && this.currentFocusIndex > 0) {
            this.focusInputAtIndex(this.currentFocusIndex - 1);
        } else if (key === 'arrowright' && this.currentFocusIndex < this.wordLength - 1) {
            this.focusInputAtIndex(this.currentFocusIndex + 1);
        }
    }
    
    // 检查猜测
    checkGuess() {
        if (!this.isCurrentRowFull()) {
            this.showMessage('请填满所有字母后再检查！', 'warning');
            return;
        }
        
        const guess = this.currentInput.join('');
        const feedback = this.validateGuess(guess);
        
        // 添加到当前游戏历史
        this.attemptsHistory.push({
            attempt: this.currentAttempt,
            word: guess,
            feedback: feedback
        });
        
        // 更新字母状态
        this.updateLetterStates(guess, feedback);
        
        // 更新位置状态和候选字母
        this.updatePositionStates(guess, feedback);
        
        // 添加历史推理记录（新记录在顶部）
        this.addHistoryRecord(guess, feedback);
        
        // 检查是否获胜
        const isWin = feedback.every(f => f === 'correct');
        
        if (isWin) {
            this.handleWin();
        } else {
            // 准备下一轮
            this.currentAttempt++;
            
            if (this.currentAttempt > this.maxAttempts) {
                this.handleLoss();
                return;
            }
            
            // 重置当前输入
            this.currentInput = new Array(this.wordLength).fill('');
            this.createInputRow();
            this.updateGameInfo();
            this.updateCheckButton();
            this.removeAllFocusStyles();
            
            this.showMessage(`继续尝试！你已经尝试了 ${this.currentAttempt - 1} 次。`, 'info');
            
            setTimeout(() => {
                this.focusInputAtIndex(0);
            }, 100);
        }
    }
    
    // 验证猜测
    validateGuess(guess) {
        const feedback = new Array(this.wordLength).fill('absent');
        const targetLetters = this.targetWord.split('');
        const guessLetters = guess.split('');
        
        // 第一遍：标记正确位置
        for (let i = 0; i < this.wordLength; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                feedback[i] = 'correct';
                targetLetters[i] = null;
                guessLetters[i] = null;
            }
        }
        
        // 第二遍：标记错误位置但存在
        for (let i = 0; i < this.wordLength; i++) {
            if (guessLetters[i] !== null) {
                const indexInTarget = targetLetters.indexOf(guessLetters[i]);
                if (indexInTarget !== -1) {
                    feedback[i] = 'present';
                    targetLetters[indexInTarget] = null;
                }
            }
        }
        
        return feedback;
    }
    
    // 更新字母状态
    updateLetterStates(guess, feedback) {
        const guessLetters = guess.split('');
        
        for (let i = 0; i < guessLetters.length; i++) {
            const letter = guessLetters[i];
            const state = feedback[i];
            
            if (this.letterStates[letter] === 'correct') {
                continue;
            }
            
            if (state === 'correct') {
                this.letterStates[letter] = 'correct';
            } else if (state === 'present' && this.letterStates[letter] !== 'correct') {
                this.letterStates[letter] = 'present';
            } else if (state === 'absent' && 
                     this.letterStates[letter] !== 'correct' && 
                     this.letterStates[letter] !== 'present') {
                this.letterStates[letter] = 'absent';
            }
        }
        
        this.createLetterStatusGrid();
    }
    
    // 更新位置状态和候选字母
    updatePositionStates(guess, feedback) {
        const guessLetters = guess.split('');
        
        for (let i = 0; i < guessLetters.length; i++) {
            const letter = guessLetters[i];
            const state = feedback[i];
            const positionState = this.positionStates[i];
            
            if (state === 'correct') {
                // 确认此位置就是该字母
                positionState.correctLetter = letter;
                positionState.possibleLetters.clear();
                positionState.possibleLetters.add(letter);
                
                // 添加到候选字母
                this.candidateLetters.add(letter);
                
            } else if (state === 'present') {
                // 该字母存在于单词中，但不在这个位置
                positionState.excludedLetters.add(letter);
                positionState.possibleLetters.delete(letter);
                
                // 添加到候选字母
                this.candidateLetters.add(letter);
                
            } else if (state === 'absent') {
                // 该字母不存在于单词中
                for (let j = 0; j < this.wordLength; j++) {
                    this.positionStates[j].possibleLetters.delete(letter);
                    this.positionStates[j].excludedLetters.add(letter);
                }
            }
        }
        
        this.updateCandidatePanel();
    }
    
    // 更新候选字母面板
    updateCandidatePanel() {
        // 更新位置提示行
        this.elements.positionHintRow.innerHTML = '';
        
        for (let i = 0; i < this.wordLength; i++) {
            const positionCell = document.createElement('div');
            positionCell.className = 'position-cell';
            
            const state = this.positionStates[i];
            if (state.correctLetter) {
                positionCell.textContent = state.correctLetter;
                positionCell.classList.add('correct-position');
            } else {
                positionCell.textContent = '_';
                positionCell.classList.add('unknown-position');
            }
            
            this.elements.positionHintRow.appendChild(positionCell);
        }
        
        // 更新候选字母
        const candidateGrid = this.elements.candidateLetters.querySelector('.candidate-letter-grid');
        if (!candidateGrid) return;
        
        candidateGrid.innerHTML = '';
        
        // 按字母顺序排序
        const sortedCandidates = Array.from(this.candidateLetters).sort();
        
        if (sortedCandidates.length === 0) {
            candidateGrid.innerHTML = '<div class="no-candidates">暂无候选字母</div>';
        } else {
            sortedCandidates.forEach(letter => {
                const letterDiv = document.createElement('div');
                letterDiv.className = 'candidate-letter';
                letterDiv.textContent = letter;
                
                if (this.letterStates[letter] === 'correct') {
                    letterDiv.classList.add('candidate-correct');
                } else if (this.letterStates[letter] === 'present') {
                    letterDiv.classList.add('candidate-present');
                }
                
                candidateGrid.appendChild(letterDiv);
            });
        }
    }
    
    // 添加历史推理记录（新记录在顶部）
    addHistoryRecord(guess, feedback) {
        const historyRecord = document.createElement('div');
        historyRecord.className = 'history-record';
        
        // 记录头部
        const recordHeader = document.createElement('div');
        recordHeader.className = 'record-header';
        
        const recordNumber = document.createElement('div');
        recordNumber.className = 'record-number';
        recordNumber.textContent = `尝试 #${this.currentAttempt}`;
        
        const recordWord = document.createElement('div');
        recordWord.className = 'record-word';
        recordWord.textContent = guess;
        
        recordHeader.appendChild(recordNumber);
        recordHeader.appendChild(recordWord);
        
        // 字母行
        const letterRow = document.createElement('div');
        letterRow.className = 'record-row';
        
        // 反馈行
        const feedbackRow = document.createElement('div');
        feedbackRow.className = 'record-row';
        
        for (let i = 0; i < this.wordLength; i++) {
            const letter = guess[i];
            
            // 字母单元格
            const letterCell = document.createElement('div');
            letterCell.className = 'record-letter';
            letterCell.textContent = letter;
            letterRow.appendChild(letterCell);
            
            // 反馈单元格
            const feedbackCell = document.createElement('div');
            feedbackCell.className = 'record-feedback';
            
            const state = feedback[i];
            if (state === 'correct') {
                feedbackCell.innerHTML = '<i class="fas fa-check-circle"></i>';
                feedbackCell.style.color = '#2ecc71';
            } else if (state === 'present') {
                feedbackCell.innerHTML = '<i class="fas fa-adjust"></i>';
                feedbackCell.style.color = '#f39c12';
            } else {
                feedbackCell.innerHTML = '<i class="fas fa-times-circle"></i>';
                feedbackCell.style.color = '#e74c3c';
            }
            
            feedbackRow.appendChild(feedbackCell);
        }
        
        // 组装记录
        historyRecord.appendChild(recordHeader);
        historyRecord.appendChild(letterRow);
        historyRecord.appendChild(feedbackRow);
        
        // 添加到容器顶部（新记录在上方）
        const historyContainer = this.elements.historyContainer;
        const emptyHistory = historyContainer.querySelector('.empty-history');
        if (emptyHistory) {
            emptyHistory.remove();
        }
        
        historyContainer.insertBefore(historyRecord, historyContainer.firstChild);
        
        // 更新历史记录计数
        this.elements.historyCount.textContent = this.attemptsHistory.length;
        
        // 限制显示数量，移除旧记录
        const maxRecords = 10;
        const records = historyContainer.querySelectorAll('.history-record');
        if (records.length > maxRecords) {
            for (let i = maxRecords; i < records.length; i++) {
                records[i].remove();
            }
        }
    }
    
    // 清空历史记录容器
    clearHistoryContainer() {
        this.elements.historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-scroll"></i>
                <p>暂无历史推理记录</p>
                <small>每次猜测后会显示在这里</small>
            </div>
        `;
        this.elements.historyCount.textContent = '0';
    }
    
    // 处理获胜
    handleWin() {
        const attempts = this.currentAttempt;
        
        // 更新最佳记录
        if (!this.bestRecord || attempts < this.bestRecord) {
            this.bestRecord = attempts;
            localStorage.setItem('penguinWordGuessBestRecord', attempts);
            this.elements.newRecord.style.display = 'flex';
        } else {
            this.elements.newRecord.style.display = 'none';
        }
        
        // 更新游戏历史
        this.addToGameHistory(true, attempts);
        
        // 显示获胜模态框
        this.elements.winWord.textContent = this.targetWord;
        this.elements.winAttempts.textContent = attempts;
        this.showModal(this.elements.winModal);
        
        // 显示消息
        this.showMessage(`恭喜！你在 ${attempts} 次尝试后猜出了单词！`, 'success');
        
        // 禁用检查按钮
        this.elements.checkBtn.disabled = true;
        this.elements.checkBtn.classList.remove('active');
        
        // 移除输入框焦点
        this.removeAllFocusStyles();
        if (this.hiddenInput) {
            this.hiddenInput.blur();
        }
    }
    
    // 处理失败
    handleLoss() {
        // 更新游戏历史
        this.addToGameHistory(false, this.maxAttempts);
        
        // 显示答案
        this.elements.answerWord.textContent = this.targetWord;
        
        // 修改查看答案模态框的标题
        const answerModalHeader = this.elements.answerModal.querySelector('.modal-header h3');
        if (answerModalHeader) {
            answerModalHeader.innerHTML = '<i class="fas fa-eye"></i> 挑战失败 - 查看答案';
        }
        
        this.showModal(this.elements.answerModal);
        
        // 显示消息
        this.showMessage(`游戏结束！正确答案是：${this.targetWord}`, 'warning');
        
        // 禁用检查按钮
        this.elements.checkBtn.disabled = true;
        this.elements.checkBtn.classList.remove('active');
        
        // 移除输入框焦点
        this.removeAllFocusStyles();
        if (this.hiddenInput) {
            this.hiddenInput.blur();
        }
    }
    
    // 添加到游戏历史
    addToGameHistory(isWin, attempts) {
        const historyItem = {
            word: this.targetWord,
            wordLength: this.wordLength,
            attempts: attempts,
            isWin: isWin,
            date: new Date().toLocaleDateString('zh-CN'),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
        };
        
        this.gameHistory.unshift(historyItem);
        this.updateGameHistoryList();
        this.saveGameHistory();
    }
    
    // 更新游戏历史列表
    updateGameHistoryList() {
        this.elements.historyList.innerHTML = '';
        
        if (this.gameHistory.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-scroll"></i>
                    <p>暂无游戏历史</p>
                    <small>每轮游戏结束后会显示在这里</small>
                </div>
            `;
            return;
        }
        
        // 只显示最近10条记录
        const recentHistory = this.gameHistory.slice(0, 10);
        
        for (let i = 0; i < recentHistory.length; i++) {
            const item = recentHistory[i];
            const historyItem = document.createElement('div');
            historyItem.className = `game-history-item ${item.isWin ? 'win' : 'lose'}`;
            
            historyItem.innerHTML = `
                <div class="history-word">${item.word} <span class="word-length-badge">${item.wordLength}字母</span></div>
                <div class="history-stats">
                    <span>${item.isWin ? '🎉 胜利' : '💀 失败'}</span>
                    <span>${item.attempts} 次</span>
                    <span>${item.date} ${item.time}</span>
                </div>
            `;
            
            // 点击查看详细历史
            historyItem.addEventListener('click', () => {
                alert(`单词: ${item.word}\n长度: ${item.wordLength}字母\n结果: ${item.isWin ? '胜利' : '失败'}\n尝试次数: ${item.attempts}\n时间: ${item.date} ${item.time}`);
            });
            
            this.elements.historyList.appendChild(historyItem);
        }
    }
    
    // 保存游戏历史到本地存储
    saveGameHistory() {
        const historyToSave = this.gameHistory.slice(0, 50);
        localStorage.setItem('penguinWordGuessGameHistory', JSON.stringify(historyToSave));
    }
    
    // 加载游戏历史从本地存储
    loadGameHistory() {
        const savedHistory = localStorage.getItem('penguinWordGuessGameHistory');
        if (savedHistory) {
            this.gameHistory = JSON.parse(savedHistory);
            this.updateGameHistoryList();
        }
    }
    
    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有游戏历史记录吗？此操作不可撤销。')) {
            this.gameHistory = [];
            localStorage.removeItem('penguinWordGuessGameHistory');
            this.updateGameHistoryList();
            this.showMessage('历史记录已清空', 'info');
        }
    }
    
    // 显示答案模态框
    showAnswerModal() {
        this.elements.answerWord.textContent = '?'.repeat(this.wordLength);
        this.showModal(this.elements.answerModal);
    }
    
    // 揭示答案
    revealAnswer() {
        this.closeAllModals();
        
        this.elements.answerWord.textContent = this.targetWord;
        this.showModal(this.elements.answerModal);
        
        this.addToGameHistory(false, this.currentAttempt - 1);
        this.showMessage(`正确答案是：${this.targetWord}。开始新游戏吧！`, 'warning');
        
        this.elements.checkBtn.disabled = true;
        this.elements.checkBtn.classList.remove('active');
        
        this.removeAllFocusStyles();
        if (this.hiddenInput) {
            this.hiddenInput.blur();
        }
    }
    
    // 显示模态框
    showModal(modal) {
        this.closeAllModals();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.removeAllFocusStyles();
        if (this.hiddenInput) {
            this.hiddenInput.blur();
        }
    }
    
    // 关闭所有模态框
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }
    
    // 切换字母面板
    toggleLetterPanel() {
        const letterGrid = this.elements.letterStatus;
        const toggleIcon = this.elements.toggleLetters.querySelector('i');
        
        letterGrid.classList.toggle('collapsed');
        
        if (letterGrid.classList.contains('collapsed')) {
            toggleIcon.className = 'fas fa-chevron-up';
        } else {
            toggleIcon.className = 'fas fa-chevron-down';
        }
    }
    
    // 切换主题
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const themeToggle = this.elements.toggleTheme;
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('penguinWordGuessTheme', 'dark');
            themeToggle.classList.add('active');
        } else {
            localStorage.setItem('penguinWordGuessTheme', 'light');
            themeToggle.classList.remove('active');
        }
    }
    
    // 加载主题偏好
    loadThemePreference() {
        const savedTheme = localStorage.getItem('penguinWordGuessTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            this.elements.toggleTheme.classList.add('active');
        }
    }
    
    // 分享游戏
    shareGame() {
        const shareText = `来玩企鹅猜词游戏吧！猜单词的益智游戏，支持多种单词长度，有智能提示功能！`;
        
        if (navigator.share) {
            navigator.share({
                title: '企鹅猜词',
                text: shareText,
                url: window.location.href
            }).catch(err => {
                console.log('分享失败:', err);
                this.copyToClipboard(shareText + ' ' + window.location.href);
            });
        } else {
            this.copyToClipboard(shareText + ' ' + window.location.href);
        }
    }
    
    // 分享结果
    shareResult() {
        const resultText = `我在企鹅猜词游戏中用 ${this.currentAttempt} 次尝试猜出了 ${this.wordLength} 字母单词 ${this.targetWord}！`;
        
        if (navigator.share) {
            navigator.share({
                title: '企鹅猜词 - 挑战成功',
                text: resultText,
                url: window.location.href
            }).catch(err => {
                console.log('分享失败:', err);
                this.copyToClipboard(resultText);
            });
        } else {
            this.copyToClipboard(resultText);
        }
    }
    
    // 复制到剪贴板
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('已复制到剪贴板！', 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            this.showMessage('复制失败，请手动复制', 'warning');
        });
    }
    
    // 显示消息
    showMessage(text, type = 'info') {
        const messageArea = this.elements.messageArea;
        messageArea.textContent = text;
        
        messageArea.className = 'message';
        if (type === 'success') {
            messageArea.style.color = '#2ecc71';
            messageArea.style.borderLeftColor = '#2ecc71';
            messageArea.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
        } else if (type === 'warning') {
            messageArea.style.color = '#f39c12';
            messageArea.style.borderLeftColor = '#f39c12';
            messageArea.style.backgroundColor = 'rgba(243, 156, 18, 0.1)';
        } else if (type === 'error') {
            messageArea.style.color = '#e74c3c';
            messageArea.style.borderLeftColor = '#e74c3c';
            messageArea.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
        } else {
            messageArea.style.color = '#3498db';
            messageArea.style.borderLeftColor = '#3498db';
            messageArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        }
        
        if (type !== 'error') {
            setTimeout(() => {
                if (messageArea.textContent === text) {
                    messageArea.textContent = '';
                    messageArea.style.backgroundColor = '';
                }
            }, 5000);
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new WordGuessingGame();
    window.wordGame = game;
});