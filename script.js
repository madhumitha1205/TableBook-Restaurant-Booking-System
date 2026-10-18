
const USERS_KEY = "tableBookUsers";
const BOOKINGS_KEY = "tableBookBookings";

const TABLES = [
    { number: 1, capacity: 2 },
    { number: 2, capacity: 4 },
    { number: 3, capacity: 4 },
    { number: 4, capacity: 6 },
    { number: 5, capacity: 2 },
    { number: 6, capacity: 8 }
];

let currentUser = null;
let currentRole = null;

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getBookings() {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
}

function saveBookings(bookings) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

function showMessage(id, message, type = "error") {
    const element = document.getElementById(id);
    element.textContent = message;
    element.className = "message " + type;
}

function clearMessage(id) {
    const element = document.getElementById(id);
    element.textContent = "";
    element.className = "message";
}

function showAuth(mode) {
    document.getElementById("loginForm").classList.toggle("hidden", mode !== "login");
    document.getElementById("registerForm").classList.toggle("hidden", mode !== "register");
    document.getElementById("adminForm").classList.toggle("hidden", mode !== "admin");

    document.getElementById("loginTab").classList.toggle("active", mode === "login");
    document.getElementById("registerTab").classList.toggle("active", mode === "register");
    document.getElementById("adminTab").classList.toggle("active", mode === "admin");

    clearMessage("authMessage");
}

function openApp(role, user = null) {
    currentRole = role;
    currentUser = user;

    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("customerSection").classList.toggle("hidden", role !== "customer");
    document.getElementById("adminSection").classList.toggle("hidden", role !== "admin");
    document.getElementById("logoutBtn").classList.remove("hidden");

    if (role === "customer") {
        document.getElementById("headerUser").textContent = user.name;
        document.getElementById("customerName").textContent = user.name;
        setupDateInput();
        setupTableOptions();
        renderTables();
        renderCustomerBookings();
    } else {
        document.getElementById("headerUser").textContent = "Administrator";
        renderAdminDashboard();
    }
}

function logout() {
    currentUser = null;
    currentRole = null;

    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("customerSection").classList.add("hidden");
    document.getElementById("adminSection").classList.add("hidden");
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("headerUser").textContent = "Restaurant Reservation System";

    document.getElementById("loginForm").reset();
    document.getElementById("registerForm").reset();
    document.getElementById("adminForm").reset();

    showAuth("login");
}

document.getElementById("registerForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!name || !email) {
        showMessage("authMessage", "Please enter your name and email.");
        return;
    }

    if (password.length < 6) {
        showMessage("authMessage", "Password must contain at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("authMessage", "Passwords do not match.");
        return;
    }

    const users = getUsers();

    if (users.some(user => user.email.toLowerCase() === email)) {
        showMessage("authMessage", "This email is already registered.");
        return;
    }

    users.push({
        name,
        email,
        password,
        joined: new Date().toLocaleDateString()
    });

    saveUsers(users);
    document.getElementById("registerForm").reset();

    showAuth("login");
    document.getElementById("loginEmail").value = email;
    showMessage("authMessage", "Account created! Please log in.", "success");
});

document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = getUsers().find(item =>
        item.email.toLowerCase() === email && item.password === password
    );

    if (!user) {
        showMessage("authMessage", "Invalid email or password.");
        return;
    }

    openApp("customer", user);
});

document.getElementById("adminForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    if (username === "admin" && password === "Admin@123") {
        openApp("admin");
    } else {
        showMessage("authMessage", "Invalid admin username or password.");
    }
});

function setupDateInput() {
    const dateInput = document.getElementById("bookingDate");
    const today = getLocalDateString();

    dateInput.min = today;

    if (!dateInput.value || dateInput.value < today) {
        dateInput.value = today;
    }
}

function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isPastSlot(date, time) {
    const selected = new Date(`${date}T${time}:00`);
    return selected.getTime() <= Date.now();
}

function isTableBooked(tableNumber, date, time) {
    return getBookings().some(booking =>
        booking.tableNumber === Number(tableNumber) &&
        booking.date === date &&
        booking.time === time &&
        booking.status === "Active"
    );
}

function setupTableOptions() {
    const select = document.getElementById("tableNumber");

    select.innerHTML = '<option value="">Select a table</option>';

    TABLES.forEach(table => {
        const option = document.createElement("option");
        option.value = table.number;
        option.textContent = `Table ${table.number} — ${table.capacity} guests`;
        select.appendChild(option);
    });
}

