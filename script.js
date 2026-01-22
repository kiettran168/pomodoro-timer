let timerInterval = null;
let sessionCount = 0;

const sessions = {
    // work: 25,
    work: 1,
    break: 5,
    lbreak: 15
};
let currSession = 'work'
document.getElementById('work').classList.add('bg-white', 'ring-4', 'ring-blue-500', 'ring-opacity-50');

function startTimer() {
    // If timer is already running, stop it first
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(function() {
        let second = parseInt(document.getElementById('seconds').textContent);
        let minute = parseInt(document.getElementById('minutes').textContent);
        
        if (second === 0) {
            if (minute === 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                if (currSession === 'work') {
                    switchSession('break');
                    alert("Work session complete! Time for a break. ☕");
                } else {
                    switchSession('work');
                    alert("Break over! Back to work. 💪");
                }
                sessionCount++;
                // document.getElementById('session-count').textContent = sessionCount;
                if (tasks) {
                    for (let i = 0; i < tasks.length; i++){
                        if (!tasks[i].completed) {
                            tasks[i].completedPomodoros++;
                            // console.log(tasks[i].completedPomodoros);
                            saveTasks();
                            renderTasks();
                            break;
                        }
                    }
                }
                if (sessionCount % 4 === 0) {
                    switchSession('lbreak');
                }
                return;
            } else {
                minute--;
                second = 59;
            }
        } else {
            second--;
        }
        
        // Update display with proper formatting
        document.getElementById('seconds').textContent = second.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minute.toString().padStart(2, '0');
        
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    // Stop timer if running
    pauseTimer();
    
    const session = sessions[currSession]
    document.getElementById('seconds').textContent = '00'
    document.getElementById('minutes').textContent = session.toString().padStart(2, '0');

}

function switchSession(sessType) {
    currSession = sessType;
    pauseTimer();

    const session = sessions[currSession]
    document.getElementById('seconds').textContent = '00'
    document.getElementById('minutes').textContent = session.toString().padStart(2, '0');

    document.querySelectorAll('#session-selector button').forEach(btn => {
        btn.classList.remove('bg-white', 'ring-4', 'ring-blue-500', 'ring-opacity-50');
    });
    
    document.getElementById(sessType).classList.add('bg-white', 'ring-4', 'ring-blue-500', 'ring-opacity-50');
}

let tasks = [];
const TASKS_STORAGE_KEY = 'pomodoro_tasks';

// Helper function to escape HTML (security)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load tasks from localStorage
 */
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            console.log(`Loaded ${parsedTasks.length} tasks from localStorage`);
            return parsedTasks;
        }
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
    return [];
}

/**
 * Save tasks to localStorage
 */
function saveTasks() {
    try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        console.log(`Saved ${tasks.length} tasks to localStorage`);
    } catch (error) {
        console.error('Failed to save tasks:', error);
    }
}

/**
 * Add a new task
 */
function addTask(text, pomodoros) {
    if (!text || text.trim() === '') {
        console.warn("Cannot add empty task");
        return null;
    }

    const newTask = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: Date.now(),
        completedAt: null,
        pomodoros: pomodoros,
        completedPomodoros: 0
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    console.log(`Added task: "${newTask.text}" (ID: ${newTask.id}) with ${pomodoros} pomodoro(s)`);
    return newTask;
}

/**
 * Toggle task completion status
 */
function toggleTask(id) {
    // Find the task by ID
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
        console.warn(`Task with ID ${id} not found`);
        return;
    }
    
    // Toggle completion status
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    
    // Update completion timestamp
    if (tasks[taskIndex].completed) {
        tasks[taskIndex].completedAt = Date.now();
        console.log(`Marked task as complete: "${tasks[taskIndex].text}"`);
    } else {
        tasks[taskIndex].completedAt = null;
        console.log(`Marked task as incomplete: "${tasks[taskIndex].text}"`);
    }
    
    // Save and re-render
    saveTasks();
    renderTasks();
}

/**
 * Remove a task by ID
 */
function removeTask(id) {
    // Find the task by ID
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
        console.warn(`Task with ID ${id} not found`);
        return;
    }
    
    const taskText = tasks[taskIndex].text;
    
    // Remove from array
    tasks.splice(taskIndex, 1);
    
    // Save and re-render
    saveTasks();
    renderTasks();
    
    console.log(`Removed task: "${taskText}"`);
}

/**
 * Create HTML element for a single task with pomodoro info
 */
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item`;
    taskDiv.dataset.taskId = task.id;
    
    // Create task element with pomodoro counter
    taskDiv.innerHTML = `
        <div class="flex items-center bg-blue-50 mx-4 py-2 rounded mb-2 ${task.completed ? 'opacity-75' : ''}">
            <input type="checkbox" class="task-checkbox ml-4 mr-4 h-5 w-5 cursor-pointer" 
                   ${task.completed ? 'checked' : ''}
                   data-task-id="${task.id}"
                   aria-label="${task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}">
            
            <span class="task-text flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}">
                ${escapeHtml(task.text)}
            </span>
            
            <!-- Pomodoro counter -->
            <span class="pomodoro-counter text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                <i class="fas fa-clock mr-1"></i>${task.completedPomodoros}/${task.pomodoros}
            </span>
            
            <button class="delete-task text-red-500 mr-4 hover:text-red-700 transition duration-200" 
                    data-task-id="${task.id}"
                    aria-label="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return taskDiv;
}

/**
 * Render all tasks to the DOM with empty state
 */
