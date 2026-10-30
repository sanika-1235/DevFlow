
const jobsList = document.getElementById("jobsList");
const workerCountInput = document.getElementById("workerCount");
const policyInput = document.getElementById("policy");
const runButton = document.getElementById("runSimulation");
const compareButton = document.getElementById("comparePolicies");
const addButton = document.getElementById("addJob");
const resetButton = document.getElementById("loadSample");
const message = document.getElementById("message");
const results = document.getElementById("results");
const comparisonResults = document.getElementById("comparisonResults");
const comparisonMessage = document.getElementById("comparisonMessage");

let nextJobNumber = 1;

function addJobRow(job = {}) {
    const row = document.createElement("div");
    row.className = "job-row";

    const idLabel = document.createElement("label");
    idLabel.textContent = "Job ID";
    const idInput = document.createElement("input");
    idInput.className = "job-id";
    idInput.value = job.id ?? `Job${nextJobNumber++}`;
    idInput.required = true;
    idLabel.appendChild(idInput);

    const durationLabel = document.createElement("label");
    durationLabel.textContent = "Duration";
    const durationInput = document.createElement("input");
    durationInput.className = "job-duration";
    durationInput.type = "number";
    durationInput.min = "0.01";
    durationInput.step = "any";
    durationInput.value = job.duration ?? 2;
    durationInput.required = true;
    durationLabel.appendChild(durationInput);

    const dependencyLabel = document.createElement("label");
    dependencyLabel.className = "dependency-field";
    dependencyLabel.textContent = "Dependencies";
    const dependencyInput = document.createElement("input");
    dependencyInput.className = "job-dependencies";
    dependencyInput.placeholder = "e.g. A, B";
    dependencyInput.value = (job.dependencies ?? []).join(", ");
    dependencyLabel.appendChild(dependencyInput);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove this job");
    removeButton.addEventListener("click", () => row.remove());

    row.append(idLabel, durationLabel, dependencyLabel, removeButton);
    jobsList.appendChild(row);
}

function loadSample() {
    jobsList.replaceChildren();

    addJobRow({ id: "A", duration: 3, dependencies: [] });
    addJobRow({ id: "B", duration: 5, dependencies: ["A"] });
    addJobRow({ id: "C", duration: 2, dependencies: [] });

    workerCountInput.value = 2;
    policyInput.value = "FIFO";

    results.hidden = true;
    comparisonResults.hidden = true;
    comparisonMessage.textContent = "";
    showMessage("Sample pipeline loaded. Ready to simulate.", "success");
}

function collectJobs() {
    const rows = [...jobsList.querySelectorAll(".job-row")];

    if (rows.length === 0) {
        throw new Error("Add at least one job.");
    }

    return rows.map((row) => {
        const id = row.querySelector(".job-id").value.trim();
        const durationText = row.querySelector(".job-duration").value;
        const duration = Number(durationText);
        const dependencyText =
            row.querySelector(".job-dependencies").value.trim();

        if (!id) {
            throw new Error("Every job must have an ID.");
        }

        if (
            durationText.trim() === "" ||
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            throw new Error(`Enter a positive duration for job ${id}.`);
        }

        const dependencies = dependencyText
            ? dependencyText.split(",").map((item) => item.trim())
            : [];

        if (dependencies.some((dependency) => !dependency)) {
            throw new Error(`Check the dependencies for job ${id}.`);
        }

        return { id, duration, dependencies };
    });
}

function getWorkerCount() {
    const value = workerCountInput.value.trim();
    const workerCount = Number(value);

    if (
        value === "" ||
        !Number.isInteger(workerCount) ||
        workerCount < 1
    ) {
        throw new Error("Worker count must be a positive integer.");
    }

    return workerCount;
}

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `message ${type}`;
}

function showComparisonMessage(text, type = "") {
    comparisonMessage.textContent = text;
    comparisonMessage.className = `message ${type}`;
}

async function runSimulation() {
    runButton.disabled = true;
    showMessage("Running pipeline simulation...");
    results.hidden = true;

    try {
        const jobs = collectJobs();
        const workerCount = getWorkerCount();
        const policy = policyInput.value;

        const response = await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobs, workerCount, policy })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Simulation failed.");
        }

        displayResults(data);
        results.hidden = false;
        showMessage("Simulation completed successfully!", "success");
    } catch (error) {
        showMessage(error.message || "Unable to run simulation.", "error");
    } finally {
        runButton.disabled = false;
    }
}