function renderTables() {
    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    const grid = document.getElementById("tableGrid");

    grid.replaceChildren();

    TABLES.forEach(table => {
        const booked = date && time && isTableBooked(table.number, date, time);
        const past = date && time && isPastSlot(date, time);
        const unavailable = Boolean(booked || past);

        const card = document.createElement("div");
        card.className = "table-card";

        const heading = document.createElement("h3");
        heading.textContent = `Table ${table.number}`;

        const capacity = document.createElement("p");
        capacity.textContent = `Capacity: ${table.capacity} guests`;

        const status = document.createElement("div");
        status.className = unavailable ? "unavailable" : "available";
        status.textContent = past
            ? "Past time"
            : !date || !time
                ? "Select date and time"
                : booked
                    ? "Booked"
                    : "Available";

        card.append(heading, capacity, status);
        grid.appendChild(card);
    });
}

document.getElementById("bookingDate").addEventListener("change", renderTables);
document.getElementById("bookingTime").addEventListener("change", renderTables);

document.getElementById("bookingForm").addEventListener("submit", function (event) {
    event.preventDefault();

    if (currentRole !== "customer" || !currentUser) {
        showMessage("bookingMessage", "Please log in first.");
        return;
    }

    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    const guestCount = Number(document.getElementById("guestCount").value);
    const tableNumber = Number(document.getElementById("tableNumber").value);
    const table = TABLES.find(item => item.number === tableNumber);

    if (!date || !time || !table) {
        showMessage("bookingMessage", "Please complete all booking details.");
        return;
    }

    if (date < getLocalDateString() || isPastSlot(date, time)) {
        showMessage("bookingMessage", "Please select a future date and time.");
        return;
    }

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > table.capacity) {
        showMessage("bookingMessage", `This table can accommodate 1 to ${table.capacity} guests.`);
        return;
    }

    if (isTableBooked(tableNumber, date, time)) {
        showMessage("bookingMessage", "Sorry, this table is already booked for that time.");
        renderTables();
        return;
    }

    const bookings = getBookings();

    const booking = {
        id: "TB" + Date.now().toString().slice(-9),
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        date,
        time,
        tableNumber,
        guestCount,
        status: "Active",
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveBookings(bookings);

    document.getElementById("bookingForm").reset();
    setupDateInput();
    setupTableOptions();

    showMessage("bookingMessage", `Booking confirmed! Your booking ID is ${booking.id}.`, "success");

    renderTables();
    renderCustomerBookings();
});

function createCell(text) {
    const td = document.createElement("td");
    td.textContent = text ?? "";
    return td;
}

function createStatus(status) {
    const span = document.createElement("span");
    span.className = "status " + (status === "Active" ? "active" : "cancelled");
    span.textContent = status;
    return span;
}

