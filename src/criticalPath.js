
const { buildDependencyGraph } = require("./graph");
const { validatePipeline } = require("./validator");

function analyzeCriticalPath(jobs) {
    const validation = validatePipeline(jobs, 1);

    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const graph = buildDependencyGraph(jobs);

    const jobMap = new Map(
        jobs.map(job => [job.id, job])
    );

    const inDegree = new Map();

    for (const job of jobs) {
        inDegree.set(
            job.id,
            (job.dependencies ?? []).length
        );
    }

    // Generate topological ordering using Kahn's algorithm.
    const queue = jobs
        .filter(job => inDegree.get(job.id) === 0)
        .map(job => job.id);

    const topologicalOrder = [];

    while (queue.length > 0) {
        const jobId = queue.shift();

        topologicalOrder.push(jobId);

        for (const childId of graph.get(jobId)) {
            inDegree.set(
                childId,
                inDegree.get(childId) - 1
            );

            if (inDegree.get(childId) === 0) {
                queue.push(childId);
            }
        }
    }

    if (topologicalOrder.length !== jobs.length) {
        throw new Error("Cannot analyze a pipeline containing a cycle");
    }

    const earliestStart = new Map();
    const earliestFinish = new Map();

    // FORWARD PASS
    for (const jobId of topologicalOrder) {
        const job = jobMap.get(jobId);

        let es = 0;

        for (const dependencyId of job.dependencies ?? []) {
            es = Math.max(
                es,
                earliestFinish.get(dependencyId)
            );
        }

        earliestStart.set(jobId, es);
        earliestFinish.set(jobId, es + job.duration);
    }

    const projectDuration = Math.max(
        ...earliestFinish.values()
    );

    const latestStart = new Map();
    const latestFinish = new Map();

    // BACKWARD PASS
    for (const jobId of [...topologicalOrder].reverse()) {
        const job = jobMap.get(jobId);
        const children = graph.get(jobId);

        let lf = projectDuration;

        if (children.length > 0) {
            lf = Math.min(
                ...children.map(childId =>
                    latestStart.get(childId)
                )
            );
        }

        latestFinish.set(jobId, lf);
        latestStart.set(jobId, lf - job.duration);
    }

    // Calculate slack and identify critical jobs.
    const jobAnalysis = jobs.map(job => {
        const es = earliestStart.get(job.id);
        const ef = earliestFinish.get(job.id);
        const ls = latestStart.get(job.id);
        const lf = latestFinish.get(job.id);
        const slack = ls - es;

        return {
            jobId: job.id,
            duration: job.duration,
            earliestStart: es,
            earliestFinish: ef,
            latestStart: ls,
            latestFinish: lf,
            slack,
            isCritical: slack === 0
        };
    });

    const criticalJobs = jobAnalysis
        .filter(job => job.isCritical)
        .map(job => job.jobId);

    return {
        projectDuration,
        criticalJobs,
        jobAnalysis
    };
}

module.exports = { analyzeCriticalPath };
