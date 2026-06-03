// small bits of javascript used in all pages

document.addEventListener("DOMContentLoaded", function () {
    setupExportButtons();

    if (document.getElementById("student-search")) {
        setupStudentPage();
    }

    if (document.getElementById("create-event-form")) {
        setupEventPage();
    }

    if (document.getElementById("approvals-table") || document.getElementById("key-generator-form")) {
        setupApprovalPage();
    }

    if (document.querySelector('input[name="duration"]')) {
        setupResultPage();
    }
});

function setupExportButtons() {
    var buttons = document.querySelectorAll(".btn-export");

    buttons.forEach(function (button) {
        button.onclick = function () {
            var report = {
                department: "Computer Science & Engineering",
                totalStudents: 1248,
                averageAttendance: "88.5%",
                atRiskStudents: 42,
                criticalStudents: 15,
                date: new Date().toLocaleString()
            };

            saveTextFile(
                JSON.stringify(report, null, 2),
                "hod_report.json",
                "application/json"
            );

            showToast("Report downloaded");
        };
    });
}

function showToast(message, success) {
    var toast = document.querySelector(".toast-notification");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast-notification";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.toggle("success", success !== false);
    toast.classList.add("active");

    setTimeout(function () {
        toast.classList.remove("active");
    }, 2500);
}