async function comparePolicies() {
    compareButton.disabled = true;
    comparisonResults.hidden = true;
    showComparisonMessage("Comparing scheduling policies...");

    try {
        const jobs = collectJobs();
        const workerCount = getWorkerCount();

        const response = await fetch("/api/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobs, workerCount })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Comparison failed.");
        }

        displayComparison(data);
        comparisonResults.hidden = false;
        showComparisonMessage("All three policies compared successfully!", "success");
    } catch (error) {
        showComparisonMessage(
            error.message || "Unable to compare policies.",
            "error"
        );
    } finally {
        compareButton.disabled = false;
    }
}

function displayComparison(data) {
    const bestPolicy = document.getElementById("bestPolicy");
    const description = document.getElementById("bestPolicyDescription");
    const tableBody = document.getElementById("comparisonTableBody");

    bestPolicy.textContent = data.bestPolicies.join(", ");
    description.textContent =
        `Lowest makespan: ${data.bestMakespan} time units. ` +
        "If policies tie, all tied policies are shown.";

    tableBody.replaceChildren();

    for (const result of data.comparisons) {
        const row = document.createElement("tr");
        const isBest = data.bestPolicies.includes(result.policy);

        if (isBest) {
            row.className = "best-policy-row";
        }

        const policyCell = document.createElement("td");
        policyCell.textContent = result.policy;

        if (isBest) {
            const badge = document.createElement("span");
            badge.className = "best-policy-label";
            badge.textContent = "LOWEST MAKESPAN";
            policyCell.appendChild(badge);
        }

        const values = [
            result.makespan,
            `${result.workerUtilization}%`,
            result.totalQueueWaitingTime,
            result.averageQueueWaitingTime
        ];

        row.appendChild(policyCell);

        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        }

        tableBody.appendChild(row);
    }
}

function displayResults(data) {
    document.getElementById("makespan").textContent = data.makespan;
    document.getElementById("utilization").textContent =
        `${data.workerUtilization}%`;
    document.getElementById("waiting").textContent =
        data.totalQueueWaitingTime;
    document.getElementById("averageWaiting").textContent =
        data.averageQueueWaitingTime;

    const scheduleContainer = document.getElementById("schedule");
    scheduleContainer.replaceChildren();

    const sortedSchedule = [...data.schedule].sort(
        (a, b) => a.start - b.start ||
            a.jobId.localeCompare(b.jobId)
    );

    for (const job of sortedSchedule) {
        const item = document.createElement("article");
        item.className = "schedule-item";

        const tag = document.createElement("div");
        tag.className = "job-tag";
        tag.textContent = job.jobId;

        const details = document.createElement("div");
        const title = document.createElement("p");
        title.textContent = `Duration: ${job.duration}`;

        const waiting = document.createElement("small");
        waiting.textContent = `Queue waiting: ${job.waitingTime}`;
        details.append(title, waiting);

        const timing = document.createElement("p");
        timing.className = "timing";
        timing.textContent = `${job.start} → ${job.finish}`;

        item.append(tag, details, timing);
        scheduleContainer.appendChild(item);
    }

    const timeline = document.getElementById("timeline");
    timeline.replaceChildren();

    const makespan = data.makespan;

    if (makespan <= 0 || data.schedule.length === 0) {
        timeline.textContent = "No scheduled jobs to display.";
        return;
    }

    const axis = document.createElement("div");
    axis.className = "timeline-axis";

    for (let i = 0; i <= 4; i++) {
        const tick = document.createElement("span");
        const time = makespan * i / 4;
        tick.textContent = Number(time.toFixed(2)).toString();
        axis.appendChild(tick);
    }

    timeline.appendChild(axis);

    for (const job of sortedSchedule) {
        const row = document.createElement("div");
        row.className = "timeline-row";

        const label = document.createElement("div");
        label.className = "timeline-label";
        label.textContent = job.jobId;

        const track = document.createElement("div");
        track.className = "timeline-track";

        const bar = document.createElement("div");
        bar.className = "timeline-bar";
        bar.style.left = `${job.start / makespan * 100}%`;
        bar.style.width = `${job.duration / makespan * 100}%`;
        bar.textContent = job.jobId;
        bar.title =
            `${job.jobId}: starts at ${job.start}, finishes at ${job.finish}`;

        track.appendChild(bar);
        row.append(label, track);
        timeline.appendChild(row);
    }
}

addButton.addEventListener("click", () => addJobRow());
runButton.addEventListener("click", runSimulation);
compareButton.addEventListener("click", comparePolicies);
resetButton.addEventListener("click", loadSample);

loadSample();
