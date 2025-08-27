// Todowa PWA - Main Application Script
// Simplified and robust implementation

let app = {
    // Application state
    tasks: [],
    currentTheme: 'dark',
    currentQuoteIndex: 0,
    quotePaused: false,
    quoteTimer: null,
    userProgress: {
        id: 'main',
        exp: 0,
        level: 0,
        streak: 0,
        totalCompleted: 0
    },
    
    // Sample data
    sampleTodos: [
        {"id":1,"title":"Finish chemistry notes","description":"Summarize chapter 4","category":"Study","priority":"High","dueDate":"2025-08-28","createdAt":"2025-08-27","completed":false},
        {"id":2,"title":"30-min workout","description":"Upper body routine","category":"Health","priority":"Medium","dueDate":"2025-08-27","createdAt":"2025-08-27","completed":false},
        {"id":3,"title":"Buy groceries","description":"Milk, eggs, bread","category":"Shopping","priority":"Low","dueDate":"2025-08-27","createdAt":"2025-08-27","completed":false},
        {"id":4,"title":"Publish blog post","description":"Draft AI study tips article","category":"Work","priority":"Medium","dueDate":"2025-08-30","createdAt":"2025-08-27","completed":false},
        {"id":5,"title":"Read 20 pages","description":"Atomic Habits","category":"Personal","priority":"Low","dueDate":"2025-08-27","createdAt":"2025-08-27","completed":false}
    ],
    
    quotes: [
        "The secret of getting ahead is getting started.",
        "Don't watch the clock; do what it does. Keep going.",
        "Success is the sum of small efforts repeated day in and day out.",
        "Your future is created by what you do today, not tomorrow.",
        "Action is the foundational key to all success.",
        "Well done is better than well said.",
        "The way to get started is to quit talking and begin doing.",
        "Innovation distinguishes between a leader and a follower.",
        "Life is what happens to you while you're busy making other plans.",
        "The future belongs to those who believe in the beauty of their dreams.",
        "It is during our darkest moments that we must focus to see the light.",
        "You miss 100% of the shots you don't take.",
        "Whether you think you can or you think you can't, you're right.",
        "A person who never made a mistake never tried anything new.",
        "The only impossible journey is the one you never begin."
    ],
    
    levelSystem: {
        0: { name: 'Newbie', emoji: '🆕', threshold: 0 },
        1: { name: 'Challenger', emoji: '⚡', threshold: 10 },
        2: { name: 'Professional', emoji: '💼', threshold: 30 },
        3: { name: 'Hacker', emoji: '🔥', threshold: 60 },
        4: { name: 'Developer', emoji: '👨‍💻', threshold: 80 },
        5: { name: 'Monarch', emoji: '👑', threshold: 100 },
        6: { name: 'LEGEND', emoji: '🏆', threshold: 200 }
    },

    // Initialize the application
    init() {
        console.log('Initializing Todowa App...');
        
        try {
            this.loadUserData();
            this.loadTheme();
            this.updateCurrentDate();
            this.initQuotes();
            this.renderTasks();
            this.updateStats();
            this.updateLevelDisplay();
            this.initEventListeners();
            
            console.log('Todowa App initialized successfully!');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    },

    // Load user data from localStorage
    loadUserData() {
        try {
            // Load tasks
            const savedTasks = localStorage.getItem('todowa-tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            } else {
                // First run - add sample tasks
                this.tasks = [...this.sampleTodos];
                this.saveTasks();
                this.showToast('Welcome to Todowa! Sample tasks added! 🎯', 'success');
            }
            
            // Load user progress
            const savedProgress = localStorage.getItem('todowa-userProgress');
            if (savedProgress) {
                this.userProgress = JSON.parse(savedProgress);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.tasks = [...this.sampleTodos];
        }
    },

    // Save tasks to localStorage
    saveTasks() {
        try {
            localStorage.setItem('todowa-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    },

    // Save user progress to localStorage
    saveUserProgress() {
        try {
            localStorage.setItem('todowa-userProgress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('Error saving user progress:', error);
        }
    },

    // Theme management
    loadTheme() {
        const savedTheme = localStorage.getItem('todowa-theme') || 'dark';
        this.setTheme(savedTheme);
    },

    setTheme(theme) {
        console.log('Setting theme to:', theme);
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('todowa-theme', theme);
        
        // Update theme icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            const icons = { dark: '🌙', neon: '⚡', sakura: '🌸' };
            themeIcon.textContent = icons[theme] || '🌙';
        }
        
        // Update theme options
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-theme') === theme) {
                option.classList.add('active');
            }
        });
    },

    cycleTheme() {
        const themes = ['dark', 'neon', 'sakura'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    },

    // Date management
    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        const dateString = now.toLocaleDateString('en-US', options);
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            currentDateElement.textContent = dateString;
        }
        
        // Update every minute
        setTimeout(() => this.updateCurrentDate(), 60000);
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
        if (diffDays > 0) return `In ${diffDays} days`;
        
        return date.toLocaleDateString();
    },

    isOverdue(dateString) {
        const today = new Date();
        const dueDate = new Date(dateString);
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    },

    // Quote management
    initQuotes() {
        this.showCurrentQuote();
        this.startQuoteRotation();
    },

    showCurrentQuote() {
        const quoteText = document.getElementById('quoteText');
        if (quoteText && this.quotes.length > 0) {
            quoteText.style.opacity = '0';
            setTimeout(() => {
                quoteText.textContent = this.quotes[this.currentQuoteIndex];
                quoteText.style.opacity = '1';
            }, 250);
        }
    },

    nextQuote() {
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
        this.showCurrentQuote();
    },

    startQuoteRotation() {
        if (!this.quotePaused) {
            this.quoteTimer = setInterval(() => {
                if (!this.quotePaused) {
                    this.nextQuote();
                }
            }, 10000);
        }
    },

    toggleQuotePause() {
        this.quotePaused = !this.quotePaused;
        const pauseBtn = document.getElementById('quotePause');
        if (pauseBtn) {
            pauseBtn.textContent = this.quotePaused ? '▶️' : '⏸️';
        }
        
        if (this.quotePaused && this.quoteTimer) {
            clearInterval(this.quoteTimer);
            this.quoteTimer = null;
        } else if (!this.quotePaused && !this.quoteTimer) {
            this.startQuoteRotation();
        }
    },

    // Level and XP management
    addExp(amount, reason = '') {
        const oldLevel = this.userProgress.level;
        this.userProgress.exp += amount;
        
        // Calculate new level
        let newLevel = 0;
        for (let i = Object.keys(this.levelSystem).length - 1; i >= 0; i--) {
            if (this.userProgress.exp >= this.levelSystem[i].threshold) {
                newLevel = parseInt(i);
                break;
            }
        }
        
        this.userProgress.level = newLevel;
        this.saveUserProgress();
        this.updateLevelDisplay();
        
        // Show level up if leveled up
        if (newLevel > oldLevel) {
            this.showLevelUpModal(newLevel);
        }
        
        // Show XP toast
        this.showToast(`+${amount} XP ${reason}`, 'success');
    },

    updateLevelDisplay() {
        const currentLevel = this.userProgress.level;
        const levelInfo = this.levelSystem[currentLevel];
        const nextLevelInfo = this.levelSystem[currentLevel + 1];
        
        // Update level badge
        const levelEmoji = document.getElementById('levelEmoji');
        const levelText = document.getElementById('levelText');
        if (levelEmoji && levelText) {
            levelEmoji.textContent = levelInfo.emoji;
            levelText.textContent = levelInfo.name;
        }
        
        // Update XP bar
        const expFill = document.getElementById('expFill');
        const expText = document.getElementById('expText');
        
        if (expFill && expText) {
            if (nextLevelInfo) {
                const currentExp = this.userProgress.exp - levelInfo.threshold;
                const neededExp = nextLevelInfo.threshold - levelInfo.threshold;
                const percentage = Math.max(0, (currentExp / neededExp) * 100);
                
                expFill.style.width = `${Math.min(percentage, 100)}%`;
                expText.textContent = `${this.userProgress.exp} / ${nextLevelInfo.threshold} XP`;
            } else {
                expFill.style.width = '100%';
                expText.textContent = `MAX LEVEL - ${this.userProgress.exp} XP`;
            }
        }
    },

    showLevelUpModal(newLevel) {
        const levelInfo = this.levelSystem[newLevel];
        const modal = document.getElementById('levelUpModal');
        
        if (modal) {
            const newLevelEmoji = document.getElementById('newLevelEmoji');
            const newLevelName = document.getElementById('newLevelName');
            
            if (newLevelEmoji && newLevelName) {
                newLevelEmoji.textContent = levelInfo.emoji;
                newLevelName.textContent = levelInfo.name;
            }
            
            modal.classList.add('active');
        }
    },

    // Task management
    addTask(task) {
        if (!task.id) {
            task.id = Date.now() + Math.random();
            task.createdAt = new Date().toISOString().split('T')[0];
        }
        
        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        console.log('Task added:', task);
    },

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast('Task deleted!', 'info');
        }
    },

    toggleTaskComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            
            if (task.completed) {
                task.completedAt = new Date().toISOString().split('T')[0];
                this.userProgress.totalCompleted++;
                this.addExp(2, 'for completing a task!');
                this.showCompletionCelebration(id);
            } else {
                task.completedAt = null;
                if (this.userProgress.totalCompleted > 0) {
                    this.userProgress.totalCompleted--;
                }
            }
            
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    },

    showCompletionCelebration(taskId) {
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskCard) {
            taskCard.classList.add('completed');
            
            // Create confetti effect
            for (let i = 0; i < 10; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: fixed;
                    width: 6px;
                    height: 6px;
                    background: var(--accent-primary);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000;
                `;
                
                const rect = taskCard.getBoundingClientRect();
                particle.style.left = (rect.left + rect.width / 2) + 'px';
                particle.style.top = (rect.top + rect.height / 2) + 'px';
                
                document.body.appendChild(particle);
                
                // Animate particle
                const angle = (Math.PI * 2 * i) / 10;
                const velocity = 50 + Math.random() * 30;
                const vx = Math.cos(angle) * velocity;
                const vy = Math.sin(angle) * velocity;
                
                particle.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${vx}px, ${vy + 20}px) scale(0)`, opacity: 0 }
                ], {
                    duration: 500,
                    easing: 'ease-out'
                }).onfinish = () => particle.remove();
            }
        }
    },

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const allTasksList = document.getElementById('allTasksList');
        const completedTasksList = document.getElementById('completedTasksList');
        
        const renderTaskCard = (task) => {
            const isOverdue = !task.completed && this.isOverdue(task.dueDate);
            const categoryIcons = {
                'Work': '💼',
                'Personal': '👤',
                'Health': '💪',
                'Study': '📚',
                'Shopping': '🛒'
            };
            
            const priorityIcons = {
                'High': '🔴',
                'Medium': '🟡',
                'Low': '🟢'
            };
            
            return `
                <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTaskComplete(${task.id})">
                    </div>
                    <div class="task-content" onclick="app.showTaskDetail(${task.id})">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            <div class="task-category">
                                <span>${categoryIcons[task.category]}</span>
                                <span>${task.category}</span>
                            </div>
                            <div class="task-priority">
                                <span>${priorityIcons[task.priority]}</span>
                                <span>${task.priority}</span>
                            </div>
                            <div class="task-due-date">
                                Due: ${this.formatDate(task.dueDate)}
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" onclick="app.showTaskDetail(${task.id})" title="Edit Task">
                            ✏️
                        </button>
                        <button class="task-action-btn" onclick="app.showTaskTimer(${task.id})" title="Start Timer">
                            ⏰
                        </button>
                        <button class="task-action-btn" onclick="app.deleteTask(${task.id})" title="Delete Task">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        };
        
        // Render to dashboard
        if (taskList) {
            const activeTasks = this.tasks.filter(task => !task.completed);
            taskList.innerHTML = activeTasks.length > 0 
                ? activeTasks.map(renderTaskCard).join('') 
                : '<div class="empty-state">No active tasks. Add one above! 🎯</div>';
        }
        
        // Render to all tasks view
        if (allTasksList) {
            allTasksList.innerHTML = this.tasks.length > 0 
                ? this.tasks.map(renderTaskCard).join('') 
                : '<div class="empty-state">No tasks found. 📝</div>';
        }
        
        // Render to completed view
        if (completedTasksList) {
            const completedTasks = this.tasks.filter(task => task.completed);
            completedTasksList.innerHTML = completedTasks.length > 0 
                ? completedTasks.map(renderTaskCard).join('') 
                : '<div class="empty-state">No completed tasks yet. Complete some tasks! ✅</div>';
        }
    },

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(task => task.dueDate === today && !task.completed).length;
        
        const totalElement = document.getElementById('totalTasks');
        const completedElement = document.getElementById('completedTasks');
        const todayElement = document.getElementById('todayTasks');
        const streakElement = document.getElementById('currentStreak');
        
        if (totalElement) totalElement.textContent = total;
        if (completedElement) completedElement.textContent = completed;
        if (todayElement) todayElement.textContent = todayTasks;
        if (streakElement) streakElement.textContent = this.userProgress.streak;
    },

    // Navigation management
    switchView(viewName) {
        console.log('Switching to view:', viewName);
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show selected view
        const viewElement = document.getElementById(viewName + 'View');
        if (viewElement) {
            viewElement.classList.remove('hidden');
        }
        
        // Re-render tasks for specific views
        if (viewName === 'allTasks' || viewName === 'completed') {
            this.renderTasks();
        }
        
        // Close sidebar
        this.closeSidebar();
    },

    openSidebar() {
        console.log('Opening sidebar');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        const hamburger = document.getElementById('hamburgerBtn');
        
        if (sidebar) sidebar.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
        if (hamburger) hamburger.classList.add('active');
    },

    closeSidebar() {
        console.log('Closing sidebar');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        const hamburger = document.getElementById('hamburgerBtn');
        
        if (sidebar) sidebar.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    },

    // Modal management
    showTaskDetail(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskDescription').value = task.description || '';
            document.getElementById('editTaskCategory').value = task.category;
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editTaskDueDate').value = task.dueDate;
            
            document.getElementById('taskDetailModal').classList.add('active');
        }
    },

    showTaskTimer(id) {
        document.getElementById('timerModal').classList.add('active');
    },

    // Utility functions
    showToast(message, type = 'info') {
        const toast = document.getElementById('successToast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.querySelector('.toast-icon');
        
        if (toast && toastMessage && toastIcon) {
            const icons = {
                success: '🎉',
                error: '❌',
                info: 'ℹ️',
                warning: '⚠️'
            };
            
            toastIcon.textContent = icons[type] || 'ℹ️';
            toastMessage.textContent = message;
            
            toast.classList.add('active');
            
            setTimeout(() => {
                toast.classList.remove('active');
            }, 3000);
        }
    },

    // Event listeners
    initEventListeners() {
        console.log('Initializing event listeners...');
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.cycleTheme();
            });
        }
        
        // Hamburger menu
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openSidebar();
            });
        }
        
        // Sidebar controls
        const closeSidebarBtn = document.getElementById('closeSidebar');
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSidebar();
            });
        }
        
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSidebar();
            });
        }
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.switchView(view);
            });
        });
        
        // Add task form
        const addTaskForm = document.getElementById('addTaskForm');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const titleInput = document.getElementById('taskTitle');
                const descriptionInput = document.getElementById('taskDescription');
                const categoryInput = document.getElementById('taskCategory');
                const priorityInput = document.getElementById('taskPriority');
                const dueDateInput = document.getElementById('taskDueDate');
                
                const task = {
                    title: titleInput.value.trim(),
                    description: descriptionInput.value.trim(),
                    category: categoryInput.value,
                    priority: priorityInput.value,
                    dueDate: dueDateInput.value,
                    completed: false
                };
                
                if (task.title && task.dueDate) {
                    this.addTask(task);
                    addTaskForm.reset();
                    
                    // Set default due date to today
                    const today = new Date().toISOString().split('T')[0];
                    dueDateInput.value = today;
                    
                    this.showToast('Task added successfully! 📝', 'success');
                } else {
                    this.showToast('Please fill in the required fields!', 'error');
                }
            });
        }
        
        // Edit task form
        const editTaskForm = document.getElementById('editTaskForm');
        if (editTaskForm) {
            editTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const taskId = parseFloat(document.getElementById('editTaskId').value);
                const task = this.tasks.find(t => t.id === taskId);
                
                if (task) {
                    task.title = document.getElementById('editTaskTitle').value.trim();
                    task.description = document.getElementById('editTaskDescription').value.trim();
                    task.category = document.getElementById('editTaskCategory').value;
                    task.priority = document.getElementById('editTaskPriority').value;
                    task.dueDate = document.getElementById('editTaskDueDate').value;
                    
                    this.saveTasks();
                    this.renderTasks();
                    document.getElementById('taskDetailModal').classList.remove('active');
                    this.showToast('Task updated successfully! ✅', 'success');
                }
            });
        }
        
        // Delete task button
        const deleteTaskBtn = document.getElementById('deleteTask');
        if (deleteTaskBtn) {
            deleteTaskBtn.addEventListener('click', () => {
                const taskId = parseFloat(document.getElementById('editTaskId').value);
                document.getElementById('taskDetailModal').classList.remove('active');
                this.deleteTask(taskId);
            });
        }
        
        // Quote controls
        const quotePause = document.getElementById('quotePause');
        if (quotePause) {
            quotePause.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleQuotePause();
            });
        }
        
        // Modal controls
        document.querySelectorAll('.modal-close, #closeLevelUp, #closeTimerModal, #closeTaskDetail, #closeDeveloperModal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Developer credit
        const developerCredit = document.getElementById('developerCredit');
        if (developerCredit) {
            developerCredit.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = document.getElementById('developerModal');
                if (modal) {
                    modal.classList.add('active');
                }
            });
        }
        
        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });
        
        // Set default due date to today
        const today = new Date().toISOString().split('T')[0];
        const taskDueDate = document.getElementById('taskDueDate');
        if (taskDueDate) {
            taskDueDate.value = today;
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        const taskTitle = document.getElementById('taskTitle');
                        if (taskTitle) taskTitle.focus();
                        break;
                    case 't':
                        e.preventDefault();
                        this.cycleTheme();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                // Close any open modals
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
                
                // Close sidebar
                this.closeSidebar();
            }
        });
        
        console.log('Event listeners initialized successfully');
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Todowa...');
    app.init();
});

// Expose app globally for onclick handlers
window.app = app;

console.log('Todowa PWA script loaded successfully! 🎯');