function saveTextFile(text, filename, fileType) {
    var blob = new Blob([text], { type: fileType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

function downloadTableAsCSV(tableId, filename) {
    var table = document.getElementById(tableId);
    var lines = [];

    if (!table) {
        return;
    }

    table.querySelectorAll("tr").forEach(function (row) {
        if (row.style.display === "none") {
            return;
        }

        var rowData = [];

        row.querySelectorAll("th, td").forEach(function (cell) {
            var value = cell.innerText.replace(/\s+/g, " ").trim();
            value = value.replace(/"/g, '""');
            rowData.push('"' + value + '"');
        });

        lines.push(rowData.join(","));
    });

    saveTextFile(lines.join("\n"), filename, "text/csv");
}

function setupStudentPage() {
    var searchInput = document.getElementById("student-search");
    var studentsTable = document.getElementById("students-table");
    var refreshButton = document.getElementById("btn-refresh-students");
    var downloadButton = document.getElementById("btn-download-csv");

    searchInput.addEventListener("input", function () {
        var searchText = searchInput.value.toLowerCase();
        var rows = studentsTable.querySelectorAll("tbody tr");

        rows.forEach(function (row) {
            var rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(searchText) ? "" : "none";
        });
    });

    refreshButton.onclick = function () {
        var wrapper = studentsTable.closest(".table-responsive-wrapper");
        var spinner = document.createElement("div");

        wrapper.classList.add("table-loading");
        spinner.className = "table-spinner";
        wrapper.appendChild(spinner);

        setTimeout(function () {
            searchInput.value = "";

            studentsTable.querySelectorAll("tbody tr").forEach(function (row) {
                row.style.display = "";
            });

            wrapper.classList.remove("table-loading");
            spinner.remove();
            showToast("Student table refreshed");
        }, 500);
    };

    downloadButton.onclick = function () {
        downloadTableAsCSV("students-table", "students.csv");
        showToast("CSV downloaded");
    };
}

function setupEventPage() {
    var form = document.getElementById("create-event-form");
    var eventList = document.getElementById("events-list-container");
    var totalEvents = document.getElementById("val-total-events");
    var revenue = document.getElementById("val-projected-revenue");

    form.onsubmit = function (event) {
        event.preventDefault();

        var name = document.getElementById("event-name").value.trim();
        var dateValue = document.getElementById("event-date").value;
        var venue = document.getElementById("event-venue").value.trim();
        var fee = Number(document.getElementById("entry-fee").value);
        var capacity = Number(document.getElementById("event-capacity").value);
        var banner = document.getElementById("banner-url").value.trim();
        var dateText = new Date(dateValue).toLocaleDateString();
        var card = document.createElement("div");

        card.className = "event-card";
        card.innerHTML =
            '<div class="event-card-banner" style="' + getBannerStyle(banner) + '"></div>' +
            '<div class="event-card-info">' +
                '<h4 class="event-card-title">' + name + '</h4>' +
                '<div class="event-card-meta"><span>' + dateText + '</span><span>-</span><span>' + venue + '</span></div>' +
                '<div class="event-card-progress-wrapper">' +
                    '<div class="progress-info"><span>Capacity (0 / ' + capacity + ')</span><span>0%</span></div>' +
                    '<div class="progress-bar-container"><div class="progress-bar-fill" style="width: 0%;"></div></div>' +
                '</div>' +
            '</div>';

        eventList.insertBefore(card, eventList.firstChild);

        if (totalEvents) {
            totalEvents.innerText = Number(totalEvents.innerText) + 1;
        }

        if (revenue) {
            var oldRevenue = Number(revenue.innerText.replace("$", "").replace(",", ""));
            var newRevenue = oldRevenue + fee * capacity * 0.7;
            revenue.innerText = "$" + Math.round(newRevenue).toLocaleString();
        }

        form.reset();
        showToast("Event added");
    };
}

function getBannerStyle(url) {
    if (url) {
        return "background-image: url('" + url + "');";
    }

    return "background: #8aa3c2;";
}

function setupApprovalPage() {
    var table = document.getElementById("approvals-table");
    var form = document.getElementById("key-generator-form");

    if (table) {
        table.onclick = function (event) {
            var approveButton = event.target.closest(".btn-approve");
            var rejectButton = event.target.closest(".btn-reject");

            if (!approveButton && !rejectButton) {
                return;
            }

            var approved = Boolean(approveButton);
            var row = event.target.closest("tr");
            var badge = row.querySelector(".badge");
            var actions = row.querySelector(".table-actions");

            if (approved) {
                badge.className = "badge badge-low-risk";
                badge.textContent = "Approved";
                showToast("Approved");
            } else {
                badge.className = "badge badge-critical";
                badge.textContent = "Rejected";
                showToast("Rejected", false);
            }

            if (actions) {
                actions.innerHTML = "<span style='color: var(--text-muted);'>Done</span>";
            }
        };
    }

    if (form) {
        form.onsubmit = function (event) {
            event.preventDefault();

            var person = document.getElementById("key-username").value.trim();
            var hours = document.getElementById("key-validity").value;
            var code = Math.floor(1000 + Math.random() * 9000);
            var key = "HOD-" + code + "-" + hours + "H";

            showKeyModal("Access Key Created", "Key made for " + person + ".", key);
            form.reset();
        };
    }
}

function showKeyModal(title, message, key) {
    var overlay = document.querySelector(".modal-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML =
            '<div class="modal-card">' +
                '<button class="modal-close-btn" aria-label="Close">&times;</button>' +
                '<div class="modal-icon">KEY</div>' +
                '<h4 class="modal-title"></h4>' +
                '<p class="modal-desc"></p>' +
                '<div class="modal-key-display"><span></span></div>' +
                '<button class="btn-primary modal-action-btn" style="width: 100%; justify-content: center;">Copy Key</button>' +
            '</div>';

        document.body.appendChild(overlay);

        overlay.querySelector(".modal-close-btn").onclick = function () {
            overlay.classList.remove("active");
        };

        overlay.onclick = function (event) {
            if (event.target === overlay) {
                overlay.classList.remove("active");
            }
        };
    }

    overlay.querySelector(".modal-title").textContent = title;
    overlay.querySelector(".modal-desc").textContent = message;
    overlay.querySelector(".modal-key-display span").textContent = key;

    overlay.querySelector(".modal-action-btn").onclick = function () {
        navigator.clipboard.writeText(key);
        overlay.classList.remove("active");
        showToast("Key copied");
    };

    overlay.querySelector(".modal-key-display").onclick = function () {
        navigator.clipboard.writeText(key);
        showToast("Key copied");
    };

    overlay.classList.add("active");
}

function setupResultPage() {
    var durationButtons = document.querySelectorAll('input[name="duration"]');
    var downloadButton = document.getElementById("btn-download-grades");

    var data = {
        "dur-1m": { total: 24, completed: 18, rate: "85.4%", sections: 6 },
        "dur-2m": { total: 36, completed: 28, rate: "87.0%", sections: 6 },
        "dur-3m": { total: 54, completed: 45, rate: "86.2%", sections: 6 },
        "dur-6m": { total: 88, completed: 72, rate: "88.9%", sections: 6 }
    };

    durationButtons.forEach(function (button) {
        button.onchange = function () {
            var item = data[button.id];

            document.getElementById("val-total-tests").innerText = item.total;
            document.getElementById("val-completed-tests").innerText = item.completed;
            document.getElementById("val-avg-completion").innerText = item.rate;
            document.getElementById("val-sections").innerText = item.sections;

            showToast("Filter changed");
        };
    });

    if (downloadButton) {
        downloadButton.onclick = function () {
            downloadTableAsCSV("results-table", "grades.csv");
            showToast("Grade sheet downloaded");
        };
    }
}
