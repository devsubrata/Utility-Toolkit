if (!document.getElementById("ToDoList")) {
    // --- Attach styles ---
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/todo.output.css");
    document.head.appendChild(link);

    // --- ToDo window ---
    const toDoList = document.createElement("div");
    toDoList.id = "ToDoList";
    toDoList.className = "fixed top-10 left-10 w-[450px] bg-white rounded-2xl shadow-xl border border-gray-300 z-[99999] flex flex-col";

    toDoList.innerHTML = `
        <!-- Header -->
        <div class="title-bar bg-gray-800 text-white !px-4 !py-2 flex justify-between items-center rounded-t-xl">
            <span class="title font-semibold text-xl">📝 ToDoList</span>
            <div class="space-x-2 text-lg">
                <span class="cursor-pointer minimize-btn">—</span>
                <span class="cursor-pointer close-btn !ml-1.5">❌</span>
            </div>
        </div>

        <!-- Content -->
        <div class="content !p-4 bg-gray-50 flex flex-col gap-3 overflow-y-auto max-h-[800px] rounded-b-xl">
            <button id="addTaskBtn"
                class="cursor-pointer w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold !py-2 rounded-lg transition-all">
                ➕ Add Task
            </button>
            <ul id="taskList" class="flex flex-col gap-2 !mt-2"></ul>
        </div>

        <!-- Modal -->
        <div id="taskModal" class="hidden fixed inset-0 bg-black/30 flex items-center justify-center z-[999999]">
            <div class="bg-white !p-6 rounded-xl w-120 flex flex-col gap-3 shadow-lg">
                <h2 id="modalTitle" class="text-lg font-semibold text-gray-800">Add Task</h2>

                <textarea id="modalTaskText" type="text" placeholder="Task description"
                    class="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"></textarea>

                <!-- Removed Start Date field -->

                <div class="flex gap-2 items-center">
                    <label class="text-sm text-gray-600">Est. Duration:</label>
                    <input id="modalDurationValue" type="number" min="1"
                        class="w-16 !px-2 !py-1 border border-gray-300 rounded-md text-sm"/>
                    <select id="modalDurationUnit" class="!px-2 !py-1 border border-gray-300 rounded-md text-sm">
                        <option value="min">min</option>
                        <option value="hr">hr</option>
                        <option value="day">day</option>
                    </select>
                </div>

                <div class="flex justify-end gap-2 mt-2">
                    <button id="cancelModal" class="!px-3 !py-1 bg-gray-300 hover:bg-gray-400 rounded-md">Cancel</button>
                    <button id="saveModal" class="!px-3 !py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(toDoList);
    makeDraggable(toDoList);

    const taskList = toDoList.querySelector("#taskList");
    const minimizeBtn = toDoList.querySelector(".minimize-btn");
    const closeBtn = toDoList.querySelector(".close-btn");
    const addTaskBtn = toDoList.querySelector("#addTaskBtn");

    const modal = toDoList.querySelector("#taskModal");
    const modalTitle = modal.querySelector("#modalTitle");
    const modalText = modal.querySelector("#modalTaskText");
    const modalDurationValue = modal.querySelector("#modalDurationValue");
    const modalDurationUnit = modal.querySelector("#modalDurationUnit");
    const cancelModal = modal.querySelector("#cancelModal");
    const saveModal = modal.querySelector("#saveModal");

    let tasks = JSON.parse(localStorage.getItem("chrome_todo_tasks")) || [];
    let editingIndex = null;
    let timers = {}; // active intervals

    const saveTasks = () => localStorage.setItem("chrome_todo_tasks", JSON.stringify(tasks));

    const renderTasks = () => {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            li.className = "bg-white border border-gray-200 rounded-lg !p-3 flex flex-col shadow-sm hover:border-indigo-600 transition-all";

            li.innerHTML = `
                <!-- Row 1: Title + Action Buttons -->
                <div class="flex justify-between items-start">
                    <span class="${task.completed ? "line-through text-gray-400" : "text-indigo-800 font-bold"} text-base">
                        ${index + 1}. ${task.text}
                    </span>
                    <div class="flex items-center gap-1 text-lg">
                        <span class="cursor-pointer complete-btn" title="Complete">${task.completed ? "↩️" : "✅"}</span>
                        <span class="cursor-pointer edit-btn" title="Edit">✏️</span>
                        <span class="cursor-pointer delete-btn" title="Delete">🗑️</span>
                    </div>
                </div>

                <!-- Row 2: Added Date + Buttons -->
                <div class="flex justify-between items-center text-gray-600 text-sm font-medium !mt-0.5">
                    <div>Added: ${formatDate(task.addedDate)}</div>
                    <div class="flex justify-center items-center gap-2">
                        <button class="start-btn text-xl" title="Start/Pause">${task.timerRunning ? "⏸" : "▶"}</button>
                        <button class="reset-btn text-xl" title="Reset">🔄</button>
                    </div>
                </div>

                <!-- Row 3: Start Date + Stopwatch -->
                <div class="flex justify-between items-center !mt-1">
                    <div class="text-xs text-gray-500 start-date">
                        ${task.startedAt ? `Start: ${new Date(task.startedAt.toLocaleString())}` : ""}
                    </div>
                    <div class="flex justify-center items-center">
                        <span class="elapsed-time text-sm font-semibold text-gray-800">
                            ${formatElapsed(task.elapsed || 0)}
                        </span>
                    </div>
                </div>
            `;

            // --- Elements ---
            const startBtn = li.querySelector(".start-btn");
            const elapsedSpan = li.querySelector(".elapsed-time");
            const startDateDiv = li.querySelector(".start-date");

            startBtn.onclick = () => toggleTimer(index, startBtn, elapsedSpan, startDateDiv);

            // Action buttons
            li.querySelector(".complete-btn").onclick = () => {
                task.completed = !task.completed;
                task.completionDate = task.completed ? new Date().toISOString() : null;
                task.timerRunning = false;
                clearInterval(timers[index]);
                saveTasks();
                renderTasks();
            };

            li.querySelector(".reset-btn").addEventListener("click", () => {
                // Stop any running interval
                if (timers[index]) {
                    clearInterval(timers[index]);
                    delete timers[index];
                }

                // Reset task timing fields
                task.elapsed = 0;
                task.timerRunning = false;
                task.startedAt = null; // hide start date
                // if you used a "firstStartedAt" earlier and want it cleared too, clear it:
                if ("firstStartedAt" in task) task.firstStartedAt = null;

                // Update DOM immediately
                const elapsedEl = li.querySelector(".elapsed-time");
                const startDateEl = li.querySelector(".start-date");
                const startBtnEl = li.querySelector(".start-btn");

                if (elapsedEl) elapsedEl.textContent = "00h:00m:00s";
                if (startDateEl) startDateEl.textContent = "";
                if (startBtnEl) startBtnEl.textContent = "▶";
                startBtnEl?.classList?.remove("running");

                saveTasks();
            });

            li.querySelector(".edit-btn").onclick = () => openModal(task, index);

            li.querySelector(".delete-btn").onclick = () => {
                if (confirm("Delete this task?")) {
                    clearInterval(timers[index]);
                    tasks.splice(index, 1);
                    saveTasks();
                    renderTasks();
                }
            };

            taskList.appendChild(li);
        });
    };

    function formatDate(isoDate) {
        const d = new Date(isoDate);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function formatDateTime(msOrIso) {
        const d = new Date(msOrIso);
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${formatDate(d)} ${h}:${m}`;
    }

    // Stopwatch helpers
    function toggleTimer(index, button, timeDisplay, startDateDiv) {
        const task = tasks[index];

        if (!task.timerRunning) {
            // --- START or RESUME timer ---
            task.timerRunning = true;
            // always set a fresh timestamp for this run
            task.startedAt = Date.now();

            // update visible start date to the current start time (so it ALWAYS refreshes)
            startDateDiv.textContent = `Start: ${new Date(task.startedAt).toLocaleString()}`;

            // ensure any previous interval is cleared before creating a new one
            if (timers[index]) clearInterval(timers[index]);
            timers[index] = setInterval(() => {
                const elapsedNow = (task.elapsed || 0) + (Date.now() - task.startedAt);
                timeDisplay.textContent = formatElapsed(elapsedNow);
            }, 1000);

            button.textContent = "⏸";
            button.classList?.add("running");
        } else {
            // --- PAUSE timer ---
            task.timerRunning = false;
            // accumulate elapsed time
            task.elapsed = (task.elapsed || 0) + (Date.now() - task.startedAt);
            // reset startedAt so it won't be used while paused
            task.startedAt = null;
            if (timers[index]) {
                clearInterval(timers[index]);
                delete timers[index];
            }
            button.textContent = "▶";
            button.classList?.remove("running");
            // update displayed elapsed (paused)
            timeDisplay.textContent = formatElapsed(task.elapsed || 0);
        }

        saveTasks();
    }

    function formatElapsed(ms) {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${h > 0 ? h + "h " : ""}${m}m ${s}s`;
    }

    const openModal = (task = null, index = null) => {
        modal.classList.remove("hidden");
        if (task) {
            modalTitle.textContent = "Edit Task";
            modalText.value = task.text;
            modalDurationValue.value = task.estimatedDuration.value;
            modalDurationUnit.value = task.estimatedDuration.unit;
            editingIndex = index;
        } else {
            modalTitle.textContent = "Add Task";
            modalText.value = "";
            modalDurationValue.value = "";
            modalDurationUnit.value = "min";
            editingIndex = null;
        }
    };

    const closeModal = () => {
        modal.classList.add("hidden");
        editingIndex = null;
    };

    saveModal.onclick = () => {
        const text = modalText.value.trim();
        if (!text) return alert("Task description required.");

        const newTask = {
            text,
            addedDate: editingIndex !== null ? tasks[editingIndex].addedDate : new Date().toISOString(),
            completed: editingIndex !== null ? tasks[editingIndex].completed : false,
            completionDate: editingIndex !== null ? tasks[editingIndex].completionDate : null,
            estimatedDuration: {
                value: modalDurationValue.value || null,
                unit: modalDurationUnit.value,
            },
            startedAt: null,
            elapsed: 0,
            timerRunning: false,
        };

        if (editingIndex !== null) {
            tasks[editingIndex] = { ...tasks[editingIndex], ...newTask };
        } else {
            tasks.push(newTask);
        }

        saveTasks();
        renderTasks();
        closeModal();
    };

    cancelModal.onclick = closeModal;
    addTaskBtn.onclick = () => openModal();

    minimizeBtn.onclick = () => {
        const content = toDoList.querySelector(".content");
        const titleBar = toDoList.querySelector(".title-bar");
        content.classList.toggle("hidden");
        titleBar.classList.toggle("rounded-b-xl");
    };

    closeBtn.onclick = () => {
        toDoList.remove();
    };

    renderTasks();
}
