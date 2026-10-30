function validateUniqueIds(jobs) {
    const seen = new Set();

    for (const job of jobs) {
        if (seen.has(job.id)) {
            return {
                valid: false,
                error: `Duplicate job ID: ${job.id}`
            };
        }

        seen.add(job.id);
    }

    return { valid: true };
}



function validateDurations(jobs) {
    for (const job of jobs) {
        if (
            typeof job.duration !== "number" ||
            !Number.isFinite(job.duration) ||
            job.duration <= 0
        ) {
            return {
                valid: false,
                error: `Invalid duration for job: ${job.id}`
            };
        }
    }

    return { valid: true };
}



function validateDependencies(jobs) {
    const jobIds = new Set();

    for (const job of jobs) {
        jobIds.add(job.id);
    }

    for (const job of jobs) {
        for (const dependencyId of job.dependencies ?? []) {
            if (!jobIds.has(dependencyId)) {
                return {
                    valid: false,
                    error: `Job ${job.id} depends on missing job: ${dependencyId}`
                };
            }
        }
    }

    return { valid: true };
}


function hasCycle(jobs) {
    const dependencies = new Map();
    const state = new Map();

    for (const job of jobs) {
        dependencies.set(job.id, job.dependencies ?? []);
        state.set(job.id, "unvisited");
    }

    function dfs(jobId) {
        state.set(jobId, "visiting");

        for (const dependencyId of dependencies.get(jobId)) {
            if (state.get(dependencyId) === "visiting") {
                return true;
            }

            if (state.get(dependencyId) === "unvisited") {
                if (dfs(dependencyId)) {
                    return true;
                }
            }
        }

        state.set(jobId, "visited");
        return false;
    }

    for (const job of jobs) {
        if (state.get(job.id) === "unvisited") {
            if (dfs(job.id)) {
                return true;
            }
        }
    }

    return false;
}


function validatePipeline(jobs, workerCount) {
    // Check that jobs is an array and is not empty.
    if (!Array.isArray(jobs) || jobs.length === 0) {
        return {
            valid: false,
            error: "Pipeline must contain at least one job"
        };
    }

    // Worker count must be a positive integer.
    if (!Number.isInteger(workerCount) || workerCount <= 0) {
        return {
            valid: false,
            error: "Worker count must be a positive integer"
        };
    }

    // Every job must be an object with a non-empty string ID.
    for (const job of jobs) {
        if (
            job === null ||
            typeof job !== "object" ||
            Array.isArray(job) ||
            typeof job.id !== "string" ||
            job.id.trim() === ""
        ) {
            return {
                valid: false,
                error: "Every job must have a non-empty string ID"
            };
        }

        // Dependencies must be an array of string IDs.
        if (
            job.dependencies !== undefined &&
            (
                !Array.isArray(job.dependencies) ||
                !job.dependencies.every(
                    id => typeof id === "string" && id.trim() !== ""
                )
            )
        ) {
            return {
                valid: false,
                error: `Invalid dependencies for job: ${job.id}`
            };
        }
    }

    const idResult = validateUniqueIds(jobs);
    if (!idResult.valid) return idResult;

    const durationResult = validateDurations(jobs);
    if (!durationResult.valid) return durationResult;

    const dependencyResult = validateDependencies(jobs);
    if (!dependencyResult.valid) return dependencyResult;

    if (hasCycle(jobs)) {
        return {
            valid: false,
            error: "Pipeline contains a dependency cycle"
        };
    }

    return { valid: true };
}


module.exports = {
    validateUniqueIds,
    validateDurations,
    validateDependencies,
    hasCycle,
    validatePipeline
};