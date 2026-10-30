
import { useState } from 'react';
import './App.css';

const sampleJobs = [
  { id: 'A', duration: 3, dependencies: [] },
  { id: 'B', duration: 5, dependencies: ['A'] },
  { id: 'C', duration: 2, dependencies: [] }
];

function Timeline({ schedule, workerCount, makespan }) {
  if (!schedule || schedule.length === 0) return null;

  const workers = Array.from(
    { length: Number(workerCount) },
    (_, index) => index + 1
  );

  const totalTime = Math.max(Number(makespan) || 1, 1);
  const pixelsPerUnit = Math.max(45, 700 / totalTime);
  const timelineWidth = totalTime * pixelsPerUnit;

  const jobColors = [
    '#6366f1',
    '#0891b2',
    '#059669',
    '#d97706',
    '#db2777',
    '#7c3aed'
  ];

  return (
    <div style={{ marginTop: '28px' }}>
      <h3>Pipeline Execution Timeline</h3>

      <p style={{ color: '#94a3b8', marginBottom: '18px' }}>
        Visual representation of job execution across workers.
      </p>

      <div
        style={{
          overflowX: 'auto',
          paddingBottom: '12px'
        }}
      >
        <div style={{ minWidth: `${timelineWidth + 125}px` }}>
          {/* Time scale */}
          <div
            style={{
              display: 'flex',
              marginLeft: '115px',
              width: `${timelineWidth}px`,
              borderBottom: '1px solid #475569',
              paddingBottom: '10px'
            }}
          >
            {Array.from(
              { length: totalTime + 1 },
              (_, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    flex: '1',
                    color: '#94a3b8',
                    fontSize: '12px'
                  }}
                >
                  {index}
                </div>
              )
            )}
          </div>

          {/* Worker lanes */}
          {workers.map((workerId) => {
            const workerJobs = schedule.filter(
              (job) => Number(job.workerId) === workerId
            );

            return (
              <div
                key={workerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '75px',
                  borderBottom: '1px solid #334155'
                }}
              >
                <div
                  style={{
                    width: '115px',
                    flexShrink: 0,
                    fontWeight: '600',
                    color: '#cbd5e1'
                  }}
                >
                  Worker {workerId}
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: `${timelineWidth}px`,
                    height: '55px',
                    backgroundColor: '#1e293b',
                    backgroundImage:
                      'linear-gradient(to right, #475569 1px, transparent 1px)',
                    backgroundSize: `${pixelsPerUnit}px 100%`,
                    borderRadius: '6px'
                  }}
                >
                  {workerJobs.map((job) => {
                    const color =
                      jobColors[
                        schedule.findIndex(
                          (item) => item.jobId === job.jobId
                        ) % jobColors.length
                      ];

                    return (
                      <div
                        key={job.jobId}
                        title={`${job.jobId}: ${job.start} to ${job.finish} (Duration: ${job.duration})`}
                        style={{
                          position: 'absolute',
                          left: `${job.start * pixelsPerUnit}px`,
                          width: `${Math.max(
                            job.duration * pixelsPerUnit - 4,
                            4
                          )}px`,
                          top: '7px',
                          height: '41px',
                          backgroundColor: color,
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '600',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span>{job.jobId}</span>
                        <span style={{ fontSize: '10px' }}>
                          {job.duration} units
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p
            style={{
              color: '#94a3b8',
              fontSize: '12px',
              marginLeft: '115px',
              marginTop: '12px'
            }}
          >
            Time units →
          </p>
        </div>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '13px' }}>
        Total execution time (Makespan): {makespan} units
      </p>
    </div>
  );
}

function App() {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [jobsText, setJobsText] = useState(
    JSON.stringify(sampleJobs, null, 2)
  );

  const [workerCount, setWorkerCount] = useState(2);
  const [policy, setPolicy] = useState('FIFO');

  const [result, setResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);

  const [history, setHistory] = useState([]);

  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');

  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function runSimulation(event) {
    event.preventDefault();

    setError('');
    setResult(null);
    setCompareResult(null);

    let jobs;

    try {
      jobs = JSON.parse(jobsText);

      if (!Array.isArray(jobs)) {
        throw new Error('Jobs must be a JSON array.');
      }
    } catch (err) {
      setError(`Invalid jobs JSON: ${err.message}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobs,
          workerCount: Number(workerCount),
          policy
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Simulation failed.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function comparePolicies() {
    setError('');
    setResult(null);
    setCompareResult(null);

    let jobs;

    try {
      jobs = JSON.parse(jobsText);

      if (!Array.isArray(jobs)) {
        throw new Error('Jobs must be a JSON array.');
      }
    } catch (err) {
      setError(`Invalid jobs JSON: ${err.message}`);
      return;
    }

    setCompareLoading(true);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobs,
          workerCount: Number(workerCount)
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Comparison failed.');
      }

      setCompareResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompareLoading(false);
    }
  }

  async function fetchHistory() {
    setShowHistory(true);
    setShowForm(false);
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const response = await fetch('/api/history');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not load history.');
      }

      const records = Array.isArray(data)
        ? data
        : data.history || data.simulations || [];

      setHistory(records);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function openDashboard() {
    setShowHistory(false);
    setShowForm(false);
  }

  function openSimulation() {
    setShowHistory(false);
    setShowForm(true);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>DevFlow</h2>
        <p>CI Pipeline Simulator</p>

        <nav>
          <a
            className={!showHistory ? 'active' : ''}
            href="#dashboard"
            onClick={openDashboard}
          >
            Dashboard
          </a>

          <a href="#simulation" onClick={openSimulation}>
            New Simulation
          </a>

          <a
            className={showHistory ? 'active' : ''}
            href="#history"
            onClick={fetchHistory}
          >
            History
          </a>
        </nav>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>{showHistory ? 'Simulation History' : 'Dashboard'}</h1>
            <p>
              {showHistory
                ? 'View your previous pipeline simulations.'
                : 'Monitor and optimize your CI pipelines.'}
            </p>
          </div>

          {!showHistory && (
            <button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Close Form' : '+ New Simulation'}
            </button>
          )}

          {showHistory && (
            <button onClick={fetchHistory} disabled={historyLoading}>
              {historyLoading ? 'Refreshing...' : 'Refresh History'}
            </button>
          )}
        </header>

        {!showHistory && (
          <>
            <section className="welcome">
              <h2>Welcome to DevFlow 👋</h2>
              <p>
                Simulate, compare and optimize your CI pipeline
                scheduling strategies.
              </p>
            </section>

            <section className="stats">
              <div className="stat-card">
                <h3>Scheduling Policies</h3>
                <p>3</p>
              </div>

              <div className="stat-card">
                <h3>Available Workers</h3>
                <p>{workerCount}</p>
              </div>

              <div className="stat-card">
                <h3>Current Policy</h3>
                <p>{policy}</p>
              </div>
            </section>
          </>
        )}

        {showForm && !showHistory && (
          <section className="content-card simulation-form" id="simulation">
            <h2>Configure Simulation</h2>

            <form onSubmit={runSimulation}>
              <label>Jobs (JSON format)</label>

              <textarea
                value={jobsText}
                onChange={(event) => setJobsText(event.target.value)}
                rows={9}
                spellCheck="false"
              />

              <label>Number of workers</label>

              <input
                type="number"
                min="1"
                value={workerCount}
                onChange={(event) => setWorkerCount(event.target.value)}
                required
              />

              <label>Scheduling policy</label>

              <select
                value={policy}
                onChange={(event) => setPolicy(event.target.value)}
              >
                <option value="FIFO">FIFO</option>
                <option value="SJF">SJF</option>
                <option value="CRITICAL_PATH">Critical Path</option>
              </select>

              <div className="action-buttons">
                <button
                  type="submit"
                  disabled={loading || compareLoading}
                >
                  {loading ? 'Running...' : 'Run Simulation'}
                </button>

                <button
                  type="button"
                  onClick={comparePolicies}
                  disabled={loading || compareLoading}
                >
                  {compareLoading ? 'Comparing...' : 'Compare All Policies'}
                </button>
              </div>
            </form>

            {error && <p className="error-message">{error}</p>}
          </section>
        )}

        {result && !showHistory && (
          <section className="content-card results">
            <h2>Simulation Results</h2>

            <div className="stats">
              <div className="stat-card">
                <h3>Makespan</h3>
                <p>{result.makespan}</p>
              </div>

              <div className="stat-card">
                <h3>Worker Utilization</h3>
                <p>{result.workerUtilization}%</p>
              </div>

              <div className="stat-card">
                <h3>Total Waiting Time</h3>
                <p>{result.totalQueueWaitingTime}</p>
              </div>
            </div>

            <h3>Execution Schedule</h3>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Worker</th>
                    <th>Start</th>
                    <th>Finish</th>
                    <th>Duration</th>
                    <th>Waiting Time</th>
                  </tr>
                </thead>

                <tbody>
                  {result.schedule?.map((job) => (
                    <tr key={job.jobId}>
                      <td>{job.jobId}</td>
                      <td>{job.workerId}</td>
                      <td>{job.start}</td>
                      <td>{job.finish}</td>
                      <td>{job.duration}</td>
                      <td>{job.waitingTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Timeline
              schedule={result.schedule}
              workerCount={workerCount}
              makespan={result.makespan}
            />
          </section>
        )}

        {compareResult && !showHistory && (
          <section className="content-card results">
            <h2>Policy Comparison Results</h2>

            <div className="stats">
              <div className="stat-card">
                <h3>Best Makespan</h3>
                <p>{compareResult.bestMakespan}</p>
              </div>

              <div className="stat-card">
                <h3>Best Policy</h3>
                <p>{compareResult.bestPolicies.join(', ')}</p>
              </div>

              <div className="stat-card">
                <h3>Policies Compared</h3>
                <p>{compareResult.comparisons.length}</p>
              </div>
            </div>

            <h3>Performance Comparison</h3>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Makespan</th>
                    <th>Worker Utilization</th>
                    <th>Total Waiting</th>
                    <th>Average Waiting</th>
                  </tr>
                </thead>

                <tbody>
                  {compareResult.comparisons.map((item) => (
                    <tr key={item.policy}>
                      <td>{item.policy}</td>
                      <td>{item.makespan}</td>
                      <td>{item.workerUtilization}%</td>
                      <td>{item.totalQueueWaitingTime}</td>
                      <td>{item.averageQueueWaitingTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showHistory && (
          <section className="content-card results" id="history">
            <h2>Previous Simulations</h2>

            {historyLoading && <p>Loading simulation history...</p>}

            {historyError && (
              <p className="error-message">{historyError}</p>
            )}

            {!historyLoading && !historyError && history.length === 0 && (
              <p>No simulation history found yet.</p>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Policy</th>
                      <th>Workers</th>
                      <th>Makespan</th>
                      <th>Utilization</th>
                      <th>Total Waiting</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item) => {
                      const metrics = item.result || item;

                      return (
                        <tr key={item._id}>
                          <td>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : '—'}
                          </td>

                          <td>{item.policy || '—'}</td>
                          <td>{item.workerCount ?? '—'}</td>
                          <td>{metrics.makespan ?? '—'}</td>
                          <td>
                            {metrics.workerUtilization != null
                              ? `${metrics.workerUtilization}%`
                              : '—'}
                          </td>
                          <td>
                            {metrics.totalQueueWaitingTime ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {!showHistory && (
          <section className="content-card">
            <h2>Scheduling Strategies</h2>

            <div className="policies">
              <div>FIFO</div>
              <div>SJF</div>
              <div>Critical Path</div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
