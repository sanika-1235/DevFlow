
const { buildDependencyGraph } = require("./graph");
const { validatePipeline } = require("./validator");

function calculateCriticalPathLengths(jobs, graph) {
    const durations = new Map(
        jobs.map(job => [job.id, job.duration])
    );

    const memo = new Map();

    function getLength(jobId) {
        if (memo.has(jobId)) {
            return memo.get(jobId);
        }

        let longestChild = 0;

        for (const childId of graph.get(jobId)) {
            longestChild = Math.max(
                longestChild,
                getLength(childId)
            );
        }

        const length = durations.get(jobId) + longestChild;
        memo.set(jobId, length);

        return length;
    }

    for (const job of jobs) {
        getLength(job.id);
    }

    return memo;
}

function simulate(jobs, workerCount, policy = "FIFO") {
    if (!["FIFO", "SJF", "CRITICAL_PATH"].includes(policy)) {
        throw new Error(`Unsupported scheduling policy: ${policy}`);
    }

    const validation = validatePipeline(jobs, workerCount);

    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const graph = buildDependencyGraph(jobs);

    const criticalPathLengths =
        policy === "CRITICAL_PATH"
            ? calculateCriticalPathLengths(jobs, graph)
            : new Map();

    const remainingDependencies = new Map();
    const readySince = new Map();
    const totalWaitingTime = new Map();
    const completed = new Set();
    const running = [];
    const schedule = [];

    for (const job of jobs) {
        remainingDependencies.set(
            job.id,
            (job.dependencies ?? []).length
        );

        if ((job.dependencies ?? []).length === 0) {
            readySince.set(job.id, 0);
        }
    }

    let currentTime = 0;

    while (completed.size < jobs.length) {
        const readyJobs = jobs.filter(job =>
            !completed.has(job.id) &&
            !running.some(item => item.id === job.id) &&
            remainingDependencies.get(job.id) === 0
        );

        while (running.length < workerCount && readyJobs.length > 0) {
            if (policy === "SJF") {
                readyJobs.sort((a, b) => a.duration - b.duration);
            } else if (policy === "CRITICAL_PATH") {
                readyJobs.sort(
                    (a, b) =>
                        criticalPathLengths.get(b.id) -
                        criticalPathLengths.get(a.id)
                );
            }

            const job = readyJobs.shift();

            const waitingTime =
                currentTime - readySince.get(job.id);

            totalWaitingTime.set(
                job.id,
                (totalWaitingTime.get(job.id) ?? 0) + waitingTime
            );

            // Find the first available worker.
            const busyWorkers = new Set(
                running.map(item => item.workerId)
            );

            let workerId = 1;

            while (busyWorkers.has(workerId)) {
                workerId++;
            }

            const finishTime = currentTime + job.duration;

            running.push({
                id: job.id,
                finishTime,
                workerId
            });

            schedule.push({
                jobId: job.id,
                workerId,
                start: currentTime,
                finish: finishTime,
                duration: job.duration,
                waitingTime
            });
        }

        if (running.length === 0) {
            throw new Error(
                "Cannot schedule pipeline: cycle or invalid dependencies"
            );
        }

        const nextFinishTime = Math.min(
            ...running.map(job => job.finishTime)
        );

        currentTime = nextFinishTime;

        const finishedJobs = running.filter(
            job => job.finishTime === currentTime
        );

        for (const finished of finishedJobs) {
            completed.add(finished.id);

            for (const childId of graph.get(finished.id)) {
                remainingDependencies.set(
                    childId,
                    remainingDependencies.get(childId) - 1
                );

                if (remainingDependencies.get(childId) === 0) {
                    readySince.set(childId, currentTime);
                }
            }
        }

        for (let i = running.length - 1; i >= 0; i--) {
            if (running[i].finishTime === currentTime) {
                running.splice(i, 1);
            }
        }
    }

    const totalWorkTime = schedule.reduce(
        (total, job) => total + job.duration,
        0
    );

    const totalWorkerTime = workerCount * currentTime;

    const workerUtilization =
        (totalWorkTime / totalWorkerTime) * 100;

    const totalQueueWaitingTime = [...totalWaitingTime.values()]
        .reduce((total, waiting) => total + waiting, 0);

    const averageQueueWaitingTime =
        totalQueueWaitingTime / jobs.length;

    return {
        schedule,
        makespan: currentTime,
        workerUtilization: Number(workerUtilization.toFixed(2)),
        totalQueueWaitingTime,
        averageQueueWaitingTime: Number(
            averageQueueWaitingTime.toFixed(2)
        )
    };
}

module.exports = { simulate };
