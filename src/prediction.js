
const { validatePipeline } = require("./validator");

const SUPPORTED_POLICIES = ["FIFO", "SJF", "CRITICAL_PATH"];

const MIN_SIMILARITY = 0.65;
const MAX_MATCHES = 5;

// Calculate total execution time of all jobs.
function getTotalDuration(jobs) {
    return jobs.reduce((total, job) => total + job.duration, 0);
}

// Calculate the total number of dependency relationships.
function getDependencyCount(jobs) {
    return jobs.reduce(
        (total, job) => total + (job.dependencies ?? []).length,
        0
    );
}

// Get a sorted profile of job durations.
function getDurationProfile(jobs) {
    return jobs
        .map(job => job.duration)
        .sort((a, b) => a - b);
}

// Get a sorted profile of dependency counts per job.
function getDependencyProfile(jobs) {
    return jobs
        .map(job => (job.dependencies ?? []).length)
        .sort((a, b) => a - b);
}

// Compare two numeric values and return a similarity between 0 and 1.
function calculateValueSimilarity(a, b) {
    const maximum = Math.max(Math.abs(a), Math.abs(b), 1);

    return Math.max(0, 1 - Math.abs(a - b) / maximum);
}

// Compare two sorted numeric profiles.
function calculateProfileSimilarity(profileA, profileB) {
    if (profileA.length !== profileB.length) {
        return 0;
    }

    if (profileA.length === 0) {
        return 1;
    }

    const similarities = profileA.map((value, index) =>
        calculateValueSimilarity(value, profileB[index])
    );

    return similarities.reduce((sum, value) => sum + value, 0)
        / similarities.length;
}

// Calculate how closely a historical pipeline resembles the current one.
function calculateSimilarity(currentJobs, historicalJobs) {
    if (
        !Array.isArray(historicalJobs) ||
        historicalJobs.length !== currentJobs.length
    ) {
        return 0;
    }

    const currentDurationProfile = getDurationProfile(currentJobs);
    const historicalDurationProfile = getDurationProfile(historicalJobs);

    const currentDependencyProfile = getDependencyProfile(currentJobs);
    const historicalDependencyProfile = getDependencyProfile(historicalJobs);

    const durationSimilarity = calculateProfileSimilarity(
        currentDurationProfile,
        historicalDurationProfile
    );

    const dependencySimilarity = calculateProfileSimilarity(
        currentDependencyProfile,
        historicalDependencyProfile
    );

    const totalDurationSimilarity = calculateValueSimilarity(
        getTotalDuration(currentJobs),
        getTotalDuration(historicalJobs)
    );

    const dependencyCountSimilarity = calculateValueSimilarity(
        getDependencyCount(currentJobs),
        getDependencyCount(historicalJobs)
    );

    return (
        durationSimilarity * 0.40 +
        dependencySimilarity * 0.30 +
        totalDurationSimilarity * 0.15 +
        dependencyCountSimilarity * 0.15
    );
}

// Predict makespan using similar historical executions.
function predictMakespan(
    currentJobs,
    workerCount,
    policy,
    historicalRecords
) {
    // Validate the current pipeline.
    const validation = validatePipeline(currentJobs, workerCount);

    if (!validation.valid) {
        throw new Error(validation.error);
    }

    if (!SUPPORTED_POLICIES.includes(policy)) {
        throw new Error(
            `Unsupported scheduling policy: ${policy}`
        );
    }

    if (!Array.isArray(historicalRecords)) {
        throw new Error("Historical records must be an array");
    }

    // Only use completed simulations with the same policy and worker count.
    const eligibleRecords = historicalRecords.filter(record => {
        return (
            record &&
            record.policy === policy &&
            record.workerCount === workerCount &&
            Array.isArray(record.jobs) &&
            typeof record.result?.makespan === "number" &&
            Number.isFinite(record.result.makespan) &&
            record.result.makespan >= 0
        );
    });

    // Calculate similarity for every eligible historical execution.
    const matches = eligibleRecords
        .map(record => ({
            makespan: record.result.makespan,
            similarity: calculateSimilarity(
                currentJobs,
                record.jobs
            ),
            createdAt: record.createdAt ?? null
        }))
        .filter(record => record.similarity >= MIN_SIMILARITY)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, MAX_MATCHES);

    // Return an honest response when there is insufficient history.
    if (matches.length === 0) {
        return {
            success: true,
            predictionAvailable: false,
            predictedMakespan: null,
            confidence: "INSUFFICIENT_DATA",
            matchedRecords: 0,
            reason:
                "No sufficiently similar historical executions were found. " +
                "Run more simulations to build prediction history."
        };
    }

    // Calculate a similarity-weighted average.
    const totalWeight = matches.reduce(
        (sum, record) => sum + record.similarity,
        0
    );

    const weightedMakespan = matches.reduce(
        (sum, record) =>
            sum + record.makespan * record.similarity,
        0
    );

    const predictedMakespan = Number(
        (weightedMakespan / totalWeight).toFixed(2)
    );

    const averageSimilarity = matches.reduce(
        (sum, record) => sum + record.similarity,
        0
    ) / matches.length;

    // Confidence depends on both the number and similarity of matches.
    let confidence = "LOW";

    if (matches.length >= 5 && averageSimilarity >= 0.85) {
        confidence = "HIGH";
    } else if (matches.length >= 3 && averageSimilarity >= 0.75) {
        confidence = "MEDIUM";
    }

    return {
        success: true,
        predictionAvailable: true,
        predictedMakespan,
        confidence,
        matchedRecords: matches.length,
        averageSimilarity: Number(
            (averageSimilarity * 100).toFixed(2)
        ),
        policy,
        workerCount,
        reason:
            `Estimated using ${matches.length} similar historical ` +
            `execution(s) with the same scheduling policy and worker count.`,
        matches
    };
}

module.exports = {
    predictMakespan,
    calculateSimilarity
};
