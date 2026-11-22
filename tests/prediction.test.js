
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    predictMakespan,
    calculateSimilarity
} = require("../src/prediction");

const currentJobs = [
    { id: "A", duration: 3, dependencies: [] },
    { id: "B", duration: 5, dependencies: ["A"] },
    { id: "C", duration: 2, dependencies: [] }
];

function createHistoryRecord(jobs, makespan, policy = "FIFO", workerCount = 2) {
    return {
        jobs,
        workerCount,
        policy,
        result: { makespan },
        createdAt: new Date()
    };
}

test("calculates similarity for identical pipelines", () => {
    const similarity = calculateSimilarity(
        currentJobs,
        currentJobs
    );

    assert.equal(similarity, 1);
});

test("predicts makespan using matching historical records", () => {
    const history = [
        createHistoryRecord(currentJobs, 10),
        createHistoryRecord(currentJobs, 12),
        createHistoryRecord(currentJobs, 14)
    ];

    const result = predictMakespan(
        currentJobs,
        2,
        "FIFO",
        history
    );

    assert.equal(result.success, true);
    assert.equal(result.predictionAvailable, true);
    assert.equal(result.predictedMakespan, 12);
    assert.equal(result.matchedRecords, 3);
    assert.equal(result.confidence, "MEDIUM");
});

test("ignores records with a different scheduling policy", () => {
    const history = [
        createHistoryRecord(currentJobs, 10, "SJF"),
        createHistoryRecord(currentJobs, 12, "CRITICAL_PATH")
    ];

    const result = predictMakespan(
        currentJobs,
        2,
        "FIFO",
        history
    );

    assert.equal(result.predictionAvailable, false);
    assert.equal(result.matchedRecords, 0);
});

test("ignores records with a different worker count", () => {
    const history = [
        createHistoryRecord(currentJobs, 10, "FIFO", 1),
        createHistoryRecord(currentJobs, 12, "FIFO", 4)
    ];

    const result = predictMakespan(
        currentJobs,
        2,
        "FIFO",
        history
    );

    assert.equal(result.predictionAvailable, false);
});

test("returns insufficient data when no similar history exists", () => {
    const differentJobs = [
        { id: "A", duration: 3, dependencies: [] },
        { id: "B", duration: 5, dependencies: ["A"] },
        { id: "C", duration: 2, dependencies: [] },
        { id: "D", duration: 4, dependencies: [] }
    ];

    const history = [
        createHistoryRecord(differentJobs, 15)
    ];

    const result = predictMakespan(
        currentJobs,
        2,
        "FIFO",
        history
    );

    assert.equal(result.predictionAvailable, false);
    assert.equal(result.confidence, "INSUFFICIENT_DATA");
});

test("rejects an unsupported scheduling policy", () => {
    assert.throws(
        () => predictMakespan(currentJobs, 2, "ROUND_ROBIN", []),
        /Unsupported scheduling policy/
    );
});

test("rejects an invalid pipeline", () => {
    assert.throws(
        () => predictMakespan([], 2, "FIFO", []),
        /Pipeline must contain at least one job/
    );
});

test("rejects invalid historical records input", () => {
    assert.throws(
        () => predictMakespan(currentJobs, 2, "FIFO", null),
        /Historical records must be an array/
    );
});
