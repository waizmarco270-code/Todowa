// Todowa - Ultimate Todo App
// Main Application JavaScript

class TodowaApp {
    constructor() {
        this.todos = [];
        this.userProgress = {
            level: 0,
            xp: 0,
            totalXP: 0,
            streak: 0,
            lastCompletionDate: null,
            completedToday: 0,
            totalCompleted: 0
        };
        
        this.settings = {
            theme: 'light',
            reducedMotion: false,
            highContrast: false,
            notifications: true
        };

        this.currentView = 'dashboard';
        this.currentQuoteIndex = 0;
        this.quoteInterval = null;
        this.timer = {
            isRunning: false,
            isPaused: false,
            timeLeft: 1500, // 25 minutes in seconds
            totalTime: 1500,
            interval: null,
            lastUpdate: Date.now()
        };

        this.quotes = [
            "The secret of getting ahead is getting started.",
            "Don't watch the clock; do what it does. Keep going.",
            "Success is the sum of small efforts repeated day in and day out.",
            "Your future is created by what you do today, not tomorrow.",
            "Action is the foundational key to all success.",
            "The only way to do great work is to love what you do.",
            "Innovation distinguishes between a leader and a follower.",
            "Stay hungry. Stay foolish.",
            "The future belongs to those who believe in the beauty of their dreams.",
            "It is during our darkest moments that we must focus to see the light.",
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The only impossible journey is the one you never begin.",
            "In the middle of difficulty lies opportunity.",
            "Believe you can and you're halfway there.",
            "The way to get started is to quit talking and begin doing.",
            "Don't be afraid to give your best to what seemingly are small jobs.",
            "If you really look closely, most overnight successes took a long time.",
            "The real test is not whether you avoid this failure, because you won't.",
            "Entrepreneurs are great at dealing with uncertainty and also very good at minimizing risk.",
            "The successful warrior is the average person with laser-like focus.",
            "Opportunities don't happen. You create them.",
            "Try not to become a person of success, but rather try to become a person of value.",
            "Great things in business are never done by one person. They're done by a team of people.",
            "If you are not willing to risk the usual, you will have to settle for the ordinary.",
            "All progress takes place outside the comfort zone.",
            "Success is walking from failure to failure with no loss of enthusiasm.",
            "The only place where success comes before work is in the dictionary.",
            "If you want to achieve excellence, you can get there today.",
            "The difference between ordinary and extraordinary is that little extra.",
            "Success is the result of preparation, hard work, and learning from failure.",
            "Don't let yesterday take up too much of today.",
            "You learn more from failure than from success.",
            "If you are working on something exciting that you really care about, you don't have to be pushed.",
            "Experience is a hard teacher because she gives the test first, the lesson afterward.",
            "To know how much there is to know is the beginning of learning to live.",
            "I find that the harder I work, the more luck I seem to have.",
            "The secret to success is to do the common thing uncommonly well.",
            "Success is not just about what you accomplish in your life, it's about what you inspire others to do.",
            "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
            "The road to success and the road to failure are almost exactly the same.",
            "Success is liking yourself, liking what you do, and liking how you do it.",
            "A successful person is one who can lay a firm foundation with the bricks others have thrown at him.",
            "Success is not about being the best. It's about always getting better.",
            "The successful person has the habit of doing the things failures don't like to do.",
            "Success isn't just about what you accomplish in your life, it's about what you inspire others to do.",
            "Your limitation—it's only your imagination.",
            "Push yourself, because no one else is going to do it for you.",
            "Great things never come from comfort zones.",
            "Dream it. Wish it. Do it.",
            "Success doesn't just find you. You have to go out and get it."
        ];

        this.levels = [
            { level: 0, minXP: 0, emoji: '🆕', title: 'Newbie' },
            { level: 1, minXP: 50, emoji: '⚡', title: 'Challenger' },
            { level: 2, minXP: 100, emoji: '💼', title: 'Professional' },
            { level: 3, minXP: 200, emoji: '🔥', title: 'Hacker' },
            { level: 4, minXP: 500, emoji: '👨‍💻', title: 'Developer' },
            { level: 5, minXP: 1000, emoji: '👑', title: 'Monarch' },
            { level: 6, minXP: 2000, emoji: '🏆', title: 'LEGEND' }
        ];

        this.init();
    }

