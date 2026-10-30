
require("dotenv").config();

const express = require("express");
const { simulate } = require("./scheduler");
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

// Compare policies and save the comparison
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
        console.error("❌ Failed to start DevFlow:", error.message);
        process.exit(1);
    }
}

startServer();
