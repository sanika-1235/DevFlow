
function buildDependencyGraph(jobs) {
    const graph = new Map();

    // Create an entry for every job.
    for (const job of jobs) {
        graph.set(job.id, []);
    }

    // Record which jobs depend on each job.
    for (const job of jobs) {
        for (const dependencyId of job.dependencies ?? []) {
            graph.get(dependencyId).push(job.id);
        }
    }

    return graph;
}

module.exports = { buildDependencyGraph };
