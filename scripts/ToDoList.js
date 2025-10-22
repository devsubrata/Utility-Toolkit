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
        <div class="title-bar bg-gray-800 text-white !px-4 !py-2 flex justify-between items-center rounded-t-2xl">
            <span class="title font-semibold text-xl">📝 ToDoList</span>
            <div class="space-x-2 text-lg">
                <span class="cursor-pointer minimize-btn">—</span>
                <span class="cursor-pointer close-btn !ml-1.5">❌</span>
            </div>
        </div>

        <!-- Content -->
        <div class="content !p-4 bg-gray-50 flex flex-col gap-3 overflow-y-auto max-h-[800px] rounded-b-2xl">
            <button id="addTaskBtn"
                class="cursor-pointer w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold !py-2 rounded-lg transition-all">
                ➕ Add Task
            </button>
            <ul id="taskList" class="flex flex-col gap-2 !mt-2"></ul>
        </div>

        <!-- Modal -->
        <div id="taskModal" class="hidden fixed inset-0 bg-black/30 flex items-center justify-center z-[999999]">
            <div class="bg-white !p-6 rounded-xl w-80 flex flex-col gap-3 shadow-lg">
                <h2 id="modalTitle" class="text-lg font-semibold text-gray-800">Add Task</h2>

                <input id="modalTaskText" type="text" placeholder="Task description" class="w-full !px-3 !py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"/>

                <div class="flex gap-2 items-center">
                    <label class="text-sm text-gray-600">Start:</label>
                    <input id="modalStartTime" type="datetime-local" class="flex-1 !px-2 !py-1 border border-gray-300 rounded-md text-sm"/>
                </div>

                <div class="flex gap-2 items-center">
                    <label class="text-sm text-gray-600">Est. Duration:</label>
                    <input id="modalDurationValue" type="number" min="1" class="w-16 !px-2 !py-1 border border-gray-300 rounded-md text-sm"/>
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
    makeDraggable(toDoList); // your existing draggable function

    /* ---------- FUNCTIONALITY ---------- */
    const taskList = toDoList.querySelector("#taskList");
    const minimizeBtn = toDoList.querySelector(".minimize-btn");
    const closeBtn = toDoList.querySelector(".close-btn");
    const addTaskBtn = toDoList.querySelector("#addTaskBtn");

    const modal = toDoList.querySelector("#taskModal");
    const modalTitle = modal.querySelector("#modalTitle");
    const modalText = modal.querySelector("#modalTaskText");
    const modalStartTime = modal.querySelector("#modalStartTime");
    const modalDurationValue = modal.querySelector("#modalDurationValue");
    const modalDurationUnit = modal.querySelector("#modalDurationUnit");
    const cancelModal = modal.querySelector("#cancelModal");
    const saveModal = modal.querySelector("#saveModal");

    let tasks = JSON.parse(localStorage.getItem("chrome_todo_tasks")) || [];
    let editingIndex = null;

    const saveTasks = () => localStorage.setItem("chrome_todo_tasks", JSON.stringify(tasks));

    const renderTasks = () => {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            li.className = "bg-white border border-gray-200 rounded-lg !p-3 flex flex-col shadow-sm hover:border-indigo-600";

            const durationText = task.completionDate
                ? `${Math.round((new Date(task.completionDate) - new Date(task.addedDate)) / 60000)} min total`
                : "";

            li.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex flex-col">
                        <span>${index + 1}. 
                        <span class="${task.completed ? "line-through text-gray-400" : "text-indigo-800 font-bold"} font-xl">
                            ${task.text}
                        </span></span>
                        <span class="text-xs text-gray-500 !mt-1">
                            Added: ${new Date(task.addedDate).toLocaleString()}
                            ${task.startDate ? `<br>Start: ${new Date(task.startDate).toLocaleString()}` : ""}
                            ${task.completionDate ? `<br>Done: ${new Date(task.completionDate).toLocaleString()}` : ""}
                            ${durationText ? `<br>Duration: ${durationText}` : ""}
                            ${task.estimatedDuration.value !== null ? `<br>Est: ${task.estimatedDuration.value} ${task.estimatedDuration.unit}` : ""}
                        </span>
                    </div>
                    <div class="flex items-center gap-1 text-lg">
                        <span class="cursor-pointer complete-btn" title="Complete">${task.completed ? "↩️" : "✅"}</span>
                        <span class="cursor-pointer edit-btn" title="Edit">✏️</span>
                        <span class="cursor-pointer delete-btn" title="Delete">🗑️</span>
                    </div>
                </div>
            `;

            // --- Actions ---
            li.querySelector(".complete-btn").onclick = () => {
                task.completed = !task.completed;
                task.completionDate = task.completed ? new Date().toISOString() : null;
                saveTasks();
                renderTasks();
            };

            li.querySelector(".edit-btn").onclick = () => {
                openModal(task, index);
            };

            li.querySelector(".delete-btn").onclick = () => {
                if (confirm("Delete this task?")) {
                    tasks.splice(index, 1);
                    saveTasks();
                    renderTasks();
                }
            };

            taskList.appendChild(li);
        });
    };

    const openModal = (task = null, index = null) => {
        modal.classList.remove("hidden");
        // makeDraggable(modal);
        if (task) {
            modalTitle.textContent = "Edit Task";
            modalText.value = task.text;
            modalStartTime.value = task.startDate?.slice(0, 16) || "";
            modalDurationValue.value = task.estimatedDuration.value;
            modalDurationUnit.value = task.estimatedDuration.unit;
            editingIndex = index;
        } else {
            modalTitle.textContent = "Add Task";
            modalText.value = "";
            modalStartTime.value = new Date().toISOString().slice(0, 16);
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
            startDate: modalStartTime.value || new Date().toISOString(),
            completed: editingIndex !== null ? tasks[editingIndex].completed : false,
            completionDate: editingIndex !== null ? tasks[editingIndex].completionDate : null,
            estimatedDuration: {
                value: modalDurationValue.value || null,
                unit: modalDurationUnit.value,
            },
        };

        if (editingIndex !== null) {
            tasks[editingIndex] = newTask;
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
        content.classList.toggle("hidden");
    };

    closeBtn.onclick = () => {
        toDoList.remove();
    };

    renderTasks();
}