function renderTasks() {
    const taskListContainer = document.getElementById('task-list');
    
    // Clear the container completely
    taskListContainer.innerHTML = '';
    
    // If no tasks, show empty state
    if (tasks.length === 0) {
        taskListContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-clipboard-list text-4xl mb-4"></i>
                <p class="text-lg">No tasks yet</p>
                <p class="text-sm mt-2">Add your first task above!</p>
            </div>
        `;
        return;
    }
    
    // Create and add all tasks
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskListContainer.appendChild(taskElement);
    });
    
    // Add event listeners to the newly created tasks
    setupTaskItemEventListeners();
    
    // Add task statistics display
    addTaskStatsDisplay();
}

/**
 * Add task statistics display below the task list
 */
function addTaskStatsDisplay() {
    const taskStatsDisplay = document.getElementById('stats-panel');
    taskStatsDisplay.innerHTML = '';
    
    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const remainingTasks = totalTasks - completedTasks;
    const totalPomodoros = tasks.reduce((sum, task) => sum + task.pomodoros, 0);
    const completedPomodoros = tasks.reduce((sum, task) => sum + task.completedPomodoros, 0);
    
    // Create stats element
    const statsElement = document.createElement('div');
    statsElement.className = 'mt-4 pt-4 border-t border-gray-300 text-sm text-gray-600';
    statsElement.innerHTML = `
        <div class="flex flex-wrap justify-center gap-4">
            <div class="text-center">
                <div class="font-bold ${remainingTasks > 0 ? 'text-blue-600' : 'text-green-600'}">${remainingTasks}</div>
                <div class="text-xs">Tasks Remaining</div>
            </div>
            <div class="text-center">
                <div class="font-bold text-green-600">${completedTasks}</div>
                <div class="text-xs">Completed</div>
            </div>
            <div class="text-center">
                <div class="font-bold text-gray-700">${totalTasks}</div>
                <div class="text-xs">Total Tasks</div>
            </div>
            <div class="text-center">
                <div class="font-bold text-purple-600">${completedPomodoros}/${totalPomodoros}</div>
                <div class="text-xs">Pomodoros</div>
            </div>
        </div>
    `;
    
    taskStatsDisplay.appendChild(statsElement);
}

/**
 * Clear ALL tasks
 */
function clearAllTasks() {
    // Check if there are any tasks to clear
    if (tasks.length === 0) {
        alert("No tasks to clear!");
        return;
    }
    
    // Ask for confirmation
    const confirmed = confirm(`Are you sure you want to delete ALL ${tasks.length} tasks? This cannot be undone.`);
    
    if (confirmed) {
        // Clear the tasks array
        tasks = [];
        
        // Save empty array to localStorage
        saveTasks();
        
        // Re-render to show empty state
        renderTasks();
        
        console.log("Cleared all tasks");
    }
}

/**
 * Set up event listeners for individual task items
 */
function setupTaskItemEventListeners() {
    // Add event listeners to all checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function(event) {
            // Stop propagation to prevent multiple triggers
            event.stopPropagation();
            
            const taskId = parseInt(this.dataset.taskId);
            toggleTask(taskId);
        });
    });
    
    // Add event listeners to all delete buttons
    document.querySelectorAll('.delete-task').forEach(deleteBtn => {
        deleteBtn.addEventListener('click', function(event) {
            // Stop propagation to prevent multiple triggers
            event.stopPropagation();
            
            const taskId = parseInt(this.dataset.taskId);
            
            // Optional: Add confirmation dialog
            if (confirm('Are you sure you want to delete this task?')) {
                removeTask(taskId);
            }
        });
    });
    
    // Optional: Add click event to entire task for completion toggle
    document.querySelectorAll('.task-item').forEach(taskItem => {
        taskItem.addEventListener('click', function(event) {
            // Only trigger if click wasn't on checkbox or delete button
            if (!event.target.closest('.task-checkbox') && !event.target.closest('.delete-task')) {
                const taskId = parseInt(this.dataset.taskId);
                toggleTask(taskId);
            }
        });
    });
}

/**
 * Initialize task manager
 */
function initializeTaskManager() {
    console.log("Initializing task manager...");
    
    // Load tasks from localStorage
    tasks = loadTasks();
    console.log(`Loaded ${tasks.length} tasks from storage`);
    
    // Render initial tasks
    renderTasks();
}

/**
 * Set up event listeners for task form
 */
function setupTaskEventListeners() {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task');
    const estPomo = document.getElementById('pomodoros');
    let pomo = 1;

    if (!taskForm || !taskInput) {
        console.error('Task form or input not found');
        return;
    }

    // Form submission (Add task)
    taskForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent page reload
    
        const taskText = taskInput.value.trim();
        if (estPomo) {
            pomo = parseInt(estPomo.value);
        }
        
        if (taskText) {
            addTask(taskText, pomo);
            taskInput.value = ''; // Clear input
            taskInput.focus(); // Keep focus on input
        }
    });

    const clearAllBtn = document.getElementById('clear-all-tasks');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllTasks);
    }
}

// Event listeners for timer
document.getElementById('start-btn').addEventListener('click', startTimer);
document.getElementById('pause-btn').addEventListener('click', pauseTimer);
document.getElementById('reset-btn').addEventListener('click', resetTimer);

// Event listeners for session switching
document.getElementById('work').addEventListener('click', function() {
    switchSession('work');
});
document.getElementById('break').addEventListener('click', function() {
    switchSession('break');
});
document.getElementById('lbreak').addEventListener('click', function() {
    switchSession('lbreak');
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize task manager
    initializeTaskManager();
    setupTaskEventListeners();
});