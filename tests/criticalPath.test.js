const { test } = require("node:test");
const assert = require("node:assert/strict");

const { analyzeCriticalPath } = require("../src/criticalPath");

test("calculates earliest and latest times correctly", () => {
    const jobs = [
        { id: "A", duration: 3, dependencies: [] },
        { id: "B", duration: 4, dependencies: ["A"] },
        { id: "C", duration: 2, dependencies: ["A"] },
        { id: "D", duration: 5, dependencies: ["B", "C"] }
    ];

    const result = analyzeCriticalPath(jobs);

    assert.equal(result.projectDuration, 12);

    assert.deepEqual(result.criticalJobs, ["A", "B", "D"]);

    const expected = {
        A: { es: 0, ef: 3, ls: 0, lf: 3, slack: 0 },
        B: { es: 3, ef: 7, ls: 3, lf: 7, slack: 0 },
        C: { es: 3, ef: 5, ls: 5, lf: 7, slack: 2 },
        D: { es: 7, ef: 12, ls: 7, lf: 12, slack: 0 }
    };

    for (const job of result.jobAnalysis) {
        const value = expected[job.jobId];

        assert.equal(job.earliestStart, value.es);
        assert.equal(job.earliestFinish, value.ef);
        assert.equal(job.latestStart, value.ls);
        assert.equal(job.latestFinish, value.lf);
        assert.equal(job.slack, value.slack);
    }
});

test("identifies slack in independent jobs", () => {
    const jobs = [
        { id: "A", duration: 4, dependencies: [] },
        { id: "B", duration: 2, dependencies: [] }
    ];

    const result = analyzeCriticalPath(jobs);

    assert.equal(result.projectDuration, 4);
    assert.deepEqual(result.criticalJobs, ["A"]);

    const jobB = result.jobAnalysis.find(job => job.jobId === "B");

    assert.equal(jobB.slack, 2);
    assert.equal(jobB.isCritical, false);
});

test("rejects a pipeline containing a cycle", () => {
    const jobs = [
        { id: "A", duration: 3, dependencies: ["B"] },
        { id: "B", duration: 2, dependencies: ["A"] }
    ];

    assert.throws(() => analyzeCriticalPath(jobs));
});