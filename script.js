// 猜词游戏 - 主要逻辑
// 高级毛玻璃圆角扁平风格猜词游戏

class WordGuessingGame {
    constructor() {
        // 游戏状态
        this.targetWord = '';
        this.wordLength = 0;
        this.currentAttempt = 1;
        this.maxAttempts = 10;
        this.attemptsHistory = [];
        this.gameHistory = [];
        this.bestRecord = localStorage.getItem('wordGuessBestRecord') || null;
        this.wordList = [];
        this.letterStates = {}; // 记录每个字母的状态: correct, present, absent, unknown
        this.currentInput = [];
        
        // DOM 元素
        this.elements = {
            wordLength: document.getElementById('word-length'),
            attemptCount: document.getElementById('attempt-count'),
            bestRecord: document.getElementById('best-record'),
            letterStatus: document.getElementById('letter-status'),
            historyContainer: document.getElementById('history-container'),
            currentAttempt: document.getElementById('current-attempt'),
            inputRow: document.querySelector('.input-row'),
            feedbackRow: document.querySelector('.feedback-row'),
            checkBtn: document.getElementById('check-btn'),
            hintBtn: document.getElementById('hint-btn'),
            revealBtn: document.getElementById('reveal-btn'),
            newGameBtn: document.getElementById('new-game-btn'),
            messageArea: document.getElementById('message'),
            answerModal: document.getElementById('answer-modal'),
            winModal: document.getElementById('win-modal'),
            hintModal: document.getElementById('hint-modal'),
            keyboardHelpModal: document.getElementById('keyboard-help-modal'),
            historyList: document.getElementById('history-list'),
            answerWord: document.getElementById('answer-word'),
            winWord: document.getElementById('win-word'),
            winAttempts: document.getElementById('win-attempts'),
            newRecord: document.getElementById('new-record'),
            wordCount: document.getElementById('word-count'),
            toggleLetters: document.getElementById('toggle-letters'),
            clearHistory: document.getElementById('clear-history'),
            toggleTheme: document.getElementById('toggle-theme'),
            keyboardHelp: document.getElementById('keyboard-help'),
            confirmReveal: document.getElementById('confirm-reveal'),
            playAgain: document.getElementById('play-again'),
            shareResult: document.getElementById('share-result')
        };
        
        // 初始化字母状态
        this.initLetterStates();
        
        // 绑定事件
        this.bindEvents();
        
        // 加载词库并开始游戏
        this.loadWordList();
    }
    