function renderCustomerBookings() {
    if (!currentUser) return;

    const query = document.getElementById("customerSearch").value.trim().toLowerCase();
    const tbody = document.getElementById("customerBookings");
    tbody.replaceChildren();

    const bookings = getBookings()
        .filter(booking => booking.customerEmail === currentUser.email)
        .filter(booking => [
            booking.id, booking.date, booking.time,
            booking.tableNumber, booking.status
        ].some(value => String(value).toLowerCase().includes(query)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const allMyBookings = getBookings().filter(booking =>
        booking.customerEmail === currentUser.email && booking.status === "Active"
    );

    document.getElementById("myBookingCount").textContent = allMyBookings.length;

    if (bookings.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("No bookings found.");
        cell.colSpan = 7;
        cell.className = "empty";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    bookings.forEach(booking => {
        const row = document.createElement("tr");

        row.append(
            createCell(booking.id),
            createCell(booking.date),
            createCell(formatTime(booking.time)),
            createCell("Table " + booking.tableNumber),
            createCell(booking.guestCount)
        );

        const statusCell = document.createElement("td");
        statusCell.appendChild(createStatus(booking.status));
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        if (booking.status === "Active") {
            const button = document.createElement("button");
            button.className = "cancel-btn";
            button.textContent = "Cancel";
            button.addEventListener("click", () => cancelBooking(booking.id));
            actionCell.appendChild(button);
        } else {
            actionCell.textContent = "—";
        }

        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
}

function cancelBooking(id) {
    if (!currentUser) return;

    const bookings = getBookings();
    const booking = bookings.find(item => item.id === id);

    if (!booking || booking.customerEmail !== currentUser.email) {
        showMessage("bookingMessage", "Booking not found.");
        return;
    }

    if (booking.status !== "Active") {
        showMessage("bookingMessage", "This booking is already cancelled.");
        return;
    }

    if (!confirm(`Cancel booking ${id}?`)) return;

    booking.status = "Cancelled";
    saveBookings(bookings);

    showMessage("bookingMessage", "Booking cancelled successfully.", "success");
    renderTables();
    renderCustomerBookings();
}

document.getElementById("customerSearch").addEventListener("input", renderCustomerBookings);

function renderAdminDashboard() {
    if (currentRole !== "admin") return;

    const bookings = getBookings();
    const users = getUsers();

    document.getElementById("totalBookings").textContent = bookings.length;
    document.getElementById("activeBookings").textContent =
        bookings.filter(item => item.status === "Active").length;
    document.getElementById("cancelledBookings").textContent =
        bookings.filter(item => item.status === "Cancelled").length;
    document.getElementById("totalCustomers").textContent = users.length;

    renderAdminBookings();
    renderAdminCustomers();
}

function renderAdminBookings() {
    const query = document.getElementById("adminSearch").value.trim().toLowerCase();
    const tbody = document.getElementById("adminBookings");
    tbody.replaceChildren();

    const bookings = getBookings()
        .filter(booking => [
            booking.id, booking.customerName, booking.customerEmail,
            booking.date, booking.time, booking.tableNumber, booking.status
        ].some(value => String(value).toLowerCase().includes(query)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (bookings.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("No bookings found.");
        cell.colSpan = 9;
        cell.className = "empty";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    bookings.forEach(booking => {
        const row = document.createElement("tr");

        row.append(
            createCell(booking.id),
            createCell(booking.customerName),
            createCell(booking.customerEmail),
            createCell(booking.date),
            createCell(formatTime(booking.time)),
            createCell("Table " + booking.tableNumber),
            createCell(booking.guestCount)
        );

        const statusCell = document.createElement("td");
        statusCell.appendChild(createStatus(booking.status));
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        if (booking.status === "Active") {
            const button = document.createElement("button");
            button.className = "cancel-btn";
            button.textContent = "Cancel";
            button.addEventListener("click", () => adminCancelBooking(booking.id));
            actionCell.appendChild(button);
        } else {
            actionCell.textContent = "—";
        }

        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
}

function adminCancelBooking(id) {
    if (currentRole !== "admin") return;

    const bookings = getBookings();
    const booking = bookings.find(item => item.id === id);

    if (!booking || booking.status !== "Active") return;
    if (!confirm(`Cancel booking ${id}?`)) return;

    booking.status = "Cancelled";
    saveBookings(bookings);
    renderAdminDashboard();
}

function renderAdminCustomers() {
    const tbody = document.getElementById("adminCustomers");
    tbody.replaceChildren();

    const users = getUsers();

    if (users.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("No customers registered.");
        cell.colSpan = 3;
        cell.className = "empty";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    users.forEach(user => {
        const row = document.createElement("tr");
        row.append(
            createCell(user.name),
            createCell(user.email),
            createCell(user.joined || "—")
        );
        tbody.appendChild(row);
    });
}

document.getElementById("adminSearch").addEventListener("input", renderAdminBookings);

function formatTime(time) {
    if (!time) return "";
    const [hour, minute] = time.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function exportCSV() {
    if (currentRole !== "admin") return;

    const bookings = getBookings();

    if (bookings.length === 0) {
        alert("There are no bookings to export.");
        return;
    }

    const headers = [
        "Booking ID", "Customer Name", "Customer Email",
        "Date", "Time", "Table Number", "Guests", "Status"
    ];

    const rows = bookings.map(booking => [
        booking.id,
        booking.customerName,
        booking.customerEmail,
        booking.date,
        formatTime(booking.time),
        booking.tableNumber,
        booking.guestCount,
        booking.status
    ]);

    function escapeCSV(value) {
        let text = String(value ?? "");
        if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "table-booking-report.csv";
    link.click();
    URL.revokeObjectURL(url);
}

showAuth("login");
