
const { simulate } = require("../src/scheduler");

const jobs = [
    { id: "A", duration: 3, dependencies: [] },
    { id: "B", duration: 5, dependencies: ["A"] },
    { id: "C", duration: 2, dependencies: [] }
];

const result = simulate(jobs, 2, "CRITICAL_PATH");

console.log("Schedule:", result.schedule);
console.log("Makespan:", result.makespan);


console.log("\nTesting invalid pipeline:");

try {
    simulate([
        { id: "A", duration: 3, dependencies: ["B"] },
        { id: "B", duration: 2, dependencies: ["A"] }
    ], 2);
} catch (error) {
    console.log("Caught error:", error.message);
}


console.log("\n===== POLICY COMPARISON =====");

const policies = ["FIFO", "SJF", "CRITICAL_PATH"];


const comparisonJobs = [
    { id: "A", duration: 2, dependencies: [] },
    { id: "B", duration: 8, dependencies: ["A"] },
    { id: "C", duration: 7, dependencies: [] },
    { id: "D", duration: 1, dependencies: [] },
    { id: "E", duration: 1, dependencies: [] }
];


for (const policy of policies) {
    const result = simulate(comparisonJobs, 2, policy);

    console.log(`\n${policy}:`);
    console.log("Schedule:", result.schedule);
    console.log("Makespan:", result.makespan);
    console.log("Worker utilization:", result.workerUtilization + "%");
    console.log("Total queue waiting:", result.totalQueueWaitingTime);
    console.log("Average queue waiting:", result.averageQueueWaitingTime);
    console.log("Per-job waiting times:",
        result.schedule.map(job => ({
            jobId: job.jobId,
            waitingTime: job.waitingTime
         }))
    );
}