    async init() {
        try {
            // Set initial theme from system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.settings.theme = 'dark';
            }
            
            await this.initDB();
            await this.loadData();
            this.loadSampleData();
            this.initEventListeners();
            this.initPWA();
            this.updateDisplay();
            this.startQuoteCarousel();
            this.initKeyboardShortcuts();
            this.requestNotificationPermission();
            this.applySettings();
            
            console.log('Todowa app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    // Database Management
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TodowaDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('todos')) {
                    db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('userProgress')) {
                    db.createObjectStore('userProgress', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }
            };
        });
    }

    async loadData() {
        try {
            // Load todos
            const todosTransaction = this.db.transaction(['todos'], 'readonly');
            const todosStore = todosTransaction.objectStore('todos');
            const todosRequest = todosStore.getAll();
            
            await new Promise((resolve) => {
                todosRequest.onsuccess = () => {
                    this.todos = todosRequest.result || [];
                    resolve();
                };
            });

            // Load user progress
            const progressTransaction = this.db.transaction(['userProgress'], 'readonly');
            const progressStore = progressTransaction.objectStore('userProgress');
            const progressRequest = progressStore.get('main');
            
            await new Promise((resolve) => {
                progressRequest.onsuccess = () => {
                    if (progressRequest.result) {
                        this.userProgress = { ...this.userProgress, ...progressRequest.result };
                    }
                    resolve();
                };
            });

            // Load settings
            const settingsTransaction = this.db.transaction(['settings'], 'readonly');
            const settingsStore = settingsTransaction.objectStore('settings');
            const settingsRequest = settingsStore.get('main');
            
            await new Promise((resolve) => {
                settingsRequest.onsuccess = () => {
                    if (settingsRequest.result) {
                        this.settings = { ...this.settings, ...settingsRequest.result };
                    }
                    resolve();
                };
            });

        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    async saveData() {
        try {
            // Save user progress
            const progressTransaction = this.db.transaction(['userProgress'], 'readwrite');
            const progressStore = progressTransaction.objectStore('userProgress');
            progressStore.put({ id: 'main', ...this.userProgress });

            // Save settings
            const settingsTransaction = this.db.transaction(['settings'], 'readwrite');
            const settingsStore = settingsTransaction.objectStore('settings');
            settingsStore.put({ id: 'main', ...this.settings });

        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    async saveTodo(todo) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['todos'], 'readwrite');
            const store = transaction.objectStore('todos');
            const request = todo.id ? store.put(todo) : store.add(todo);
            
            request.onsuccess = () => {
                if (!todo.id) {
                    todo.id = request.result;
                }
                resolve(todo);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTodoFromDB(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['todos'], 'readwrite');
            const store = transaction.objectStore('todos');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    loadSampleData() {
        if (this.todos.length === 0) {
            const sampleTodos = [
                {
                    id: 1,
                    title: "Read 20 pages",
                    description: "Atomic Habits",
                    category: "Study",
                    priority: "Low",
                    dueDate: "2025-08-28",
                    createdAt: new Date().toISOString(),
                    completed: false
                },
                {
                    id: 2,
                    title: "Workout 30m",
                    description: "Cardio session",
                    category: "Health",
                    priority: "Medium",
                    dueDate: "2025-08-27",
                    createdAt: new Date().toISOString(),
                    completed: false
                },
                {
                    id: 3,
                    title: "Finish project report",
                    description: "Draft slides",
                    category: "Work",
                    priority: "High",
                    dueDate: "2025-08-29",
                    createdAt: new Date().toISOString(),
                    completed: false
                }
            ];

            this.todos = [...sampleTodos];
        }
    }

    // PWA Implementation
    initPWA() {
        // Handle install prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallBanner();
        });

        const installBtn = document.getElementById('install-btn');
        const dismissBtn = document.getElementById('dismiss-install');
        
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const result = await deferredPrompt.userChoice;
                    deferredPrompt = null;
                    this.hideInstallBanner();
                }
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.hideInstallBanner();
            });
        }

        // Update theme-color meta tag based on current theme
        this.updateThemeColor();
    }

    showInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }

    hideInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.classList.add('hidden');
        }
    }

    updateThemeColor() {
        const meta = document.querySelector('meta[name="theme-color"]');
        const colors = {
            light: '#218083',
            dark: '#0066ff',
            neon: '#00ffff',
            sakura: '#ffb7c5'
        };
        if (meta) {
            meta.setAttribute('content', colors[this.settings.theme] || colors.light);
        }
    }

    // Event Listeners
    initEventListeners() {
        // Navigation
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.getElementById('sidebar');
        
        if (hamburger) {
            hamburger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
                console.log('Hamburger clicked');
            });
        }

        // Navigation links
        document.querySelectorAll('[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const navTarget = e.currentTarget.dataset.nav;
                console.log('Navigating to:', navTarget);
                this.navigateTo(navTarget);
                this.closeSidebar();
            });
        });

        // Add task form
        const addTaskForm = document.getElementById('addTaskForm');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTaskFromForm();
            });
        }

        // Voice input
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.cycleTheme());
        }

        // Theme selection
        document.querySelectorAll('.theme-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.closest('.theme-card').dataset.theme;
                this.setTheme(theme);
            });
        });

        // Search and filters
        const searchInput = document.getElementById('searchTasks');
        const filterCategory = document.getElementById('filterCategory');
        const sortTasks = document.getElementById('sortTasks');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchTasks(e.target.value));
        }
        if (filterCategory) {
            filterCategory.addEventListener('change', (e) => this.filterByCategory(e.target.value));
        }
        if (sortTasks) {
            sortTasks.addEventListener('change', (e) => this.sortTasks(e.target.value));
        }

        // Timer controls
        const startTimer = document.getElementById('startTimer');
        const pauseTimer = document.getElementById('pauseTimer');
        const resetTimer = document.getElementById('resetTimer');
        
        if (startTimer) startTimer.addEventListener('click', () => this.startTimer());
        if (pauseTimer) pauseTimer.addEventListener('click', () => this.pauseTimer());
        if (resetTimer) resetTimer.addEventListener('click', () => this.resetTimer());
        
        document.querySelectorAll('.timer-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.currentTarget.dataset.minutes);
                this.setTimerPreset(minutes);
            });
        });

        // Settings
        const reducedMotion = document.getElementById('reducedMotion');
        const highContrast = document.getElementById('highContrast');
        const exportBtn = document.getElementById('exportData');
        const importBtn = document.getElementById('importData');
        const importFile = document.getElementById('importFile');
        const clearBtn = document.getElementById('clearData');
        
        if (reducedMotion) {
            reducedMotion.addEventListener('change', (e) => {
                this.settings.reducedMotion = e.target.checked;
                this.applySettings();
                this.saveData();
            });
        }

        if (highContrast) {
            highContrast.addEventListener('change', (e) => {
                this.settings.highContrast = e.target.checked;
                this.applySettings();
                this.saveData();
            });
        }

        if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
        if (importBtn) importBtn.addEventListener('click', () => importFile?.click());
        if (importFile) importFile.addEventListener('change', (e) => this.importData(e.target.files[0]));
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllData());

        // Modals
        const creditLink = document.getElementById('creditLink');
        if (creditLink) {
            creditLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('developerModal');
            });
        }
        
        const closeLevelUp = document.getElementById('closeLevelUp');
        if (closeLevelUp) {
            closeLevelUp.addEventListener('click', () => this.hideModal('levelUpModal'));
        }
        
        document.querySelectorAll('.modal__close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.currentTarget.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                const modal = e.currentTarget.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // Quote carousel pause on hover
        const quoteCarousel = document.getElementById('quoteCarousel');
        if (quoteCarousel) {
            quoteCarousel.addEventListener('mouseenter', () => this.pauseQuoteCarousel());
            quoteCarousel.addEventListener('mouseleave', () => this.resumeQuoteCarousel());
        }

        // Close sidebar on outside click
        document.addEventListener('click', (e) => {
            if (sidebar && hamburger) {
                if (sidebar.classList.contains('active') && 
                    !sidebar.contains(e.target) && 
                    !hamburger.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });

        // Date update
        this.updateCurrentDate();
        setInterval(() => this.updateCurrentDate(), 60000); // Update every minute
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+N - Add new task
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const taskTitle = document.getElementById('taskTitle');
                if (taskTitle) taskTitle.focus();
            }
            
            // / - Focus search
            if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    const searchInput = document.getElementById('searchTasks');
                    if (searchInput) searchInput.focus();
                }
            }
            
            // ? - Show help
            if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.showModal('helpModal');
                }
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                const activeModals = document.querySelectorAll('.modal:not(.hidden)');
                activeModals.forEach(modal => this.hideModal(modal.id));
                this.closeSidebar();
            }
        });
    }

    // Navigation
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger');
        
        if (sidebar && hamburger) {
            sidebar.classList.toggle('active');
            hamburger.classList.toggle('active');
            console.log('Sidebar toggled:', sidebar.classList.contains('active'));
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger');
        
        if (sidebar && hamburger) {
            sidebar.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }

    navigateTo(view) {
        console.log('Navigating to view:', view);
        
        // Hide all views
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${view}-view`);
        if (targetView) {
            targetView.classList.add('active');
        } else {
            console.error('View not found:', `${view}-view`);
        }
        
        // Update navigation state
        document.querySelectorAll('[data-nav]').forEach(link => {
            link.classList.remove('active');
        });
        
        const navLink = document.querySelector(`[data-nav="${view}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
        
        this.currentView = view;
        this.updateViewData();
    }

    updateViewData() {
        switch (this.currentView) {
            case 'completed':
                this.renderCompletedTasks();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
        }
    }

    // Todo Management
    async addTodo(todoData) {
        const todo = {
            ...todoData,
            id: todoData.id || Date.now(),
            createdAt: todoData.createdAt || new Date().toISOString(),
            completed: false
        };

        try {
            this.todos.push(todo);
            await this.saveTodo(todo);
            this.renderTasks();
            this.updateDisplay();
            this.saveData();
            
            // Add task animation and XP
            this.animateTaskAdd();
            console.log('Task added:', todo.title);
        } catch (error) {
            console.error('Failed to add todo:', error);
        }
    }

    addTaskFromForm() {
        const titleInput = document.getElementById('taskTitle');
        const descInput = document.getElementById('taskDescription');
        const categoryInput = document.getElementById('taskCategory');
        const priorityInput = document.getElementById('taskPriority');
        const dueDateInput = document.getElementById('taskDueDate');
        
        if (!titleInput || !titleInput.value.trim()) return;
        
        const todoData = {
            title: titleInput.value.trim(),
            description: descInput ? descInput.value.trim() : '',
            category: categoryInput ? categoryInput.value : 'Personal',
            priority: priorityInput ? priorityInput.value : 'Medium',
            dueDate: dueDateInput ? dueDateInput.value || null : null
        };

        this.addTodo(todoData);
        
        // Clear form
        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        if (dueDateInput) dueDateInput.value = '';
    }

    async completeTodo(id) {
        const todo = this.todos.find(t => t.id == id);
        if (!todo || todo.completed) return;

        todo.completed = true;
        todo.completedAt = new Date().toISOString();

        try {
            await this.saveTodo(todo);
            
            // Update progress
            this.addXP(2); // +2 XP for task completion
            this.userProgress.completedToday++;
            this.userProgress.totalCompleted++;
            
            // Check for daily goal
            if (this.userProgress.completedToday >= 3) {
                this.addXP(5); // Bonus XP for daily goal
            }
            
            // Check for perfect day
            const todayTodos = this.getTodayTasks();
            if (todayTodos.length > 0 && todayTodos.every(t => t.completed)) {
                this.addXP(15); // Perfect day bonus
            }

            this.animateTaskCompletion(id);
            this.updateDisplay();
            this.saveData();
            
            // Trigger confetti
            setTimeout(() => this.createConfetti(), 300);
            
            console.log('Task completed:', todo.title);
            
        } catch (error) {
            console.error('Failed to complete todo:', error);
        }
    }

    async deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            await this.deleteTodoFromDB(id);
            this.todos = this.todos.filter(t => t.id != id);
            this.renderTasks();
            this.updateDisplay();
            console.log('Task deleted:', id);
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    }

    // Gamification System
    addXP(amount) {
        const oldLevel = this.getCurrentLevel();
        this.userProgress.xp += amount;
        this.userProgress.totalXP += amount;
        
        const newLevel = this.getCurrentLevel();
        
        if (newLevel.level > oldLevel.level) {
            setTimeout(() => {
                this.showLevelUp(newLevel);
                this.createLevelUpParticles();
            }, 500);
        }
        
        this.updateLevelDisplay();
    }

    getCurrentLevel() {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.userProgress.totalXP >= this.levels[i].minXP) {
                return this.levels[i];
            }
        }
        return this.levels[0];
    }

    getNextLevel() {
        const currentLevel = this.getCurrentLevel();
        const nextLevelIndex = currentLevel.level + 1;
        return nextLevelIndex < this.levels.length ? this.levels[nextLevelIndex] : null;
    }

    updateLevelDisplay() {
        const currentLevel = this.getCurrentLevel();
        const nextLevel = this.getNextLevel();
        
        const levelEmoji = document.getElementById('levelEmoji');
        const levelText = document.getElementById('levelText');
        const xpProgress = document.getElementById('xpProgress');
        const xpText = document.getElementById('xpText');
        
        if (levelEmoji) levelEmoji.textContent = currentLevel.emoji;
        if (levelText) levelText.textContent = currentLevel.title;
        
        if (nextLevel) {
            const progress = ((this.userProgress.totalXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100;
            if (xpProgress) xpProgress.style.width = `${Math.min(progress, 100)}%`;
            if (xpText) xpText.textContent = `${this.userProgress.totalXP} / ${nextLevel.minXP} XP`;
        } else {
            if (xpProgress) xpProgress.style.width = '100%';
            if (xpText) xpText.textContent = `${this.userProgress.totalXP} XP (MAX)`;
        }
    }

    showLevelUp(level) {
        const newLevelEmoji = document.getElementById('newLevelEmoji');
        const newLevelText = document.getElementById('newLevelText');
        
        if (newLevelEmoji) newLevelEmoji.textContent = level.emoji;
        if (newLevelText) newLevelText.textContent = level.title;
        
        this.showModal('levelUpModal');
    }

    // Theme Management
    cycleTheme() {
        const themes = ['light', 'dark', 'neon', 'sakura'];
        const currentIndex = themes.indexOf(this.settings.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        this.setTheme(nextTheme);
    }

    setTheme(theme) {
        this.settings.theme = theme;
        this.applySettings();
        this.updateThemeColor();
        this.saveData();
        console.log('Theme changed to:', theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    applySettings() {
        this.applyTheme();
        
        // Update settings form
        const reducedMotion = document.getElementById('reducedMotion');
        const highContrast = document.getElementById('highContrast');
        
        if (reducedMotion) reducedMotion.checked = this.settings.reducedMotion;
        if (highContrast) highContrast.checked = this.settings.highContrast;
        
        // Apply reduced motion
        if (this.settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
        
        // Apply high contrast
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    // Quote Carousel
    startQuoteCarousel() {
        this.updateQuote();
        this.quoteInterval = setInterval(() => {
            this.nextQuote();
        }, 10000); // 10 seconds
    }

    pauseQuoteCarousel() {
        if (this.quoteInterval) {
            clearInterval(this.quoteInterval);
            this.quoteInterval = null;
        }
    }

    resumeQuoteCarousel() {
        if (!this.quoteInterval) {
            this.startQuoteCarousel();
        }
    }

    nextQuote() {
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
        this.updateQuote();
    }

    updateQuote() {
        const quoteElement = document.getElementById('currentQuote');
        if (quoteElement) {
            const quote = this.quotes[this.currentQuoteIndex];
            
            quoteElement.style.opacity = '0';
            setTimeout(() => {
                quoteElement.textContent = quote;
                quoteElement.style.opacity = '1';
            }, 150);
        }
    }

    // Timer System
    startTimer() {
        if (this.timer.isRunning) return;
        
        this.timer.isRunning = true;
        this.timer.isPaused = false;
        this.timer.lastUpdate = Date.now();
        
        this.timer.interval = setInterval(() => {
            this.timer.timeLeft--;
            this.timer.lastUpdate = Date.now();
            this.updateTimerDisplay();
            
            if (this.timer.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
        
        this.updateTimerButtons();
    }

    pauseTimer() {
        if (!this.timer.isRunning) return;
        
        this.timer.isPaused = !this.timer.isPaused;
        
        if (this.timer.isPaused) {
            clearInterval(this.timer.interval);
        } else {
            this.startTimer();
        }
        
        this.updateTimerButtons();
    }

    resetTimer() {
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        this.timer.timeLeft = this.timer.totalTime;
        
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
        }
        
        this.updateTimerDisplay();
        this.updateTimerButtons();
    }

    setTimerPreset(minutes) {
        this.resetTimer();
        this.timer.totalTime = minutes * 60;
        this.timer.timeLeft = this.timer.totalTime;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.timeLeft / 60);
        const seconds = this.timer.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerTime = document.getElementById('timerTime');
        if (timerTime) {
            timerTime.textContent = timeString;
        }
        
        // Update circular progress
        const timerProgress = document.getElementById('timerProgress');
        if (timerProgress) {
            const progress = ((this.timer.totalTime - this.timer.timeLeft) / this.timer.totalTime) * 565.48;
            timerProgress.style.strokeDashoffset = 565.48 - progress;
        }
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        
        if (startBtn && pauseBtn) {
            if (this.timer.isRunning && !this.timer.isPaused) {
                startBtn.textContent = '⏸️ Running';
                startBtn.disabled = true;
                pauseBtn.textContent = '⏸️ Pause';
                pauseBtn.disabled = false;
            } else if (this.timer.isPaused) {
                startBtn.textContent = '▶️ Start';
                startBtn.disabled = false;
                pauseBtn.textContent = '▶️ Resume';
                pauseBtn.disabled = false;
            } else {
                startBtn.textContent = '▶️ Start';
                startBtn.disabled = false;
                pauseBtn.textContent = '⏸️ Pause';
                pauseBtn.disabled = true;
            }
        }
    }

    timerComplete() {
        this.resetTimer();
        this.showNotification('Timer Complete!', 'Time to take a break or start the next session.');
        this.createConfetti();
    }

    // Voice Input
    toggleVoiceInput() {
        const btn = document.getElementById('voiceInputBtn');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser.');
            return;
        }
        
        if (btn && btn.classList.contains('active')) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        const btn = document.getElementById('voiceInputBtn');
        if (btn) btn.classList.add('active');
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const titleInput = document.getElementById('taskTitle');
            if (titleInput) titleInput.value = transcript;
            this.stopVoiceInput();
        };
        
        this.recognition.onerror = () => {
            this.stopVoiceInput();
        };
        
        this.recognition.onend = () => {
            this.stopVoiceInput();
        };
        
        this.recognition.start();
    }

    stopVoiceInput() {
        if (this.recognition) {
            this.recognition.stop();
        }
        
        const btn = document.getElementById('voiceInputBtn');
        if (btn) btn.classList.remove('active');
    }

    // Search and Filter
    searchTasks(query) {
        this.renderTasks(query);
    }

    filterByCategory(category) {
        this.renderTasks(null, category);
    }

    sortTasks(sortBy) {
        this.renderTasks(null, null, sortBy);
    }

    // Rendering
    renderTasks(searchQuery = null, categoryFilter = null, sortBy = 'dueDate') {
        let filteredTodos = this.todos.filter(todo => !todo.completed);
        
        // Apply search
        if (searchQuery) {
            filteredTodos = filteredTodos.filter(todo => 
                todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                todo.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply category filter
        if (categoryFilter) {
            filteredTodos = filteredTodos.filter(todo => todo.category === categoryFilter);
        }
        
        // Apply sorting
        filteredTodos.sort((a, b) => {
            switch (sortBy) {
                case 'priority':
                    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'createdAt':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'dueDate':
                default:
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
            }
        });
        
        // Render today's tasks
        const todayTasks = this.getTodayTasks().filter(todo => !todo.completed);
        this.renderTaskList(todayTasks, 'todayTasks');
        
        // Render all tasks
        this.renderTaskList(filteredTodos, 'taskList');
    }

    renderTaskList(todos, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (todos.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks found 📝</p>';
            return;
        }
        
        container.innerHTML = todos.map(todo => this.createTaskHTML(todo)).join('');
        
        // Add event listeners
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                this.completeTodo(taskId);
            });
        });
        
        container.querySelectorAll('.task-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                this.deleteTodo(taskId);
            });
        });
    }

    createTaskHTML(todo) {
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
        const categoryEmojis = {
            'Personal': '👤',
            'Work': '💼',
            'Health': '💪',
            'Study': '📚',
            'Shopping': '🛒'
        };
        
        return `
            <div class="task-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${todo.id}">
                <div class="task-header">
                    <div class="task-checkbox ${todo.completed ? 'checked' : ''}" data-task-id="${todo.id}"></div>
                    <div class="task-title ${todo.completed ? 'completed' : ''}">${todo.title}</div>
                    <div class="task-priority ${todo.priority.toLowerCase()}">${this.getPriorityEmoji(todo.priority)} ${todo.priority}</div>
                </div>
                
                <div class="task-meta">
                    <div class="task-category">
                        <span>${categoryEmojis[todo.category]} ${todo.category}</span>
                    </div>
                    ${todo.dueDate ? `<div class="task-due-date">📅 ${this.formatDate(todo.dueDate)}</div>` : ''}
                </div>
                
                ${todo.description ? `<div class="task-description">${todo.description}</div>` : ''}
                
                <div class="task-actions">
                    <button class="btn btn--sm btn--outline task-delete" data-task-id="${todo.id}">🗑️ Delete</button>
                </div>
            </div>
        `;
    }

    renderCompletedTasks() {
        const completedTodos = this.todos.filter(todo => todo.completed);
        this.renderTaskList(completedTodos, 'completedTasks');
    }

    getPriorityEmoji(priority) {
        const emojis = { 'High': '🔴', 'Medium': '🟡', 'Low': '🟢' };
        return emojis[priority] || '⚪';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString();
        }
    }

    getTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        return this.todos.filter(todo => todo.dueDate === today);
    }

    // Analytics
    updateAnalytics() {
        const totalTasks = document.getElementById('totalTasks');
        const completedCount = document.getElementById('completedCount');
        const currentStreak = document.getElementById('currentStreak');
        const totalXP = document.getElementById('totalXP');
        
        if (totalTasks) totalTasks.textContent = this.todos.length;
        if (completedCount) completedCount.textContent = this.userProgress.totalCompleted;
        if (currentStreak) currentStreak.textContent = this.userProgress.streak;
        if (totalXP) totalXP.textContent = this.userProgress.totalXP;
    }

    // Animations
    animateTaskAdd() {
        // Add XP animation
        this.addXP(0); // Just update the display
    }

    animateTaskCompletion(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('task-completing');
            setTimeout(() => {
                this.renderTasks();
            }, 500);
        }
    }

    createConfetti() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        
        // Create particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + 10,
                vx: (Math.random() - 0.5) * 6,
                vy: -(Math.random() * 8 + 4),
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 2,
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // gravity
                p.life -= p.decay;
                
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
            
            if (particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        
        animate();
    }

    createLevelUpParticles() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FFB347'];
        
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 3,
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.99;
                p.vy *= 0.99;
                p.life -= p.decay;
                
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
            
            if (particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        
        animate();
    }

    // Notifications
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon-192x192.png' });
        }
    }

    // Modals
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            
            // Focus management
            setTimeout(() => {
                const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable) focusable.focus();
            }, 100);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Data Management
    exportData() {
        const data = {
            todos: this.todos,
            userProgress: this.userProgress,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todowa-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.todos) this.todos = data.todos;
            if (data.userProgress) this.userProgress = { ...this.userProgress, ...data.userProgress };
            if (data.settings) this.settings = { ...this.settings, ...data.settings };
            
            await this.saveData();
            this.updateDisplay();
            this.applySettings();
            
            alert('Data imported successfully!');
        } catch (error) {
            console.error('Failed to import data:', error);
            alert('Failed to import data. Please check the file format.');
        }
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) return;
        
        try {
            // Clear IndexedDB
            const transaction = this.db.transaction(['todos', 'userProgress', 'settings'], 'readwrite');
            transaction.objectStore('todos').clear();
            transaction.objectStore('userProgress').clear();
            transaction.objectStore('settings').clear();
            
            // Reset in-memory data
            this.todos = [];
            this.userProgress = {
                level: 0,
                xp: 0,
                totalXP: 0,
                streak: 0,
                lastCompletionDate: null,
                completedToday: 0,
                totalCompleted: 0
            };
            
            this.updateDisplay();
            alert('All data cleared successfully!');
            
        } catch (error) {
            console.error('Failed to clear data:', error);
            alert('Failed to clear data.');
        }
    }

    // Display Updates
    updateDisplay() {
        this.renderTasks();
        this.updateLevelDisplay();
        this.updateAnalytics();
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todowaApp = new TodowaApp();
});

