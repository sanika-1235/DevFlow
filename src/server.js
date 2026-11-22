
require("dotenv").config();

const express = require("express");
const { simulate } = require("./scheduler");
const { analyzeCriticalPath } = require("./criticalPath");
const { predictMakespan } = require("./prediction");
const connectDB = require("./db");
const Simulation = require("./models/Simulation");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to DevFlow API",
        status: "running"
    });
});

// Run one scheduling policy and save its result
app.post("/api/simulate", async (req, res) => {
    try {
        const { jobs, workerCount, policy = "FIFO" } = req.body;
        const result = simulate(jobs, workerCount, policy);

        await Simulation.create({
            jobs,
            workerCount,
            policy,
            result
        });

        res.json({
            success: true,
            policy,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Compare all scheduling policies and save the comparison
app.post("/api/compare", async (req, res) => {
    try {
        const { jobs, workerCount } = req.body;
        const policies = ["FIFO", "SJF", "CRITICAL_PATH"];

        const comparisons = policies.map((policy) => {
            const result = simulate(jobs, workerCount, policy);

            return {
                policy,
                makespan: result.makespan,
                workerUtilization: result.workerUtilization,
                totalQueueWaitingTime: result.totalQueueWaitingTime,
                averageQueueWaitingTime: result.averageQueueWaitingTime
            };
        });

        const bestMakespan = Math.min(
            ...comparisons.map((result) => result.makespan)
        );

        const bestPolicies = comparisons
            .filter((result) => result.makespan === bestMakespan)
            .map((result) => result.policy);

        const comparisonResult = {
            comparisons,
            bestMakespan,
            bestPolicies
        };

        await Simulation.create({
            jobs,
            workerCount,
            policy: "COMPARISON",
            result: comparisonResult
        });

        res.json({
            success: true,
            ...comparisonResult
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Intelligently recommend the best scheduling policy
app.post("/api/recommend-policy", async (req, res) => {
    try {
        const { jobs, workerCount } = req.body;

        const policies = ["FIFO", "SJF", "CRITICAL_PATH"];

        const comparisons = policies.map((policy) => {
            const result = simulate(jobs, workerCount, policy);

            return {
                policy,
                makespan: result.makespan,
                workerUtilization: result.workerUtilization,
                totalQueueWaitingTime: result.totalQueueWaitingTime,
                averageQueueWaitingTime: result.averageQueueWaitingTime
            };
        });

        const rankedResults = [...comparisons].sort((a, b) => {
            if (a.makespan !== b.makespan) {
                return a.makespan - b.makespan;
            }

            return (
                a.totalQueueWaitingTime -
                b.totalQueueWaitingTime
            );
        });

        const recommendation = rankedResults[0];
        const bestMakespan = recommendation.makespan;

        const bestPolicies = comparisons
            .filter(result => result.makespan === bestMakespan)
            .map(result => result.policy);

        let reason;

        if (bestPolicies.length === 1) {
            reason =
                `${recommendation.policy} achieves the lowest makespan ` +
                `of ${recommendation.makespan} time units.`;
        } else {
            reason =
                `${recommendation.policy} achieves the lowest makespan ` +
                `of ${recommendation.makespan} time units and has the ` +
                `lowest total queue waiting time among the tied policies.`;
        }

        const recommendationResult = {
            comparisons,
            recommendation,
            bestMakespan,
            bestPolicies,
            reason
        };

        await Simulation.create({
            jobs,
            workerCount,
            policy: "COMPARISON",
            result: recommendationResult
        });

        res.json({
            success: true,
            ...recommendationResult
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Analyze performance with different worker counts
app.post("/api/worker-analysis", (req, res) => {
    try {
        const {
            jobs,
            workerCounts = [1, 2, 3, 4, 5],
            policy = "FIFO"
        } = req.body;

        if (!Array.isArray(workerCounts) || workerCounts.length === 0) {
            throw new Error("Worker counts must be a non-empty array.");
        }

        if (
            workerCounts.some(
                count =>
                    !Number.isInteger(count) ||
                    count <= 0 ||
                    count > 20
            )
        ) {
            throw new Error(
                "Each worker count must be a positive integer between 1 and 20."
            );
        }

        if (new Set(workerCounts).size !== workerCounts.length) {
            throw new Error("Worker counts must not contain duplicates.");
        }

        const results = workerCounts.map((workerCount) => {
            const result = simulate(jobs, workerCount, policy);

            return {
                workerCount,
                makespan: result.makespan,
                workerUtilization: result.workerUtilization,
                totalQueueWaitingTime: result.totalQueueWaitingTime,
                averageQueueWaitingTime: result.averageQueueWaitingTime
            };
        });

        const bestMakespan = Math.min(
            ...results.map(result => result.makespan)
        );

        const bestWorkerCounts = results
            .filter(result => result.makespan === bestMakespan)
            .map(result => result.workerCount);

        const recommendedWorkerCount = Math.min(
            ...bestWorkerCounts
        );

        res.json({
            success: true,
            policy,
            results,
            bestMakespan,
            bestWorkerCounts,
            recommendedWorkerCount
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Analyze the Critical Path using CPM
app.post("/api/critical-path", (req, res) => {
    try {
        const { jobs } = req.body;
        const result = analyzeCriticalPath(jobs);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Predict makespan using historical simulation records
app.post("/api/predict-makespan", async (req, res) => {
    try {
        const {
            jobs,
            workerCount,
            policy = "FIFO"
        } = req.body;

        // Retrieve recent individual simulation records.
        const historicalRecords = await Simulation.find({
            policy,
            workerCount
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Generate a prediction using the historical records.
        const prediction = predictMakespan(
            jobs,
            workerCount,
            policy,
            historicalRecords
        );

        res.json(prediction);
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Retrieve the latest 20 saved simulations
app.get("/api/history", async (req, res) => {
    try {
        const history = await Simulation.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Could not retrieve simulation history."
        });
    }
});

// Start server after MongoDB connects
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `DevFlow API running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Failed to start DevFlow server:", error.message);
        process.exit(1);
    }
}

startServer();
