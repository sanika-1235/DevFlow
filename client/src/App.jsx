
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
  const [criticalPathResult, setCriticalPathResult] = useState(null);
  const [workerAnalysisResult, setWorkerAnalysisResult] = useState(null);
  const [policyRecommendation, setPolicyRecommendation] = useState(null);
  const [historicalPrediction, setHistoricalPrediction] = useState(null);

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
  const [criticalPathLoading, setCriticalPathLoading] = useState(false);
  const [workerAnalysisLoading, setWorkerAnalysisLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const simulationInProgress = useRef(false);
  const comparisonInProgress = useRef(false);
  const criticalPathInProgress = useRef(false);
  const workerAnalysisInProgress = useRef(false);
  const recommendationInProgress = useRef(false);
  const predictionInProgress = useRef(false);

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
    setCriticalPathResult(null);
    setWorkerAnalysisResult(null);
    setPolicyRecommendation(null);
    setHistoricalPrediction(null);
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
      comparisonInProgress.current ||
      criticalPathInProgress.current ||
      workerAnalysisInProgress.current ||
      recommendationInProgress.current ||
      predictionInProgress.current
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

    if (
      criticalPathInProgress.current ||
      workerAnalysisInProgress.current ||
      recommendationInProgress.current ||
      predictionInProgress.current
    ) {
      showNotice(
        'Another analysis is already running. Please wait!'
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

    if (
      criticalPathInProgress.current ||
      workerAnalysisInProgress.current ||
      recommendationInProgress.current ||
      predictionInProgress.current
    ) {
      showNotice(
        'Another analysis is already running. Please wait!'
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

  async function analyzeCriticalPath() {
    if (criticalPathInProgress.current) {
      showNotice(
        'Critical Path Analysis is already running. Please wait!'
      );
      return;
    }

    if (
      simulationInProgress.current ||
      comparisonInProgress.current ||
      workerAnalysisInProgress.current ||
      recommendationInProgress.current ||
      predictionInProgress.current
    ) {
      showNotice(
        'Please wait until the current operation finishes before analyzing the Critical Path.'
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

    criticalPathInProgress.current = true;
    setCriticalPathLoading(true);

    try {
      const response = await fetch('/api/critical-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobs })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Critical Path Analysis failed.'
        );
      }

      setCriticalPathResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      criticalPathInProgress.current = false;
      setCriticalPathLoading(false);
    }
  }

  // Compare the same pipeline using different worker counts.
  async function analyzeWorkerCounts() {
    if (workerAnalysisInProgress.current) {
      showNotice('Worker analysis is already running. Please wait!');
      return;
    }

    if (
      simulationInProgress.current ||
      comparisonInProgress.current ||
      criticalPathInProgress.current ||
      recommendationInProgress.current ||
      predictionInProgress.current
    ) {
      showNotice(
        'Please wait until the current operation finishes before analyzing worker counts.'
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

    workerAnalysisInProgress.current = true;
    setWorkerAnalysisLoading(true);

    try {
      const response = await fetch('/api/worker-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobs,
          workerCounts: [1, 2, 3, 4, 5],
          policy
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Worker analysis failed.');
      }

      setWorkerAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      workerAnalysisInProgress.current = false;
      setWorkerAnalysisLoading(false);
    }
  }

  // Evaluate all scheduling policies and request an automatic recommendation.
  async function recommendPolicy() {
    if (recommendationInProgress.current) {
      showNotice('Policy recommendation is already running. Please wait!');
      return;
    }

    if (
      simulationInProgress.current ||
      comparisonInProgress.current ||
      criticalPathInProgress.current ||
      workerAnalysisInProgress.current ||
      predictionInProgress.current
    ) {
      showNotice(
        'Please wait until the current operation finishes before requesting a recommendation.'
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

    recommendationInProgress.current = true;
    setRecommendationLoading(true);

    try {
      const response = await fetch('/api/recommend-policy', {
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
        throw new Error(data.error || 'Policy recommendation failed.');
      }

      setPolicyRecommendation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      recommendationInProgress.current = false;
      setRecommendationLoading(false);
    }
  }

  // Predict execution time using similar historical simulations.
  async function predictExecutionTime() {
    if (predictionInProgress.current) {
      showNotice('Execution-time prediction is already running. Please wait!');
      return;
    }

    if (
      simulationInProgress.current ||
      comparisonInProgress.current ||
      criticalPathInProgress.current ||
      workerAnalysisInProgress.current ||
      recommendationInProgress.current
    ) {
      showNotice(
        'Please wait until the current operation finishes before requesting a prediction.'
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

    predictionInProgress.current = true;
    setPredictionLoading(true);
    setHistoricalPrediction(null);

    try {
      const response = await fetch('/api/predict-makespan', {
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
          data.error || 'Execution-time prediction failed.'
        );
      }

      setHistoricalPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      predictionInProgress.current = false;
      setPredictionLoading(false);
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
      comparisonInProgress.current ||
      criticalPathInProgress.current ||
      workerAnalysisInProgress.current ||
      recommendationInProgress.current ||
      predictionInProgress.current
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

                        <div className="field-group">
                          <label>Dependencies</label>

                          <input
                            type="text"
                            value={job.dependenciesText}
                            placeholder="e.g. A, B"
                            onChange={(event) =>
                              updateJob(
                                index,
                                'dependenciesText',
                                event.target.value
                              )
                            }
                          />

                          <small>
                            Enter job IDs separated by commas.
                          </small>
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
                </div>
              ) : (
                <div className="field-group">
                  <label htmlFor="jobs-json">Jobs JSON</label>

                  <textarea
                    id="jobs-json"
                    value={jobsText}
                    onChange={(event) => {
                      handleConfigurationChange();
                      setJobsText(event.target.value);
                    }}
                    rows={10}
                    spellCheck="false"
                  />
                </div>
              )}

              <div className="field-group worker-field">
                <label htmlFor="worker-count">Number of Workers</label>

                <input
                  id="worker-count"
                  type="number"
                  min="1"
                  max="20"
                  value={workerCount}
                  onChange={(event) => {
                    handleConfigurationChange();
                    setWorkerCount(Number(event.target.value));
                  }}
                  required
                />
              </div>

              <div className="field-group">
                <label>Scheduling Policy</label>

                <div className="policy-options">
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

                <button
                  type="button"
                  onClick={analyzeCriticalPath}
                  aria-busy={criticalPathLoading}
                  disabled={criticalPathLoading}
                >
                  {criticalPathLoading
                    ? 'Analyzing...'
                    : 'Analyze Critical Path'}
                </button>

                <button
                  type="button"
                  onClick={recommendPolicy}
                  aria-busy={recommendationLoading}
                  disabled={recommendationLoading}
                >
                  {recommendationLoading
                    ? 'Finding Best Policy...'
                    : 'Recommend Best Policy'}
                </button>

                <button
                  type="button"
                  onClick={analyzeWorkerCounts}
                  aria-busy={workerAnalysisLoading}
                  disabled={workerAnalysisLoading}
                >
                  {workerAnalysisLoading
                    ? 'Analyzing Workers...'
                    : 'Analyze Worker Counts'}
                </button>

                <button
                  type="button"
                  onClick={predictExecutionTime}
                  aria-busy={predictionLoading}
                  disabled={predictionLoading}
                >
                  {predictionLoading
                    ? 'Predicting...'
                    : 'Predict Execution Time'}
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
                  onClick={closeSimulationForm}
                >
                  Close Form & Reset
                </button>
              </div>
            )}

            <div className="form-footer-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeSimulationForm}
              >
                Close Form & Reset
              </button>
            </div>
          </section>
        )}

        {historicalPrediction && !showHistory && (
          <section className="content-card results results-panel">
            <div className="results-heading">
              <div>
                <span className="section-kicker">
                  HISTORICAL PERFORMANCE ANALYSIS
                </span>
                <h2>Execution-Time Prediction</h2>
                <p>
                  Estimate pipeline completion time using similar
                  historical executions.
                </p>
              </div>

              <span className="result-policy">
                {historicalPrediction.confidence?.replace('_', ' ')}
              </span>
            </div>

            {historicalPrediction.predictionAvailable ? (
              <>
                <div className="stats results-metrics">
                  <div className="stat-card result-metric metric-makespan">
                    <span className="metric-label">
                      PREDICTED EXECUTION TIME
                    </span>
                    <h3>Predicted Makespan</h3>
                    <p>
                      {historicalPrediction.predictedMakespan}
                      <span> units</span>
                    </p>
                    <small>
                      Estimated completion time from historical runs
                    </small>
                  </div>

                  <div className="stat-card result-metric metric-utilization">
                    <span className="metric-label">
                      PREDICTION CONFIDENCE
                    </span>
                    <h3>Confidence Level</h3>
                    <p>{historicalPrediction.confidence}</p>
                    <small>
                      Based on the number and similarity of matching records
                    </small>
                  </div>

                  <div className="stat-card result-metric metric-waiting">
                    <span className="metric-label">
                      HISTORICAL MATCHES
                    </span>
                    <h3>Matching Executions</h3>
                    <p>{historicalPrediction.matchedRecords}</p>
                    <small>
                      Similar past executions used for this estimate
                    </small>
                  </div>
                </div>

                <div className="stats results-metrics">
                  <div className="stat-card result-metric">
                    <span className="metric-label">
                      AVERAGE SIMILARITY
                    </span>
                    <h3>Pipeline Similarity</h3>
                    <p>
                      {historicalPrediction.averageSimilarity}
                      <span>%</span>
                    </p>
                    <small>
                      Average similarity of selected historical records
                    </small>
                  </div>

                  <div className="stat-card result-metric">
                    <span className="metric-label">
                      SCHEDULING POLICY
                    </span>
                    <h3>Policy Used</h3>
                    <p>
                      {historicalPrediction.policy === 'CRITICAL_PATH'
                        ? 'Critical Path'
                        : historicalPrediction.policy}
                    </p>
                    <small>
                      Historical records use the same scheduling policy
                    </small>
                  </div>

                  <div className="stat-card result-metric">
                    <span className="metric-label">
                      WORKER CONFIGURATION
                    </span>
                    <h3>Workers Used</h3>
                    <p>{historicalPrediction.workerCount}</p>
                    <small>
                      Historical records use the same worker count
                    </small>
                  </div>
                </div>

                <div className="section-heading schedule-heading">
                  <div>
                    <span className="section-kicker">
                      HISTORICAL DATA
                    </span>
                    <h3>Matching Execution Records</h3>
                  </div>

                  <span className="schedule-count">
                    {historicalPrediction.matches?.length ?? 0} records
                  </span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Record</th>
                        <th>Historical Makespan</th>
                        <th>Similarity</th>
                        <th>Execution Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {historicalPrediction.matches?.map((match, index) => (
                        <tr key={`${match.createdAt ?? 'record'}-${index}`}>
                          <td>Execution {index + 1}</td>
                          <td>{match.makespan} units</td>
                          <td>
                            {(match.similarity * 100).toFixed(2)}%
                          </td>
                          <td>
                            {match.createdAt
                              ? new Date(match.createdAt).toLocaleString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="builder-hint" style={{ marginTop: '20px' }}>
                  <strong>How was this predicted?</strong>{' '}
                  {historicalPrediction.reason} The prediction is a
                  similarity-weighted estimate based on historical
                  executions, not a guarantee of future execution time.
                </p>
              </>
            ) : (
              <div style={{ marginTop: '20px' }}>
                <h3>Not enough historical data yet</h3>
                <p className="builder-hint">
                  {historicalPrediction.reason}
                </p>
                <p className="builder-hint">
                  Run more simulations using this scheduling policy and
                  worker count. As DevFlow collects similar executions,
                  it can generate more useful estimates.
                </p>
              </div>
            )}
          </section>
        )}

        {policyRecommendation && !showHistory && (
          <section className="content-card results results-panel">
            <div className="results-heading">
              <div>
                <span className="section-kicker">
                  INTELLIGENT OPTIMIZATION
                </span>
                <h2>Scheduling Policy Recommendation</h2>
                <p>
                  All three scheduling policies were evaluated using
                  the same pipeline and worker count.
                </p>
              </div>

              <span className="result-policy">POLICY ADVISOR</span>
            </div>

            <div className="stats results-metrics">
              <div className="stat-card result-metric metric-makespan">
                <span className="metric-label">RECOMMENDED POLICY</span>
                <h3>
                  {policyRecommendation.recommendation.policy === 'CRITICAL_PATH'
                    ? 'Critical Path'
                    : policyRecommendation.recommendation.policy}
                </h3>
                <p>
                  {policyRecommendation.recommendation.makespan}
                  <span> units</span>
                </p>
                <small>Best completion time for this workload</small>
              </div>

              <div className="stat-card result-metric metric-utilization">
                <span className="metric-label">WORKER UTILIZATION</span>
                <h3>Resource Efficiency</h3>
                <p>
                  {policyRecommendation.recommendation.workerUtilization}
                  <span>%</span>
                </p>
                <small>Utilization under the recommended policy</small>
              </div>

              <div className="stat-card result-metric metric-waiting">
                <span className="metric-label">TOTAL QUEUE WAITING</span>
                <h3>Waiting Time</h3>
                <p>
                  {policyRecommendation.recommendation.totalQueueWaitingTime}
                  <span> units</span>
                </p>
                <small>Combined time jobs spent waiting</small>
              </div>
            </div>

            <div className="section-heading schedule-heading">
              <div>
                <span className="section-kicker">
                  PERFORMANCE BENCHMARK
                </span>
                <h3>Scheduling Policy Comparison</h3>
              </div>

              <span className="schedule-count">
                {workerCount} workers tested
              </span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Makespan</th>
                    <th>Utilization</th>
                    <th>Total Waiting</th>
                    <th>Average Waiting</th>
                    <th>Result</th>
                  </tr>
                </thead>

                <tbody>
                  {policyRecommendation.comparisons.map((item) => {
                    const recommended =
                      item.policy ===
                      policyRecommendation.recommendation.policy;

                    return (
                      <tr
                        key={item.policy}
                        className={
                          recommended ? 'best-policy-row' : ''
                        }
                      >
                        <td>
                          {item.policy === 'CRITICAL_PATH'
                            ? 'Critical Path'
                            : item.policy}
                        </td>

                        <td
                          className={
                            item.makespan ===
                            policyRecommendation.bestMakespan
                              ? 'best-metric-value'
                              : ''
                          }
                        >
                          {item.makespan}
                        </td>

                        <td>{item.workerUtilization}%</td>
                        <td>{item.totalQueueWaitingTime}</td>
                        <td>{item.averageQueueWaitingTime}</td>

                        <td>
                          {recommended ? (
                            <span className="best-policy-badge">
                              RECOMMENDED
                            </span>
                          ) : item.makespan ===
                            policyRecommendation.bestMakespan ? (
                            <span className="worker-pill">TIED</span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="builder-hint" style={{ marginTop: '20px' }}>
              <strong>Why this policy?</strong>{' '}
              {policyRecommendation.reason} The recommendation
              prioritizes the lowest makespan, then the lowest total
              queue waiting time. If both metrics tie, the predefined
              policy order provides a consistent tie-break.
            </p>

            {policyRecommendation.bestPolicies.length > 1 && (
              <p className="builder-hint">
                Policies tied for the best makespan:{' '}
                {policyRecommendation.bestPolicies
                  .map((item) =>
                    item === 'CRITICAL_PATH' ? 'Critical Path' : item
                  )
                  .join(', ')}.
              </p>
            )}
          </section>
        )}

        {criticalPathResult && !showHistory && (
          <section className="content-card results results-panel">
            <div className="results-heading">
              <div>
                <span className="section-kicker">
                  DEPENDENCY ANALYSIS
                </span>
                <h2>Critical Path Method</h2>
                <p>
                  Identify the longest dependency path and available
                  scheduling slack.
                </p>
              </div>

              <span className="result-policy">CPM ANALYSIS</span>
            </div>

            <div className="stats results-metrics">
              <div className="stat-card result-metric metric-makespan">
                <span className="metric-label">PROJECT DURATION</span>
                <h3>Critical Path Duration</h3>
                <p>
                  {criticalPathResult.projectDuration}
                  <span> units</span>
                </p>
                <small>
                  Minimum dependency-based completion duration
                </small>
              </div>

              <div className="stat-card result-metric">
                <span className="metric-label">CRITICAL JOBS</span>
                <h3>Critical Path Jobs</h3>
                <p>
                  {criticalPathResult.criticalJobs.length}
                </p>
                <small>
                  {criticalPathResult.criticalJobs.join(', ')}
                </small>
              </div>

              <div className="stat-card result-metric">
                <span className="metric-label">PIPELINE BREAKDOWN</span>
                <h3>Jobs Analyzed</h3>
                <p>{criticalPathResult.jobAnalysis.length}</p>
                <small>
                  Every job evaluated using forward and backward passes
                </small>
              </div>
            </div>

            <div className="section-heading schedule-heading">
              <div>
                <span className="section-kicker">
                  CPM JOB BREAKDOWN
                </span>
                <h3>Critical Path Schedule Analysis</h3>
              </div>

              <span className="schedule-count">
                {criticalPathResult.criticalJobs.length} critical jobs
              </span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Duration</th>
                    <th>ES</th>
                    <th>EF</th>
                    <th>LS</th>
                    <th>LF</th>
                    <th>Slack</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {criticalPathResult.jobAnalysis.map((job) => (
                    <tr
                      key={job.jobId}
                      className={
                        job.isCritical ? 'best-policy-row' : ''
                      }
                    >
                      <td>
                        <span className="job-id-pill">
                          {job.jobId}
                        </span>
                      </td>
                      <td>{job.duration}</td>
                      <td>{job.earliestStart}</td>
                      <td>{job.earliestFinish}</td>
                      <td>{job.latestStart}</td>
                      <td>{job.latestFinish}</td>
                      <td>{job.slack}</td>
                      <td>
                        {job.isCritical ? (
                          <span className="best-policy-badge">
                            CRITICAL
                          </span>
                        ) : (
                          <span className="worker-pill">
                            NON-CRITICAL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="builder-hint">
              ES: Earliest Start · EF: Earliest Finish · LS: Latest Start ·
              LF: Latest Finish. Slack is the time a job can be delayed
              without delaying the dependency-based project completion.
            </p>

            <p className="builder-hint">
              Note: CPM calculates the minimum duration based on job
              dependencies, assuming unlimited workers. The actual
              simulation makespan can be longer when worker capacity is
              limited.
            </p>
          </section>
        )}

        {workerAnalysisResult && !showHistory && (
          <section className="content-card results results-panel">
            <div className="results-heading">
              <div>
                <span className="section-kicker">
                  RESOURCE OPTIMIZATION
                </span>
                <h2>What-if Worker Analysis</h2>
                <p>
                  Compare the same pipeline using different worker counts
                  with the {workerAnalysisResult.policy} scheduling policy.
                </p>
              </div>

              <span className="result-policy">WORKER ANALYSIS</span>
            </div>

            <div className="stats results-metrics">
              <div className="stat-card result-metric metric-makespan">
                <span className="metric-label">BEST MAKESPAN</span>
                <h3>Minimum Execution Time</h3>
                <p>
                  {workerAnalysisResult.bestMakespan}
                  <span> units</span>
                </p>
                <small>Fastest completion time across tested configurations</small>
              </div>

              <div className="stat-card result-metric">
                <span className="metric-label">RECOMMENDED CONFIGURATION</span>
                <h3>Worker Count</h3>
                <p>{workerAnalysisResult.recommendedWorkerCount}</p>
                <small>
                  Fewest workers needed to achieve the best makespan
                </small>
              </div>

              <div className="stat-card result-metric">
                <span className="metric-label">CONFIGURATIONS TESTED</span>
                <h3>Worker Setups</h3>
                <p>{workerAnalysisResult.results.length}</p>
                <small>Worker counts from 1 through 5</small>
              </div>
            </div>

            <div className="section-heading schedule-heading">
              <div>
                <span className="section-kicker">PERFORMANCE BENCHMARK</span>
                <h3>Worker Count Comparison</h3>
              </div>
              <span className="schedule-count">
                {workerAnalysisResult.policy} policy
              </span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Workers</th>
                    <th>Makespan</th>
                    <th>Utilization</th>
                    <th>Total Waiting</th>
                    <th>Average Waiting</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>

                <tbody>
                  {workerAnalysisResult.results.map((item) => {
                    const recommended =
                      item.workerCount ===
                      workerAnalysisResult.recommendedWorkerCount;

                    return (
                      <tr
                        key={item.workerCount}
                        className={
                          recommended ? 'best-policy-row' : ''
                        }
                      >
                        <td>
                          {item.workerCount}{' '}
                          {item.workerCount === 1 ? 'worker' : 'workers'}
                        </td>

                        <td
                          className={
                            item.makespan === workerAnalysisResult.bestMakespan
                              ? 'best-metric-value'
                              : ''
                          }
                        >
                          {item.makespan}
                        </td>

                        <td>{item.workerUtilization}%</td>
                        <td>{item.totalQueueWaitingTime}</td>
                        <td>{item.averageQueueWaitingTime}</td>

                        <td>
                          {recommended ? (
                            <span className="best-policy-badge">
                              RECOMMENDED
                            </span>
                          ) : item.makespan === workerAnalysisResult.bestMakespan ? (
                            <span className="worker-pill">
                              Same makespan
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '28px' }}>
              <div className="section-heading">
                <div>
                  <span className="section-kicker">
                    EXECUTION TIME VISUALIZATION
                  </span>
                  <h3>Makespan by Worker Count</h3>
                </div>
              </div>

              {workerAnalysisResult.results.map((item) => {
                const maximumMakespan = Math.max(
                  ...workerAnalysisResult.results.map(
                    (entry) => entry.makespan
                  ),
                  1
                );

                const barWidth = Math.max(
                  3,
                  (item.makespan / maximumMakespan) * 100
                );

                const isRecommended =
                  item.workerCount ===
                  workerAnalysisResult.recommendedWorkerCount;

                return (
                  <div key={item.workerCount}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '7px',
                        color: '#cbd5e1',
                        fontSize: '13px'
                      }}
                    >
                      <span>
                        {item.workerCount}{' '}
                        {item.workerCount === 1 ? 'worker' : 'workers'}
                        {isRecommended ? ' · Recommended' : ''}
                      </span>
                      <span>{item.makespan} units</span>
                    </div>

                    <div
                      style={{
                        height: '12px',
                        background: '#1e293b',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        marginBottom: '16px'
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          background: isRecommended ? '#059669' : '#6366f1',
                          borderRadius: '999px',
                          transition: 'width 250ms ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="builder-hint" style={{ marginTop: '20px' }}>
              Recommendation: {workerAnalysisResult.recommendedWorkerCount}{' '}
              {workerAnalysisResult.recommendedWorkerCount === 1 ? 'worker' : 'workers'}{' '}
              achieve the minimum makespan of{' '}
              {workerAnalysisResult.bestMakespan} time units. Additional
              workers do not reduce completion time for this pipeline and
              scheduling policy. Worker utilization may decrease as more
              workers are added.
            </p>
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
                      POLICY BENCHMARK
                    </span>
                    <h2>Policy Comparison Results</h2>
                    <p>
                      Compare the performance of all scheduling policies
                      on the same pipeline.
                    </p>
                  </div>

                  <span className="result-policy">
                    {compareResult.comparisons.length} POLICIES
                  </span>
                </div>

                <div className="section-heading schedule-heading">
                  <div>
                    <span className="section-kicker">
                      PERFORMANCE BENCHMARK
                    </span>
                    <h3>Scheduling Policy Comparison</h3>
                  </div>

                  <span className="schedule-count">
                    Best makespan: {bestMakespan} units
                  </span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Policy</th>
                        <th>Makespan</th>
                        <th>Utilization</th>
                        <th>Total Waiting</th>
                        <th>Average Waiting</th>
                        <th>Result</th>
                      </tr>
                    </thead>

                    <tbody>
                      {compareResult.comparisons.map((item) => (
                        <tr
                          key={item.policy}
                          className={
                            Number(item.makespan) === bestMakespan
                              ? 'best-policy-row'
                              : ''
                          }
                        >
                          <td>
                            {item.policy === 'CRITICAL_PATH'
                              ? 'Critical Path'
                              : item.policy}
                          </td>
                          <td
                            className={
                              Number(item.makespan) === bestMakespan
                                ? 'best-metric-value'
                                : ''
                            }
                          >
                            {item.makespan}
                          </td>
                          <td>{item.workerUtilization}%</td>
                          <td>{item.totalQueueWaitingTime}</td>
                          <td>{item.averageQueueWaitingTime}</td>
                          <td>
                            {Number(item.makespan) === bestMakespan ? (
                              <span className="best-policy-badge">
                                BEST MAKESPAN
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="builder-hint">
                  Best makespan: {bestMakespan} time units.{' '}
                  {bestPolicies.length > 1
                    ? `The following policies share the best makespan: ${bestPolicies
                        .map((item) =>
                          item.policy === 'CRITICAL_PATH'
                            ? 'Critical Path'
                            : item.policy
                        )
                        .join(', ')}.`
                    : `The best-performing policy is ${bestPolicies[0].policy}.`}
                </p>

                <div className="comparison-view-controls">
                  <button
                    type="button"
                    className={
                      comparisonView === 'table' ? 'active' : ''
                    }
                    onClick={() => setComparisonView('table')}
                  >
                    Table View
                  </button>

                  <button
                    type="button"
                    className={
                      comparisonView === 'timeline' ? 'active' : ''
                    }
                    onClick={() => setComparisonView('timeline')}
                    disabled={!bestTimeline}
                  >
                    Best Policy Timeline
                  </button>
                </div>

                {comparisonView === 'timeline' && bestTimeline && (
                  <Timeline
                    schedule={bestTimeline.schedule}
                    workerCount={workerCount}
                    makespan={bestTimeline.makespan}
                  />
                )}
              </section>
            );
          })()}

        {showHistory && (
          <section className="content-card results-panel">
            <div className="results-heading">
              <div>
                <span className="section-kicker">
                  SAVED EXECUTIONS
                </span>
                <h2>Simulation History</h2>
                <p>
                  Review your recent pipeline simulations and comparisons.
                </p>
              </div>
            </div>

            {historyLoading && <p>Loading history...</p>}

            {historyError && (
              <p className="error-message" role="alert">
                {historyError}
              </p>
            )}

            {!historyLoading && !historyError && history.length === 0 && (
              <p>No saved simulations found.</p>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Jobs</th>
                      <th>Workers</th>
                      <th>Policy</th>
                      <th>Makespan</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item) => (
                      <tr key={item._id}>
                        <td>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : '—'}
                        </td>
                        <td>{item.jobs?.length ?? '—'}</td>
                        <td>{item.workerCount ?? '—'}</td>
                        <td>{item.policy ?? '—'}</td>
                        <td>
                          {item.result?.makespan ??
                            item.result?.bestMakespan ??
                            item.result?.recommendation?.makespan ??
                            '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
