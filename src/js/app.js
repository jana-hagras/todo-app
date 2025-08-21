document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    const tasksContainer = document.getElementById('tasksContainer');
    const taskStats = document.getElementById('taskStats');
    let currentFilter = 'all';
    let currentSort = 'createdAt';
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    taskForm.addEventListener('submit', handleTaskSubmit);
    setupEventListeners();
    loadTasks();
    updateTaskStats();

    function handleTaskSubmit(e) {
        e.preventDefault();
        if (!taskForm.checkValidity()) {
            e.stopPropagation();
            taskForm.classList.add('was-validated');
            return;
        }

        const formData = new FormData(taskForm);
        const task = {
            id: Date.now(),
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            dueDate: formData.get('dueDate'),
            priority: formData.get('priority'),
            completed: false,
            createdAt: new Date().toISOString()
        };

        addTask(task);
        showNotification('Task added successfully!', 'success');
        taskForm.reset();
        taskForm.classList.remove('was-validated');
        loadTasks();
    }

    function setupEventListeners() {
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('[data-filter]').forEach(btn => 
                    btn.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                loadTasks();
            });
        });

        document.querySelectorAll('[data-sort]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                currentSort = e.target.dataset.sort;
                loadTasks();
            });
        });
    }

    function loadTasks() {
        let tasks = getTasks();
        tasks = filterTasks(tasks);
        tasks = sortTasks(tasks);
        renderTasks(tasks);
        updateTaskStats();
    }

    function filterTasks(tasks) {
        switch(currentFilter) {
            case 'active': return tasks.filter(task => !task.completed);
            case 'completed': return tasks.filter(task => task.completed);
            default: return tasks;
        }
    }

    function sortTasks(tasks) {
        return tasks.sort((a, b) => {
            switch(currentSort) {
                case 'dueDate':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priority = { high: 3, medium: 2, low: 1 };
                    return priority[b.priority] - priority[a.priority];
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }

    function renderTasks(tasks) {
        tasksContainer.innerHTML = tasks.map(task => `
            <div class="card task-card animate__animated animate__fadeIn ${task.completed ? 'task-completed' : ''}" 
                 data-id="${task.id}">
                <div class="priority-indicator priority-${task.priority}"></div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title task-title mb-0">${task.title}</h5>
                        <div class="task-actions">
                            <button onclick="toggleComplete(${task.id})" 
                                    class="btn btn-sm ${task.completed ? 'btn-outline-warning' : 'btn-outline-success'} me-2"
                                    data-bs-toggle="tooltip"
                                    title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                                <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                            </button>
                            <button onclick="deleteTask(${task.id})"
                                    class="btn btn-sm btn-outline-danger"
                                    data-bs-toggle="tooltip"
                                    title="Delete task">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${task.description ? `
                        <p class="card-text mt-2 mb-2">${task.description}</p>
                    ` : ''}
                    <div class="task-meta">
                        <span class="me-3" data-bs-toggle="tooltip" title="Due date">
                            <i class="fas fa-calendar-alt"></i> ${formatDate(task.dueDate)}
                        </span>
                        <span class="me-3" data-bs-toggle="tooltip" title="Priority">
                            <i class="fas fa-flag"></i> ${task.priority}
                        </span>
                        <span data-bs-toggle="tooltip" title="Created">
                            <i class="fas fa-clock"></i> ${timeAgo(task.createdAt)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function getTasks() {
        return JSON.parse(localStorage.getItem('tasks')) || [];
    }

    function addTask(task) {
        const tasks = getTasks();
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function updateTaskStats() {
        const tasks = getTasks();
        const completed = tasks.filter(t => t.completed).length;
        taskStats.textContent = `Total: ${tasks.length} | Active: ${tasks.length - completed} | Completed: ${completed}`;
    }

    function showNotification(message, type = 'success') {
        const noteId = `${type}Note`;
        const notification = document.getElementById(noteId);
        
        if (notification) {
            notification.querySelector('.note-message').textContent = message;
                        notification.classList.remove('d-none', 'animate__fadeOutRight');
            notification.classList.add('animate__fadeInRight');
                        setTimeout(() => {
                notification.classList.add('animate__fadeOutRight');
                setTimeout(() => {
                    notification.classList.add('d-none');
                }, 500);
            }, 5000);
                        notification.querySelector('.btn-close').onclick = () => {
                notification.classList.add('animate__fadeOutRight');
                setTimeout(() => {
                    notification.classList.add('d-none');
                }, 500);
            };
        }
    }

    function formatDate(date) {
        if (!date) return 'No due date';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };
        
        for (let [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        return 'Just now';
    }

    window.toggleComplete = (id) => {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            loadTasks();
            showNotification(`Task marked as ${task.completed ? 'completed' : 'incomplete'}`);
        }
    };

    window.deleteTask = (id) => {
        const taskEl = document.querySelector(`[data-id="${id}"]`);
        taskEl.classList.add('animate-delete');
        
        setTimeout(() => {
            if (confirm('Are you sure you want to delete this task?')) {
                let tasks = getTasks();
                tasks = tasks.filter(task => task.id !== id);
                localStorage.setItem('tasks', JSON.stringify(tasks));
                loadTasks();
                showNotification('Task deleted successfully');
            } else {
                taskEl.classList.remove('animate-delete');
            }
        }, 300);
    };
});