    // 初始化字母状态
    initLetterStates() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        for (let letter of alphabet) {
            this.letterStates[letter] = 'unknown';
        }
    }
    
    // 绑定事件监听器
    bindEvents() {
        // 控制按钮事件
        this.elements.checkBtn.addEventListener('click', () => this.checkGuess());
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.revealBtn.addEventListener('click', () => this.showAnswerModal());
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        
        // 字母状态面板切换
        this.elements.toggleLetters.addEventListener('click', () => this.toggleLetterPanel());
        
        // 清空历史记录
        this.elements.clearHistory.addEventListener('click', () => this.clearHistory());
        
        // 主题切换
        this.elements.toggleTheme.addEventListener('click', () => this.toggleTheme());
        
        // 键盘帮助
        this.elements.keyboardHelp.addEventListener('click', () => this.showKeyboardHelp());
        
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
        
        // 键盘事件监听
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 点击外部关闭模态框
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }
    
    // 加载词库
    async loadWordList() {
        try {
            // 尝试从服务器获取词库文件
            const response = await fetch('words.txt');
            if (!response.ok) {
                throw new Error('词库文件加载失败，使用内置词库');
            }
            
            const text = await response.text();
            this.wordList = text.split('\n')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length >= 3 && word.length <= 10);
            
            // 如果词库为空或加载失败，使用内置词库
            if (this.wordList.length === 0) {
                this.loadDefaultWordList();
            }
            
            this.elements.wordCount.textContent = this.wordList.length;
            this.startNewGame();
        } catch (error) {
            console.warn(error.message);
            this.loadDefaultWordList();
            this.startNewGame();
        }
    }
    
    // 加载默认词库（如果words.txt不存在）
    loadDefaultWordList() {
        // 内置词库 - 常见英语单词
        const defaultWords = [
            'apple', 'brain', 'chair', 'dance', 'earth', 'flame', 'grape', 'heart', 'igloo', 'jelly',
            'knife', 'lemon', 'music', 'night', 'ocean', 'piano', 'queen', 'river', 'smile', 'table',
            'umbra', 'voice', 'water', 'xerox', 'yacht', 'zebra', 'actor', 'beach', 'cloud', 'drama',
            'eagle', 'fruit', 'ghost', 'hotel', 'image', 'joker', 'kitty', 'light', 'magic', 'north',
            'opera', 'panda', 'quiet', 'robot', 'sunny', 'tiger', 'unity', 'vivid', 'world', 'young',
            'adult', 'basic', 'candy', 'dream', 'empty', 'fancy', 'green', 'happy', 'ideal', 'jolly',
            'kindy', 'lucky', 'merry', 'novel', 'olive', 'party', 'quick', 'royal', 'sweet', 'tasty',
            'urban', 'vocal', 'white', 'yummy', 'angel', 'brave', 'clean', 'dirty', 'early', 'fresh',
            'grand', 'heavy', 'inner', 'juicy', 'large', 'minor', 'nasty', 'oddly', 'petty', 'quite',
            'rapid', 'small', 'tight', 'upset', 'vague', 'weird', 'alien', 'blend', 'crisp', 'dense',
            'elite', 'faint', 'globe', 'harsh', 'ivory', 'joint', 'kneel', 'loose', 'mirth', 'noble',
            'opaque', 'prime', 'quota', 'rusty', 'sharp', 'tough', 'ultra', 'vowel', 'witty', 'youth'
        ];
        
        this.wordList = defaultWords;
        this.elements.wordCount.textContent = this.wordList.length;
        this.showMessage('使用内置词库，共' + defaultWords.length + '个单词', 'info');
    }
    
    // 开始新游戏
    startNewGame() {
        // 选择一个随机单词
        const randomIndex = Math.floor(Math.random() * this.wordList.length);
        this.targetWord = this.wordList[randomIndex];
        this.wordLength = this.targetWord.length;
        
        // 重置游戏状态
        this.currentAttempt = 1;
        this.attemptsHistory = [];
        this.currentInput = new Array(this.wordLength).fill('');
        
        // 重置字母状态
        this.initLetterStates();
        
        // 更新UI
        this.updateGameInfo();
        this.createLetterStatusGrid();
        this.createInputRow();
        this.clearHistoryContainer();
        this.updateCheckButton();
        this.closeAllModals();
        
        // 显示消息
        this.showMessage(`新游戏开始！目标单词有 ${this.wordLength} 个字母。点击下划线开始输入。`, 'info');
        
        // 聚焦第一个输入框
        setTimeout(() => {
            const firstInput = document.querySelector('.letter-input.empty');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // 调试用 - 控制台显示答案（正式发布时可移除）
        console.log('目标单词:', this.targetWord);
    }
    
    // 更新游戏信息显示
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
            letterDiv.textContent = letter.toUpperCase();
            letterDiv.dataset.letter = letter;
            
            // 点击字母可以快速输入（在输入行有空位时）
            letterDiv.addEventListener('click', () => {
                if (!this.isCurrentRowFull()) {
                    const emptyIndex = this.currentInput.findIndex(char => char === '');
                    if (emptyIndex !== -1) {
                        this.addLetterToInput(letter, emptyIndex);
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
            inputCell.textContent = this.currentInput[i] ? this.currentInput[i].toUpperCase() : '';
            inputCell.dataset.index = i;
            inputCell.tabIndex = 0;
            
            // 添加事件监听器
            inputCell.addEventListener('click', () => this.handleInputClick(i));
            inputCell.addEventListener('keydown', (e) => this.handleInputKeydown(e, i));
            
            this.elements.inputRow.appendChild(inputCell);
            
            // 创建反馈框
            const feedbackCell = document.createElement('div');
            feedbackCell.className = 'feedback-item';
            feedbackCell.dataset.index = i;
            this.elements.feedbackRow.appendChild(feedbackCell);
        }
    }
    
    // 处理输入框点击
    handleInputClick(index) {
        // 聚焦被点击的输入框
        const inputCell = document.querySelector(`.letter-input[data-index="${index}"]`);
        if (inputCell) {
            inputCell.focus();
        }
    }
    
    // 处理输入框键盘事件
    handleInputKeydown(e, index) {
        const key = e.key.toLowerCase();
        
        // 字母键
        if (/^[a-z]$/.test(key)) {
            e.preventDefault();
            this.addLetterToInput(key, index);
            
            // 自动聚焦下一个输入框
            if (index < this.wordLength - 1) {
                const nextInput = document.querySelector(`.letter-input[data-index="${index + 1}"]`);
                if (nextInput) nextInput.focus();
            }
        }
        // 退格键
        else if (key === 'backspace') {
            e.preventDefault();
            this.removeLetterFromInput(index);
            
            // 如果当前单元格为空，则聚焦前一个单元格
            if (!this.currentInput[index] && index > 0) {
                const prevInput = document.querySelector(`.letter-input[data-index="${index - 1}"]`);
                if (prevInput) prevInput.focus();
            }
        }
        // 删除键
        else if (key === 'delete') {
            e.preventDefault();
            this.currentInput[index] = '';
            this.updateInputRow();
        }
        // 方向键
        else if (key === 'arrowleft' && index > 0) {
            const prevInput = document.querySelector(`.letter-input[data-index="${index - 1}"]`);
            if (prevInput) prevInput.focus();
        }
        else if (key === 'arrowright' && index < this.wordLength - 1) {
            const nextInput = document.querySelector(`.letter-input[data-index="${index + 1}"]`);
            if (nextInput) nextInput.focus();
        }
        // 回车键
        else if (key === 'enter') {
            e.preventDefault();
            this.checkGuess();
        }
    }
    
    // 处理全局键盘事件
    handleKeydown(e) {
        const key = e.key.toLowerCase();
        
        // ESC键关闭所有模态框
        if (key === 'escape') {
            this.closeAllModals();
        }
        
        // 如果模态框打开，不处理其他键盘事件
        if (document.querySelector('.modal.active')) {
            return;
        }
        
        // 字母键直接输入（如果输入行有空位）
        if (/^[a-z]$/.test(key)) {
            const emptyIndex = this.currentInput.findIndex(char => char === '');
            if (emptyIndex !== -1) {
                this.addLetterToInput(key, emptyIndex);
                
                // 聚焦下一个输入框
                if (emptyIndex < this.wordLength - 1) {
                    const nextInput = document.querySelector(`.letter-input[data-index="${emptyIndex + 1}"]`);
                    if (nextInput) nextInput.focus();
                }
            }
        }
        // 回车键提交猜测
        else if (key === 'enter') {
            e.preventDefault();
            this.checkGuess();
        }
    }
    
    // 添加字母到输入
    addLetterToInput(letter, index) {
        // 从当前索引开始填充，覆盖后面的字母（实现连续输入功能）
        for (let i = index; i < this.wordLength; i++) {
            this.currentInput[i] = i === index ? letter : '';
        }
        
        this.updateInputRow();
        this.updateCheckButton();
    }
    
    // 从输入中删除字母
    removeLetterFromInput(index) {
        // 如果当前单元格有内容，清空它
        if (this.currentInput[index]) {
            this.currentInput[index] = '';
        }
        // 如果当前单元格为空，清空前一个单元格
        else if (index > 0) {
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
            cell.textContent = letter ? letter.toUpperCase() : '';
            cell.className = `letter-input ${letter ? 'filled' : 'empty'}`;
        });
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
    
    // 检查猜测
    checkGuess() {
        // 验证当前行是否已填满
        if (!this.isCurrentRowFull()) {
            this.showMessage('请填满所有字母后再检查！', 'warning');
            return;
        }
        
        // 获取用户输入的单词
        const guess = this.currentInput.join('');
        
        // 检查是否是有效单词（在词库中）
        if (!this.wordList.includes(guess)) {
            this.showMessage(`"${guess.toUpperCase()}" 不在词库中，请尝试其他单词。`, 'warning');
            return;
        }
        
        // 验证猜测并获取反馈
        const feedback = this.validateGuess(guess);
        
        // 添加到历史记录
        this.attemptsHistory.push({
            attempt: this.currentAttempt,
            word: guess,
            feedback: feedback
        });
        
        // 更新字母状态
        this.updateLetterStates(guess, feedback);
        
        // 添加历史记录到UI
        this.addAttemptToHistory(guess, feedback);
        
        // 检查是否获胜
        const isWin = feedback.every(f => f === 'correct');
        
        if (isWin) {
            this.handleWin();
        } else {
            // 准备下一轮
            this.currentAttempt++;
            
            // 检查是否超过最大尝试次数
            if (this.currentAttempt > this.maxAttempts) {
                this.handleLoss();
                return;
            }
            
            // 重置当前输入
            this.currentInput = new Array(this.wordLength).fill('');
            this.createInputRow();
            this.updateGameInfo();
            this.updateCheckButton();
            
            // 显示消息
            this.showMessage(`继续尝试！你已经尝试了 ${this.currentAttempt - 1} 次。`, 'info');
            
            // 聚焦第一个输入框
            setTimeout(() => {
                const firstInput = document.querySelector('.letter-input.empty');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }
    
    // 验证猜测
    validateGuess(guess) {
        const feedback = new Array(this.wordLength).fill('absent');
        const targetLetters = this.targetWord.split('');
        const guessLetters = guess.split('');
        
        // 第一遍：标记正确位置（绿色勾）
        for (let i = 0; i < this.wordLength; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                feedback[i] = 'correct';
                targetLetters[i] = null; // 标记为已使用
                guessLetters[i] = null;
            }
        }
        
        // 第二遍：标记错误位置但存在（黄色半勾）
        for (let i = 0; i < this.wordLength; i++) {
            if (guessLetters[i] !== null) {
                const indexInTarget = targetLetters.indexOf(guessLetters[i]);
                if (indexInTarget !== -1) {
                    feedback[i] = 'present';
                    targetLetters[indexInTarget] = null; // 标记为已使用
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
            
            // 如果字母状态已经是correct，保持correct（最高优先级）
            if (this.letterStates[letter] === 'correct') {
                continue;
            }
            
            // 如果新状态是correct，更新为correct
            if (state === 'correct') {
                this.letterStates[letter] = 'correct';
            }
            // 如果新状态是present且当前状态不是correct，更新为present
            else if (state === 'present' && this.letterStates[letter] !== 'correct') {
                this.letterStates[letter] = 'present';
            }
            // 如果新状态是absent且当前状态不是correct或present，更新为absent
            else if (state === 'absent' && 
                     this.letterStates[letter] !== 'correct' && 
                     this.letterStates[letter] !== 'present') {
                this.letterStates[letter] = 'absent';
            }
        }
        
        // 更新字母状态网格
        this.createLetterStatusGrid();
    }
    
    // 添加尝试记录到历史
    addAttemptToHistory(guess, feedback) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // 尝试次数
        const attemptNumber = document.createElement('div');
        attemptNumber.className = 'attempt-number';
        attemptNumber.textContent = `#${this.currentAttempt}`;
        
        // 输入行
        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';
        
        // 反馈行
        const feedbackRow = document.createElement('div');
        feedbackRow.className = 'feedback-row';
        
        // 创建字母和反馈单元格
        for (let i = 0; i < this.wordLength; i++) {
            const letter = guess[i];
            const state = feedback[i];
            
            // 字母单元格
            const letterCell = document.createElement('div');
            letterCell.className = `letter-input filled`;
            letterCell.textContent = letter.toUpperCase();
            inputRow.appendChild(letterCell);
            
            // 反馈单元格
            const feedbackCell = document.createElement('div');
            feedbackCell.className = `feedback-item feedback-${state}`;
            
            // 添加相应的图标
            if (state === 'correct') {
                feedbackCell.innerHTML = '<i class="fas fa-check-circle"></i>';
            } else if (state === 'present') {
                feedbackCell.innerHTML = '<i class="fas fa-adjust"></i>';
            } else {
                feedbackCell.innerHTML = '<i class="fas fa-times-circle"></i>';
            }
            
            feedbackRow.appendChild(feedbackCell);
        }
        
        // 组装历史项
        historyItem.appendChild(attemptNumber);
        historyItem.appendChild(inputRow);
        historyItem.appendChild(feedbackRow);
        
        // 添加到历史容器顶部
        this.elements.historyContainer.prepend(historyItem);
        
        // 滚动到顶部
        this.elements.historyContainer.scrollTop = 0;
    }
    
    // 清空历史容器
    clearHistoryContainer() {
        this.elements.historyContainer.innerHTML = '';
    }
    
    // 处理获胜
    handleWin() {
        // 计算尝试次数
        const attempts = this.currentAttempt;
        
        // 更新最佳记录
        if (!this.bestRecord || attempts < this.bestRecord) {
            this.bestRecord = attempts;
            localStorage.setItem('wordGuessBestRecord', attempts);
            this.elements.newRecord.style.display = 'flex';
        } else {
            this.elements.newRecord.style.display = 'none';
        }
        
        // 更新游戏历史
        this.addToGameHistory(true, attempts);
        
        // 显示获胜模态框
        this.elements.winWord.textContent = this.targetWord.toUpperCase();
        this.elements.winAttempts.textContent = attempts;
        this.showModal(this.elements.winModal);
        
        // 显示消息
        this.showMessage(`恭喜！你在 ${attempts} 次尝试后猜出了单词！`, 'success');
        
        // 禁用检查按钮
        this.elements.checkBtn.disabled = true;
        this.elements.checkBtn.classList.remove('active');
    }
    
    // 处理失败
    handleLoss() {
        // 更新游戏历史
        this.addToGameHistory(false, this.maxAttempts);
        
        // 显示答案
        this.elements.answerWord.textContent = this.targetWord.toUpperCase();
        this.showModal(this.elements.answerModal);
        
        // 显示消息
        this.showMessage(`游戏结束！正确答案是：${this.targetWord.toUpperCase()}`, 'warning');
        
        // 禁用检查按钮
        this.elements.checkBtn.disabled = true;
        this.elements.checkBtn.classList.remove('active');
    }
    
    // 添加到游戏历史
    addToGameHistory(isWin, attempts) {
        const historyItem = {
            word: this.targetWord,
            attempts: attempts,
            isWin: isWin,
            date: new Date().toLocaleDateString('zh-CN'),
            timestamp: Date.now()
        };
        
        this.gameHistory.unshift(historyItem);
        this.updateGameHistoryList();
        
        // 保存到本地存储
        this.saveGameHistory();
    }
    
    // 更新游戏历史列表
    updateGameHistoryList() {
        this.elements.historyList.innerHTML = '';
        
        if (this.gameHistory.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-history';
            emptyDiv.innerHTML = `
                <i class="fas fa-scroll"></i>
                <p>暂无游戏历史</p>
            `;
            this.elements.historyList.appendChild(emptyDiv);
            return;
        }
        
        // 只显示最近10条记录
        const recentHistory = this.gameHistory.slice(0, 10);
        
        for (let i = 0; i < recentHistory.length; i++) {
            const item = recentHistory[i];
            const historyItem = document.createElement('div');
            historyItem.className = `game-history-item ${item.isWin ? 'win' : 'lose'}`;
            
            historyItem.innerHTML = `
                <div class="history-word">${item.word.toUpperCase()}</div>
                <div class="history-stats">
                    <span>${item.isWin ? '胜利' : '失败'}</span>
                    <span>${item.attempts} 次尝试</span>
                    <span>${item.date}</span>
                </div>
            `;
            
            // 点击查看详细历史
            historyItem.addEventListener('click', () => {
                this.viewGameHistory(item);
            });
            
            this.elements.historyList.appendChild(historyItem);
        }
    }
    
    // 查看游戏历史详情
    viewGameHistory(historyItem) {
        alert(`单词: ${historyItem.word.toUpperCase()}\n结果: ${historyItem.isWin ? '胜利' : '失败'}\n尝试次数: ${historyItem.attempts}\n日期: ${historyItem.date}`);
    }
    
    // 保存游戏历史到本地存储
    saveGameHistory() {
        // 只保存最近50条记录
        const historyToSave = this.gameHistory.slice(0, 50);
        localStorage.setItem('wordGuessGameHistory', JSON.stringify(historyToSave));
    }
    
    // 加载游戏历史从本地存储
    loadGameHistory() {
        const savedHistory = localStorage.getItem('wordGuessGameHistory');
        if (savedHistory) {
            this.gameHistory = JSON.parse(savedHistory);
            this.updateGameHistoryList();
        }
    }
    
    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有游戏历史记录吗？此操作不可撤销。')) {
            this.gameHistory = [];
            localStorage.removeItem('wordGuessGameHistory');
            this.updateGameHistoryList();
            this.showMessage('历史记录已清空', 'info');
        }
    }
    
    // 显示提示
    showHint() {
        this.showModal(this.elements.hintModal);
    }
    
    // 显示答案模态框
    showAnswerModal() {
        this.elements.answerWord.textContent = '?'.repeat(this.wordLength);
        this.showModal(this.elements.answerModal);
    }
    
    // 显示键盘帮助
    showKeyboardHelp() {
        this.showModal(this.elements.keyboardHelpModal);
    }
    
    // 显示模态框
    showModal(modal) {
        this.closeAllModals();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // 关闭所有模态框
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }
    
    // 揭示答案
    revealAnswer() {
        this.closeAllModals();
        
        // 显示答案
        this.elements.answerWord.textContent = this.targetWord.toUpperCase();
        this.showModal(this.elements.answerModal);
        
        // 记录游戏为失败
        this.addToGameHistory(false, this.currentAttempt - 1);
        
        // 显示消息
        this.showMessage(`正确答案是：${this.targetWord.toUpperCase()}。开始新游戏吧！`, 'warning');
        
        // 禁用检查按钮
        this.elements.checkBtn.disabled = true;
        this.elements.checkBtn.classList.remove('active');
    }
    
    // 切换字母面板
    toggleLetterPanel() {
        const letterGrid = this.elements.letterStatus;
        const toggleIcon = this.elements.toggleLetters.querySelector('i');
        
        letterGrid.classList.toggle('collapsed');
        
        if (letterGrid.classList.contains('collapsed')) {
            toggleIcon.className = 'fas fa-chevron-up';
            this.showMessage('字母状态面板已收起', 'info');
        } else {
            toggleIcon.className = 'fas fa-chevron-down';
        }
    }
    
    // 切换主题
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const themeToggle = this.elements.toggleTheme;
        const icon = themeToggle.querySelector('i');
        
        if (document.body.classList.contains('dark-theme')) {
            icon.className = 'fas fa-sun';
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> 亮色模式';
            localStorage.setItem('wordGuessTheme', 'dark');
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> 暗色模式';
            localStorage.setItem('wordGuessTheme', 'light');
        }
    }
    
    // 加载主题偏好
    loadThemePreference() {
        const savedTheme = localStorage.getItem('wordGuessTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            this.elements.toggleTheme.innerHTML = '<i class="fas fa-sun"></i> 亮色模式';
        }
    }
    
    // 分享结果
    shareResult() {
        const resultText = `我在单词猜猜猜游戏中用 ${this.currentAttempt} 次尝试猜出了单词 ${this.targetWord.toUpperCase()}！`;
        
        // 尝试使用Web Share API
        if (navigator.share) {
            navigator.share({
                title: '单词猜猜猜',
                text: resultText,
                url: window.location.href
            }).catch(err => {
                console.log('分享失败:', err);
                this.copyToClipboard(resultText);
            });
        } else {
            // 回退方案：复制到剪贴板
            this.copyToClipboard(resultText);
        }
    }
    
    // 复制到剪贴板
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('结果已复制到剪贴板！', 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            this.showMessage('复制失败，请手动复制', 'warning');
        });
    }
    
    // 显示消息
    showMessage(text, type = 'info') {
        const messageArea = this.elements.messageArea;
        messageArea.textContent = text;
        
        // 设置消息类型样式
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
        
        // 自动消失的消息
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
    
    // 加载游戏历史和主题偏好
    game.loadGameHistory();
    game.loadThemePreference();
    
    // 暴露到全局对象以便调试
    window.wordGame = game;
});
