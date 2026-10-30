const {
    validateUniqueIds,
    validateDurations,
    validateDependencies,
    hasCycle,
    validatePipeline
} = require("../src/validator");

const jobs = [
    { id: "A", duration: 3, dependencies: [] },
    { id: "B", duration: 5, dependencies: ["A"] }
];

console.log("Unique IDs:", validateUniqueIds(jobs));
console.log("Durations:", validateDurations(jobs));
console.log("Dependencies:", validateDependencies(jobs));
console.log("Has cycle:", hasCycle(jobs));
console.log(
    "Valid pipeline:",
    validatePipeline([
        { id: "A", duration: 3, dependencies: [] },
        { id: "B", duration: 5, dependencies: ["A"] }
    ], 2)
);

console.log(
    "Empty pipeline:",
    validatePipeline([], 2)
);

console.log(
    "Invalid worker count:",
    validatePipeline([
        { id: "A", duration: 3, dependencies: [] }
    ], 0)
);

console.log(
    "Duplicate IDs:",
    validatePipeline([
        { id: "A", duration: 3, dependencies: [] },
        { id: "A", duration: 2, dependencies: [] }
    ], 2)
);

console.log(
    "Invalid duration:",
    validatePipeline([
        { id: "A", duration: 0, dependencies: [] }
    ], 2)
);

console.log(
    "Missing dependency:",
    validatePipeline([
        { id: "A", duration: 3, dependencies: ["X"] }
    ], 2)
);

console.log(
    "Dependency cycle:",
    validatePipeline([
        { id: "A", duration: 3, dependencies: ["B"] },
        { id: "B", duration: 2, dependencies: ["A"] }
    ], 2)
);


const { buildDependencyGraph } = require("../src/graph");

const graphJobs = [
    { id: "A", duration: 3, dependencies: [] },
    { id: "B", duration: 5, dependencies: ["A"] },
    { id: "C", duration: 2, dependencies: ["A"] },
    { id: "D", duration: 4, dependencies: ["B", "C"] }
];

const graph = buildDependencyGraph(graphJobs);

console.log("\nDependency graph:");
for (const [jobId, children] of graph) {
    console.log(`${jobId} -> ${children.join(", ") || "none"}`);
}


const { simulate } = require("../src/scheduler");