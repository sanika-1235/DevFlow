# DevFlow – CI Pipeline Scheduling Simulator

**Simulate, compare, and analyze CI pipeline execution using multiple scheduling strategies.**

DevFlow is a CI pipeline scheduling simulator that models how jobs in a Continuous Integration (CI) pipeline are executed across multiple workers. It validates job dependencies, detects circular dependencies, simulates execution, and compares scheduling strategies to analyze pipeline performance.

The project demonstrates how different scheduling decisions and worker allocation strategies can affect pipeline execution time and resource utilization.

## Key Features

- **Pipeline Validation:** Validates job configurations, durations, and dependencies.
- **Dependency Management:** Builds a dependency graph and detects circular dependencies.
- **Multi-Worker Simulation:** Simulates pipeline execution across configurable workers.
- **Multiple Scheduling Strategies:** Supports FIFO, Shortest Job First (SJF), and Critical Path scheduling.
- **Performance Analysis:** Calculates execution metrics to evaluate scheduling efficiency.
- **Timeline Visualization:** Displays job execution across separate worker lanes using a Gantt-style timeline.
- **Policy Comparison:** Compares scheduling strategies based on execution time and resource usage.
- **Execution History:** Stores simulation results in MongoDB and retrieves recent executions.

## Scheduling Strategies

DevFlow implements three scheduling policies:

| Strategy | Description |
|---|---|
| FIFO | Executes available jobs in First In, First Out order. |
| SJF | Prioritizes available jobs with shorter execution durations. |
| Critical Path | Prioritizes jobs based on their importance to the pipeline's critical path. |

## Performance Metrics

DevFlow evaluates scheduling performance using the following metrics:

| Metric | Description |
|---|---|
| Makespan | Total time required to complete the pipeline. |
| Worker Utilization | Percentage of available worker time spent executing jobs. |
| Total Queue Waiting Time | Combined waiting time of all jobs before execution. |
| Average Queue Waiting Time | Average waiting time across all jobs. |

## Tech Stack

**Frontend**
- React
- Vite
- CSS

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB Atlas
- Mongoose

**Core Logic and Testing**
- JavaScript
- Node.js Test Runner

**Version Control**
- Git
- GitHub

## How It Works

1. Define pipeline jobs with their execution durations and dependencies.
2. Validate job configurations and dependency relationships.
3. Build the dependency graph and detect circular dependencies.
4. Simulate job execution across multiple workers.
5. Apply different scheduling strategies.
6. Calculate execution and resource utilization metrics.
7. Visualize job execution through a Gantt-style timeline.
8. Compare scheduling policies and identify the best makespan.
9. Store simulation results for future reference.

## Project Structure

```text
DevFlow/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── public/
│
├── src/
│   ├── models/
│   │   └── Simulation.js
│   ├── db.js
│   ├── graph.js
│   ├── scheduler.js
│   ├── server.js
│   ├── test-db.js
│   └── validator.js
│
├── tests/
│   ├── scheduler.test.js
│   └── validator.test.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account or a MongoDB connection string

### 1. Clone the Repository

```bash
git clone https://github.com/sanika-1235/DevFlow.git
cd DevFlow
```

### 2. Install Backend Dependencies

From the root project directory:

```bash
npm install
```

### 3. Install Frontend Dependencies

Navigate to the client directory:

```bash
cd client
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root `DevFlow` directory.

Add your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

Replace the placeholder with your actual MongoDB connection string.

**Important:** Keep your database credentials private. Never upload your `.env` file to GitHub.

### 5. Start the Backend

Open a terminal in the root `DevFlow` directory and run:

```bash
node src/server.js
```

The backend connects to MongoDB before starting the Express server.

Once running, the API is available at:

```text
http://localhost:3000
```

### 6. Start the Frontend

Open a separate terminal and navigate to the `client` directory:

```bash
cd client
npm run dev
```

Vite will provide a local development URL in the terminal. Open that URL in your browser to access DevFlow.

### 7. Run Tests

From the root `DevFlow` directory:

```bash
node --test
```

This runs the automated test suites for pipeline validation and scheduling logic.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Checks the API status. |
| POST | `/api/simulate` | Executes a pipeline using a selected scheduling policy and saves the result. |
| POST | `/api/compare` | Compares FIFO, SJF, and Critical Path scheduling policies. |
| GET | `/api/history` | Retrieves the latest 20 saved simulations. |

## Future Enhancements

- Visual pipeline graph editor.
- GitHub Actions integration.
- Execution-time prediction.
- Pipeline caching optimization.

## Project Status

**Core MVP implemented.**

## Author

**Sanika K. S.**

- GitHub: [sanika-1235](https://github.com/sanika-1235)
- Project Repository: [DevFlow](https://github.com/sanika-1235/DevFlow)

---

*DevFlow explores how scheduling decisions, dependency management, and worker allocation influence the performance of CI pipelines.*