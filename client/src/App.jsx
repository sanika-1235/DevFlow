import { useEffect, useRef, useState } from 'react';
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
    <div className="timeline-section" style={{ marginTop: '28px' }}>
      <div className="section-heading">
        <div>
          <span className="section-kicker">VISUAL ANALYSIS</span>
          <h3>Pipeline Execution Timeline</h3>
        </div>
        <span className="timeline-total">{makespan} time units</span>
      </div>

      <p style={{ color: '#94a3b8', marginBottom: '18px' }}>
        Visual representation of job execution across workers.
      </p>

      <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
        <div style={{ minWidth: `${timelineWidth + 125}px` }}>
          <div
            style={{
              display: 'flex',
              marginLeft: '115px',
              width: `${timelineWidth}px`,
              borderBottom: '1px solid #475569',
              paddingBottom: '10px'
            }}
          >
            {Array.from({ length: totalTime + 1 }, (_, index) => (
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
            ))}
          </div>

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

  const [inputMode, setInputMode] = useState('visual');

  const [visualJobs, setVisualJobs] = useState(
    sampleJobs.map((job) => ({
      ...job,
      dependenciesText: job.dependencies.join(', ')
    }))
  );

  const [jobsText, setJobsText] = useState(
    JSON.stringify(sampleJobs, null, 2)
  );

  const [workerCount, setWorkerCount] = useState(2);
  const [policy, setPolicy] = useState('FIFO');

  const [result, setResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [comparisonView, setComparisonView] = useState('table');
  const [resultsView, setResultsView] = useState('simulation');

  const [history, setHistory] = useState([]);

  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [showCloseReminder, setShowCloseReminder] = useState(false);
  const [notice, setNotice] = useState('');

  const noticeTimer = useRef(null);
  const completedSimulationSignature = useRef(null);
  const completedComparisonSignature = useRef(null);

  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const simulationInProgress = useRef(false);
  const comparisonInProgress = useRef(false);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  function showNotice(message) {
    setNotice(message);

    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }

    noticeTimer.current = setTimeout(() => {
      setNotice('');
      noticeTimer.current = null;
    }, 2500);
  }

  function clearCurrentResults() {
    setResult(null);
    setCompareResult(null);
    setResultsView('simulation');
    setComparisonView('table');
    setError('');
    setShowCloseReminder(false);
    setNotice('');

    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
  }

  // Called only when the user changes the pipeline configuration.
  // This allows the updated configuration to be run again.
  function handleConfigurationChange() {
    completedSimulationSignature.current = null;
    completedComparisonSignature.current = null;
    clearCurrentResults();
  }

  function resetSimulationForm() {
    setVisualJobs(
      sampleJobs.map((job) => ({
        ...job,
        dependenciesText: job.dependencies.join(', ')
      }))
    );

    setJobsText(JSON.stringify(sampleJobs, null, 2));
    setInputMode('visual');
    setWorkerCount(2);
    setPolicy('FIFO');

    completedSimulationSignature.current = null;
    completedComparisonSignature.current = null;

    clearCurrentResults();
  }

  function closeSimulationForm() {
    if (
      simulationInProgress.current ||
      comparisonInProgress.current
    ) {
      showNotice(
        'Please wait until the current operation finishes before closing the form.'
      );
      return;
    }

    resetSimulationForm();
    setShowForm(false);
  }

  function getVisualJobs() {
    const jobs = visualJobs.map((job) => ({
      id: job.id.trim(),
      duration: Number(job.duration),
      dependencies: job.dependenciesText
        .split(',')
        .map((dependency) => dependency.trim())
        .filter(Boolean)
    }));

    if (jobs.length === 0) {
      throw new Error('Add at least one job to your pipeline.');
    }

    if (jobs.some((job) => !job.id)) {
      throw new Error('Every job must have a Job ID.');
    }

    const ids = jobs.map((job) => job.id);

    if (new Set(ids).size !== ids.length) {
      throw new Error('Each job must have a unique Job ID.');
    }

    if (
      jobs.some(
        (job) =>
          !Number.isFinite(job.duration) ||
          job.duration <= 0
      )
    ) {
      throw new Error(
        'Every job must have a duration greater than zero.'
      );
    }

    return jobs;
  }

  function getJobsForRequest() {
    if (inputMode === 'visual') {
      return getVisualJobs();
    }

    const jobs = JSON.parse(jobsText);

    if (!Array.isArray(jobs)) {
      throw new Error('Jobs must be a JSON array.');
    }

    return jobs;
  }

  function updateJob(index, field, value) {
    handleConfigurationChange();

    setVisualJobs((currentJobs) =>
      currentJobs.map((job, jobIndex) =>
        jobIndex === index
          ? { ...job, [field]: value }
          : job
      )
    );
  }

  function addJob() {
    handleConfigurationChange();

    const existingIds = new Set(
      visualJobs.map((job) => job.id.trim().toUpperCase())
    );

    let newId = '';

    for (let index = 0; index < 26; index += 1) {
      const candidate = String.fromCharCode(65 + index);

      if (!existingIds.has(candidate)) {
        newId = candidate;
        break;
      }
    }

    if (!newId) {
      let number = 1;

      while (existingIds.has(`JOB${number}`)) {
        number += 1;
      }

      newId = `Job${number}`;
    }

    setVisualJobs((currentJobs) => [
      ...currentJobs,
      {
        id: newId,
        duration: 2,
        dependenciesText: ''
      }
    ]);
  }

  function removeJob(index) {
    handleConfigurationChange();

    const removedId = visualJobs[index].id;

    setVisualJobs((currentJobs) =>
      currentJobs
        .filter((_, jobIndex) => jobIndex !== index)
        .map((job) => ({
          ...job,
          dependenciesText: job.dependenciesText
            .split(',')
            .map((dependency) => dependency.trim())
            .filter((dependency) => dependency !== removedId)
            .join(', ')
        }))
    );
  }

  function switchInputMode() {
    handleConfigurationChange();

    if (inputMode === 'visual') {
      try {
        const jobs = getVisualJobs();

        setJobsText(JSON.stringify(jobs, null, 2));
        setInputMode('json');
      } catch (err) {
        setError(err.message);
      }

      return;
    }

    try {
      const parsedJobs = JSON.parse(jobsText);

      if (!Array.isArray(parsedJobs)) {
        throw new Error('Jobs must be a JSON array.');
      }

      setVisualJobs(
        parsedJobs.map((job) => ({
          id: String(job.id ?? ''),
          duration: job.duration ?? 1,
          dependenciesText: Array.isArray(job.dependencies)
            ? job.dependencies.join(', ')
            : ''
        }))
      );

      setInputMode('visual');
    } catch (err) {
      setError(
        `Cannot switch to Visual Builder: ${err.message}`
      );
    }
  }

  async function runSimulation(event) {
    event.preventDefault();

    if (simulationInProgress.current) {
      showNotice(
        'Simulation is already running. Please wait!'
      );
      return;
    }

    if (comparisonInProgress.current) {
      showNotice(
        'Policy comparison is already running. Please wait!'
      );
      return;
    }

    setError('');

    let jobs;

    try {
      jobs = getJobsForRequest();
    } catch (err) {
      setError(
        inputMode === 'json'
          ? `Invalid jobs JSON: ${err.message}`
          : err.message
      );
      return;
    }

    const simulationSignature = JSON.stringify({
      jobs,
      workerCount: Number(workerCount),
      policy
    });

    // Same configuration was already simulated successfully.
    // Show the reminder instead of submitting a duplicate request.
    if (
      completedSimulationSignature.current ===
      simulationSignature
    ) {
      setShowCloseReminder(true);
      return;
    }

    clearCurrentResults();

    simulationInProgress.current = true;
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
        throw new Error(
          data.error || 'Simulation failed.'
        );
      }

      setResult(data);
      setResultsView('simulation');

      // Store the successful configuration for duplicate-click detection.
      completedSimulationSignature.current =
        simulationSignature;
    } catch (err) {
      setError(err.message);
    } finally {
      simulationInProgress.current = false;
      setLoading(false);
    }
  }

  async function comparePolicies() {
    if (comparisonInProgress.current) {
      showNotice(
        'Policy comparison is already running. Please wait!'
      );
      return;
    }

    if (simulationInProgress.current) {
      showNotice(
        'Simulation is already running. Please wait!'
      );
      return;
    }

    setError('');

    let jobs;

    try {
      jobs = getJobsForRequest();
    } catch (err) {
      setError(
        inputMode === 'json'
          ? `Invalid jobs JSON: ${err.message}`
          : err.message
      );
      return;
    }

    const comparisonSignature = JSON.stringify({
      jobs,
      workerCount: Number(workerCount),
      policy
    });

    // Same configuration was already compared successfully.
    if (
      completedComparisonSignature.current ===
      comparisonSignature
    ) {
      setShowCloseReminder(true);
      return;
    }

    clearCurrentResults();

    comparisonInProgress.current = true;
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
        throw new Error(
          data.error || 'Comparison failed.'
        );
      }

      setCompareResult(data);
      setResultsView('comparison');

      completedComparisonSignature.current =
        comparisonSignature;
    } catch (err) {
      setError(err.message);
    } finally {
      comparisonInProgress.current = false;
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
        throw new Error(
          data.error || 'Could not load history.'
        );
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
    if (
      simulationInProgress.current ||
      comparisonInProgress.current
    ) {
      showNotice(
        'Please wait until the current operation finishes before starting a new simulation.'
      );
      return;
    }

    resetSimulationForm();
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

          <a
            href="#simulation"
            onClick={openSimulation}
          >
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
            <h1>
              {showHistory
                ? 'Simulation History'
                : 'Dashboard'}
            </h1>

            <p>
              {showHistory
                ? 'View your previous pipeline simulations.'
                : 'Monitor and optimize your CI pipelines.'}
            </p>
          </div>

          {!showHistory && !showForm && (
            <button onClick={openSimulation}>
              + New Simulation
            </button>
          )}

          {showHistory && (
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
            >
              {historyLoading
                ? 'Refreshing...'
                : 'Refresh History'}
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
                <p>
                  {policy === 'CRITICAL_PATH'
                    ? 'Critical Path'
                    : policy}
                </p>
              </div>
            </section>
          </>
        )}

        {showForm && !showHistory && (
          <section
            className="content-card simulation-form"
            id="simulation"
          >
            <h2>Configure Simulation</h2>

            <form onSubmit={runSimulation}>
              <div className="input-mode-header">
                <div>
                  <h3>Pipeline Jobs</h3>
                  <p>
                    Add jobs and define how they depend on each other.
                  </p>
                </div>

                <button
                  type="button"
                  className="mode-switch"
                  onClick={switchInputMode}
                >
                  {inputMode === 'visual'
                    ? 'Switch to JSON Editor'
                    : 'Switch to Visual Builder'}
                </button>
              </div>

              {inputMode === 'visual' ? (
                <div className="job-builder">
                  {visualJobs.map((job, index) => (
                    <div
                      className="job-card"
                      key={`${job.id}-${index}`}
                    >
                      <div className="job-card-header">
                        <h4>Job {job.id || index + 1}</h4>

                        <button
                          type="button"
                          className="remove-job-button"
                          onClick={() => removeJob(index)}
                          disabled={visualJobs.length === 1}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="job-fields">
                        <div className="field-group">
                          <label>Job ID</label>

                          <input
                            type="text"
                            value={job.id}
                            placeholder="e.g. A"
                            onChange={(event) =>
                              updateJob(
                                index,
                                'id',
                                event.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="field-group">
                          <label>Duration</label>

                          <input
                            type="number"
                            min="1"
                            value={job.duration}
                            onChange={(event) =>
                              updateJob(
                                index,
                                'duration',
                                event.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="field-group dependency-field">
                          <label>Dependencies</label>

                          <input
                            type="text"
                            value={job.dependenciesText}
                            placeholder="e.g. A, B (leave blank if none)"
                            onChange={(event) =>
                              updateJob(
                                index,
                                'dependenciesText',
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-job-button"
                    onClick={addJob}
                  >
                    + Add Another Job
                  </button>

                  <p className="builder-hint">
                    Tip: Enter dependency Job IDs separated by commas.
                    For example, if Job C depends on A and B, enter A, B.
                  </p>
                </div>
              ) : (
                <div className="json-editor">
                  <label>Jobs (JSON format)</label>

                  <textarea
                    value={jobsText}
                    onChange={(event) => {
                      handleConfigurationChange();
                      setJobsText(event.target.value);
                    }}
                    rows={12}
                    spellCheck="false"
                  />

                  <p className="builder-hint">
                    Advanced mode: edit the job array directly.
                  </p>
                </div>
              )}

              <label>Number of workers</label>

              <input
                type="number"
                min="1"
                value={workerCount}
                onChange={(event) => {
                  handleConfigurationChange();
                  setWorkerCount(event.target.value);
                }}
                required
              />

              <label>Scheduling policy</label>

              <div
                className="policy-selector"
                role="group"
                aria-label="Scheduling policy"
              >
                {[
                  { value: 'FIFO', label: 'FIFO' },
                  { value: 'SJF', label: 'SJF' },
                  {
                    value: 'CRITICAL_PATH',
                    label: 'Critical Path'
                  }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`policy-option ${
                      policy === option.value ? 'selected' : ''
                    }`}
                    aria-pressed={policy === option.value}
                    onClick={() => {
                      handleConfigurationChange();
                      setPolicy(option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="action-buttons">
                <button
                  type="submit"
                  aria-busy={loading}
                >
                  {loading ? 'Running...' : 'Run Simulation'}
                </button>

                <button
                  type="button"
                  onClick={comparePolicies}
                  aria-busy={compareLoading}
                >
                  {compareLoading
                    ? 'Comparing...'
                    : 'Compare All Policies'}
                </button>
              </div>
            </form>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            {notice && (
              <p className="status-message" role="status">
                {notice}
              </p>
            )}

            {showCloseReminder && (
              <div className="form-footer-actions">
                <p>
                  Finished configuring this pipeline? Close the form
                  to start fresh next time.
                </p>

                <button
                  type="button"
                  className="close-form-button"
                  onClick={closeSimulationForm}
                  disabled={loading || compareLoading}
                >
                  Close Form &amp; Reset
                </button>
              </div>
            )}
          </section>
        )}

        {!showHistory && result && compareResult && (
          <div
            className="combined-results-switcher"
            role="tablist"
            aria-label="Result views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={resultsView === 'simulation'}
              className={
                resultsView === 'simulation' ? 'active' : ''
              }
              onClick={() => setResultsView('simulation')}
            >
              Simulation Results
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={resultsView === 'comparison'}
              className={
                resultsView === 'comparison' ? 'active' : ''
              }
              onClick={() => setResultsView('comparison')}
            >
              Policy Comparison
            </button>
          </div>
        )}

        {result &&
          !showHistory &&
          (!compareResult || resultsView === 'simulation') && (
            <section className="content-card results results-panel">
              <div className="results-heading">
                <div>
                  <span className="section-kicker">
                    SIMULATION COMPLETE
                  </span>
                  <h2>Simulation Results</h2>
                  <p>
                    Your pipeline execution has been scheduled successfully.
                  </p>
                </div>

                <span className="result-policy">
                  {policy === 'CRITICAL_PATH'
                    ? 'CRITICAL PATH'
                    : policy}{' '}
                  POLICY
                </span>
              </div>

              <div className="stats results-metrics">
                <div className="stat-card result-metric metric-makespan">
                  <span className="metric-label">
                    TOTAL EXECUTION TIME
                  </span>
                  <h3>Makespan</h3>
                  <p>
                    {result.makespan}
                    <span> units</span>
                  </p>
                  <small>
                    Time taken to complete the pipeline
                  </small>
                </div>

                <div className="stat-card result-metric metric-utilization">
                  <span className="metric-label">
                    RESOURCE EFFICIENCY
                  </span>
                  <h3>Worker Utilization</h3>
                  <p>
                    {result.workerUtilization}
                    <span>%</span>
                  </p>

                  <div className="utilization-track">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            Number(result.workerUtilization) || 0
                          )
                        )}%`
                      }}
                    />
                  </div>

                  <small>
                    Percentage of available worker time used
                  </small>
                </div>

                <div className="stat-card result-metric metric-waiting">
                  <span className="metric-label">
                    QUEUE PERFORMANCE
                  </span>
                  <h3>Total Waiting Time</h3>
                  <p>
                    {result.totalQueueWaitingTime}
                    <span> units</span>
                  </p>
                  <small>
                    Combined time jobs spent waiting
                  </small>
                </div>
              </div>

              <div className="section-heading schedule-heading">
                <div>
                  <span className="section-kicker">
                    JOB-BY-JOB BREAKDOWN
                  </span>
                  <h3>Execution Schedule</h3>
                </div>

                <span className="schedule-count">
                  {result.schedule?.length ?? 0} jobs scheduled
                </span>
              </div>

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
                        <td>
                          <span className="job-id-pill">
                            {job.jobId}
                          </span>
                        </td>
                        <td>
                          <span className="worker-pill">
                            Worker {job.workerId}
                          </span>
                        </td>
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

        {compareResult &&
          !showHistory &&
          (!result || resultsView === 'comparison') &&
          (() => {
            const bestMakespan = Math.min(
              ...compareResult.comparisons.map(
                (item) => Number(item.makespan)
              )
            );

            const bestPolicies = compareResult.comparisons.filter(
              (item) => Number(item.makespan) === bestMakespan
            );

            const bestTimeline = bestPolicies.find(
              (item) =>
                Array.isArray(item.schedule) &&
                item.schedule.length > 0
            );

            return (
              <section className="content-card results results-panel">
                <div className="results-heading">
                  <div>
                    <span className="section-kicker">
                      SCHEDULING ANALYSIS
                    </span>
                    <h2>Policy Comparison Results</h2>
                    <p>
                      Compare how each scheduling strategy handles
                      the same pipeline.
                    </p>
                  </div>
                </div>

                <div className="stats results-metrics comparison-metrics">
                  <div className="stat-card result-metric">
                    <h3>Best Makespan</h3>
                    <p>{compareResult.bestMakespan}</p>
                    <small>Lowest total execution time</small>
                  </div>

                  <div className="stat-card result-metric">
                    <h3>Best Policy</h3>
                    <p className="policy-name-value">
                      {compareResult.bestPolicies
                        .map((name) =>
                          name === 'CRITICAL_PATH'
                            ? 'Critical Path'
                            : name
                        )
                        .join(', ')}
                    </p>
                    <small>
                      Includes all policies tied for best
                    </small>
                  </div>

                  <div className="stat-card result-metric">
                    <h3>Policies Compared</h3>
                    <p>{compareResult.comparisons.length}</p>
                    <small>
                      Scheduling strategies benchmarked
                    </small>
                  </div>
                </div>

                <div
                  className="comparison-tabs"
                  role="tablist"
                  aria-label="Comparison views"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={comparisonView === 'table'}
                    className={
                      comparisonView === 'table' ? 'active' : ''
                    }
                    onClick={() => setComparisonView('table')}
                  >
                    Policy Comparison
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={comparisonView === 'timeline'}
                    className={
                      comparisonView === 'timeline' ? 'active' : ''
                    }
                    onClick={() => setComparisonView('timeline')}
                  >
                    Best Policy Timeline
                  </button>
                </div>

                {comparisonView === 'table' ? (
                  <>
                    <div className="section-heading schedule-heading">
                      <div>
                        <span className="section-kicker">
                          POLICY BENCHMARK
                        </span>
                        <h3>Performance Comparison</h3>
                      </div>

                      <span className="best-result-note">
                        BEST MAKESPAN HIGHLIGHTED
                      </span>
                    </div>

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
                          {compareResult.comparisons.map((item) => {
                            const isBest =
                              Number(item.makespan) === bestMakespan;

                            const displayPolicy =
                              item.policy === 'CRITICAL_PATH'
                                ? 'Critical Path'
                                : item.policy;

                            return (
                              <tr
                                key={item.policy}
                                className={
                                  isBest ? 'best-policy-row' : ''
                                }
                              >
                                <td>
                                  <span className="comparison-policy-name">
                                    {displayPolicy}
                                  </span>

                                  {isBest && (
                                    <span className="best-policy-badge">
                                      BEST
                                    </span>
                                  )}
                                </td>

                                <td
                                  className={
                                    isBest ? 'best-metric-value' : ''
                                  }
                                >
                                  {item.makespan}
                                </td>

                                <td>
                                  {item.workerUtilization}%
                                </td>
                                <td>
                                  {item.totalQueueWaitingTime}
                                </td>
                                <td>
                                  {item.averageQueueWaitingTime}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : bestTimeline ? (
                  <div className="comparison-timeline-view">
                    <div className="section-heading schedule-heading">
                      <div>
                        <span className="section-kicker">
                          BEST PERFORMING SCHEDULE
                        </span>
                        <h3>
                          {bestTimeline.policy === 'CRITICAL_PATH'
                            ? 'Critical Path'
                            : bestTimeline.policy}{' '}
                          Timeline
                        </h3>
                      </div>

                      <span className="best-policy-badge">
                        BEST · {bestTimeline.makespan} UNITS
                      </span>
                    </div>

                    <Timeline
                      schedule={bestTimeline.schedule}
                      workerCount={workerCount}
                      makespan={bestTimeline.makespan}
                    />
                  </div>
                ) : (
                  <div className="timeline-unavailable">
                    <h3>
                      Timeline data is not available for this comparison
                    </h3>
                    <p>
                      The comparison endpoint returned performance
                      metrics without individual job schedules.
                      Run a single simulation to view its Gantt timeline.
                    </p>
                  </div>
                )}
              </section>
            );
          })()}

        {showHistory && (
          <section className="content-card results" id="history">
            <h2>Previous Simulations</h2>

            {historyLoading && (
              <p>Loading simulation history...</p>
            )}

            {historyError && (
              <p className="error-message">{historyError}</p>
            )}

            {!historyLoading &&
              !historyError &&
              history.length === 0 && (
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
                      const storedResult = item.result || item;

                      const comparisons = Array.isArray(
                        storedResult.comparisons
                      )
                        ? storedResult.comparisons
                        : [];

                      const isComparison =
                        item.policy === 'COMPARISON' ||
                        comparisons.length > 0;

                      const bestComparison = comparisons.reduce(
                        (best, current) => {
                          if (!best) return current;

                          return Number(current.makespan) <
                            Number(best.makespan)
                            ? current
                            : best;
                        },
                        null
                      );

                      const metrics = isComparison
                        ? bestComparison || {}
                        : storedResult;

                      const makespan = isComparison
                        ? storedResult.bestMakespan ??
                          bestComparison?.makespan
                        : metrics.makespan;

                      return (
                        <tr key={item._id}>
                          <td>
                            {item.createdAt
                              ? new Date(
                                  item.createdAt
                                ).toLocaleString()
                              : '—'}
                          </td>

                          <td>{item.policy || '—'}</td>
                          <td>{item.workerCount ?? '—'}</td>
                          <td>{makespan ?? '—'}</td>

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