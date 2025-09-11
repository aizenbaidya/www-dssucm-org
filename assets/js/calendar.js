const calendarGrid = document.getElementById("calendarGrid");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const toggleViewBtn = document.getElementById("toggleView");
const taskView = document.getElementById("taskView");
const selectedDateElem = document.getElementById("selectedDate");
const taskList = document.getElementById("taskList");
const closeTaskViewBtn = document.getElementById("closeTaskView");

let currentDate = new Date();
let isWeekView = toggleViewBtn.getAttribute("data-toggle") === "week";
toggleViewBtn.textContent = isWeekView ? "Month View" : "Week View";
let eventsData = {};

async function loadEvents() {
    try {
        const response = await fetch("./assets/js/calendar.json");
        const data = await response.json();
        data.events.forEach(event => {
            eventsData[event.date] = event.events;
        });
    } catch (error) {
        console.error("Error loading events:", error);
    }
}

function renderCalendar(date) {
    calendarGrid.innerHTML = "";

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeek.forEach(day => {
        const dayElem = document.createElement("div");
        dayElem.classList.add("day", "header");
        dayElem.textContent = day;
        calendarGrid.appendChild(dayElem);
    });

    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
    
    monthYear.textContent = date.toLocaleString("default", { month: "long", year: "numeric" });

    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
        const dayElem = document.createElement("div");
        dayElem.classList.add("day", "active");
        dayElem.textContent = i;

        if (dateStr === todayStr) {
            dayElem.classList.add("today");
        }

        if (eventsData[dateStr]) {
            const eventTypes = [...new Set(eventsData[dateStr].map(event => event.type))];
            const priority = ["holiday", "deadline", "break", "milestone", "meeting", "general"];
            for (const type of priority) {
                if (eventTypes.includes(type)) {
                    dayElem.classList.add(type);
                    break;
                }
            }
        }

        dayElem.addEventListener("click", () => openTaskView(dateStr));
        calendarGrid.appendChild(dayElem);
    }
}

function renderWeek(date) {
    calendarGrid.innerHTML = "";

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeek.forEach(day => {
        const dayElem = document.createElement("div");
        dayElem.classList.add("day", "header");
        dayElem.textContent = day;
        calendarGrid.appendChild(dayElem);
    });

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const startOfWeek = new Date(date.setDate(day - date.getDay()));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
    
    monthYear.textContent = `Week of ${startOfWeek.toLocaleDateString()}`;

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const dateStr = `${currentDay.getFullYear()}-${(currentDay.getMonth() + 1).toString().padStart(2, "0")}-${currentDay.getDate().toString().padStart(2, "0")}`;
        const dayElem = document.createElement("div");
        dayElem.classList.add("day", "active");
        dayElem.textContent = currentDay.getDate();

        if (dateStr === todayStr) {
            dayElem.classList.add("today");
        }

        if (eventsData[dateStr]) {
            const eventTypes = [...new Set(eventsData[dateStr].map(event => event.type))];
            const priority = ["holiday", "deadline", "break", "milestone", "meeting", "general"];
            for (const type of priority) {
                if (eventTypes.includes(type)) {
                    dayElem.classList.add(type);
                    break;
                }
            }
        }

        dayElem.addEventListener("click", () => openTaskView(dateStr));
        calendarGrid.appendChild(dayElem);
    }
}

function formatTime(time) {
    const [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

function openTaskView(date) {
    const dateObj = new Date(date + 'T00:00:00'); // Ensure the date is correctly parsed
    const formattedDate = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    taskView.style.display = "block";
    selectedDateElem.textContent = formattedDate;
    taskList.innerHTML = "";

    if (eventsData[date]) {
        eventsData[date].forEach(event => {
            const li = document.createElement("li");
            li.classList.add(event.type);
            li.innerHTML = `<b>${event.title}</b> <span class="task-time">${formatTime(event.startTime)} - ${formatTime(event.endTime)}</span><br><span>${event.description}</span>`;
            taskList.appendChild(li);
        });
    } else {
        taskList.innerHTML = "<li>No events for this day</li>";
    }
}

closeTaskViewBtn.addEventListener("click", () => {
    taskView.style.display = "none";
});

prevMonthBtn.addEventListener("click", () => {
    if (isWeekView) {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeek(currentDate);
    } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    }
});

nextMonthBtn.addEventListener("click", () => {
    if (isWeekView) {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeek(currentDate);
    } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    }
});

toggleViewBtn.addEventListener("click", () => {
    isWeekView = !isWeekView;
    toggleViewBtn.textContent = isWeekView ? "Month View" : "Week View";
    if (isWeekView) {
        renderWeek(currentDate);
    } else {
        renderCalendar(currentDate);
    }
});

loadEvents().then(() => {
    if (isWeekView) {
        renderWeek(currentDate);
    } else {
        renderCalendar(currentDate);
    }
});