// Handle page visibility for timer persistence
document.addEventListener('visibilitychange', () => {
    if (window.todowaApp && window.todowaApp.timer) {
        if (document.hidden) {
            localStorage.setItem('todowaTimerState', JSON.stringify({
                ...window.todowaApp.timer,
                lastUpdate: Date.now()
            }));
        } else {
            const savedState = localStorage.getItem('todowaTimerState');
            if (savedState) {
                try {
                    const timerState = JSON.parse(savedState);
                    const elapsed = Math.floor((Date.now() - timerState.lastUpdate) / 1000);
                    if (timerState.isRunning && !timerState.isPaused) {
                        window.todowaApp.timer.timeLeft = Math.max(0, timerState.timeLeft - elapsed);
                        window.todowaApp.updateTimerDisplay();
                    }
                } catch (e) {
                    console.error('Failed to restore timer state:', e);
                }
            }
        }
    }
});

// Handle resize for particle canvas
window.addEventListener('resize', () => {
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// Service Worker messaging
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
            const updateBanner = document.createElement('div');
            updateBanner.className = 'update-banner';
            updateBanner.innerHTML = `
                <div class="update-content">
                    <span>🆕 New version available!</span>
                    <button onclick="window.location.reload()" class="btn btn--primary btn--sm">Update</button>
                </div>
            `;
            document.body.prepend(updateBanner);
        }
    });
}