
const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema({
    jobs: {
        type: Array,
        required: true
    },

    workerCount: {
        type: Number,
        required: true,
        min: 1
    },

    policy: {
        type: String,
        enum: ["FIFO", "SJF", "CRITICAL_PATH", "COMPARISON"],
        required: true
    },

    result: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Simulation", simulationSchema);
