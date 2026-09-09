import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

const API = "http://localhost:5000/api";

const fallbackQuotes = [
  {
    q: "The beautiful thing about learning is that nobody can take it away from you.",
    a: "B. B. King"
  },
  {
    q: "Success is the sum of small efforts, repeated day in and day out.",
    a: "Robert Collier"
  },
  {
    q: "An investment in knowledge pays the best interest.",
    a: "Benjamin Franklin"
  }
];

function Navigation() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? "active" : "";

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">✓</span>
          <span>StudyFlow</span>
        </Link>

        <div className="nav-links">
          <Link className={isActive("/")} to="/">Dashboard</Link>
          <Link className={isActive("/tasks")} to="/tasks">My Tasks</Link>
          <Link className={isActive("/about")} to="/about">About</Link>
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const [quote, setQuote] = useState(fallbackQuotes[0]);
  const [loadingQuote, setLoadingQuote] = useState(true);

  const loadQuote = async () => {
    setLoadingQuote(true);

    try {
      const response = await fetch(API + "/quote");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setQuote(data);
    } catch {
      const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      setQuote(random);
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, []);

  return (
    <main className="container">
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">STUDENT PRODUCTIVITY SYSTEM</span>
          <h1>Organize your work.<br /><span>Focus on progress.</span></h1>
          <p>
            StudyFlow is a simple task management application designed to help
            students plan academic work and stay motivated.
          </p>

          <div className="hero-buttons">
            <Link to="/tasks" className="primary-btn">Manage My Tasks →</Link>
            <Link to="/about" className="secondary-btn">How it works</Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-top">
            <span>Today's Focus</span>
            <span className="pulse">● Active</span>
          </div>

          <div className="focus-number">01</div>
          <h3>Small progress every day.</h3>
          <p>Plan your tasks, track completion, and build consistent study habits.</p>

          <div className="mini-progress">
            <div className="mini-progress-fill"></div>
          </div>
        </div>
      </section>

      <section className="quote-section">
        <div className="section-label">DAILY STUDY MOTIVATION</div>

        <div className="quote-card">
          <div className="quote-mark">“</div>
          <p>{loadingQuote ? "Loading an academic quote..." : quote.q}</p>
          <div className="quote-footer">
            <span>— {quote.a}</span>
            <button onClick={loadQuote}>New quote ↻</button>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature">
          <span className="feature-number">01</span>
          <h3>Plan</h3>
          <p>Create tasks with priorities and due dates.</p>
        </div>
        <div className="feature">
          <span className="feature-number">02</span>
          <h3>Track</h3>
          <p>Monitor completed and remaining work.</p>
        </div>
        <div className="feature">
          <span className="feature-number">03</span>
          <h3>Improve</h3>
          <p>Build consistency through visible progress.</p>
        </div>
      </section>
    </main>
  );
}

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3500);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(API + "/tasks");

      if (!response.ok) {
        throw new Error("Could not load tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      showMessage("Could not connect to the backend. Make sure MongoDB and the server are running.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = async () => {
    if (title.trim() === "") {
      showMessage("Please enter a task first.", "error");
      return;
    }

    try {
      const response = await fetch(API + "/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          priority,
          dueDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setTasks((current) => [data, ...current]);
      setTitle("");
      setPriority("Medium");
      setDueDate("");
      showMessage("Task added successfully.");
    } catch (error) {
      showMessage(error.message || "Could not add task. Check MongoDB.", "error");
    }
  };

  const toggleTask = async (task) => {
    try {
      const response = await fetch(API + "/tasks/" + task._id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          completed: !task.completed
        })
      });

      if (!response.ok) throw new Error();

      const updated = await response.json();

      setTasks((current) =>
        current.map((item) => item._id === updated._id ? updated : item)
      );
    } catch {
      showMessage("Could not update task.", "error");
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(API + "/tasks/" + id, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error();

      setTasks((current) => current.filter((task) => task._id !== id));
      showMessage("Task deleted.");
    } catch {
      showMessage("Could not delete task.", "error");
    }
  };

  const clearCompleted = async () => {
    if (!tasks.some((task) => task.completed)) {
      showMessage("There are no completed tasks to clear.", "error");
      return;
    }

    try {
      const response = await fetch(API + "/tasks", {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) throw new Error();

      setTasks((current) => current.filter((task) => !task.completed));
      showMessage(data.message);
    } catch {
      showMessage("Could not clear completed tasks.", "error");
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && !task.completed) ||
        (filter === "Completed" && task.completed);

      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, search]);

  const completed = tasks.filter((task) => task.completed).length;
  const active = tasks.length - completed;
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return (
    <main className="container task-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">TASK MANAGEMENT</span>
          <h1>My Study Tasks</h1>
          <p>Plan your academic work and track your progress.</p>
        </div>

        <button className="clear-btn" onClick={clearCompleted}>
          Clear completed
        </button>
      </section>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>
        <div className="stat-card">
          <span>Active</span>
          <strong>{active}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{completed}</strong>
        </div>
        <div className="stat-card">
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
      </section>

      <section className="task-layout">
        <div className="add-task-card">
          <div className="card-title">
            <span>＋</span>
            <h2>Add New Task</h2>
          </div>

          <label>Task name</label>
          <input
            type="text"
            placeholder="Example: Complete database assignment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />

          <div className="form-row">
            <div>
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div>
              <label>Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <button className="add-btn" onClick={addTask}>
            Add Task
          </button>
        </div>

        <div className="progress-card">
          <span className="section-label">CURRENT PROGRESS</span>
          <div className="progress-circle">
            <strong>{progress}%</strong>
            <span>Complete</span>
          </div>
          <p>{completed} of {tasks.length} tasks completed</p>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </section>

      <section className="task-list-section">
        <div className="list-header">
          <div>
            <h2>Your Tasks</h2>
            <span>{filteredTasks.length} task(s) shown</span>
          </div>

          <div className="tools">
            <input
              className="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="filters">
          {["All", "Active", "Completed"].map((item) => (
            <button
              key={item}
              className={filter === item ? "selected" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="task-list">
          {loading && <div className="empty-state">Loading tasks...</div>}

          {!loading && filteredTasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>No tasks found</h3>
              <p>Add a new study task or change your filter.</p>
            </div>
          )}

          {filteredTasks.map((task) => (
            <div className={`task-item ${task.completed ? "task-completed" : ""}`} key={task._id}>
              <button
                className={`check-btn ${task.completed ? "checked" : ""}`}
                onClick={() => toggleTask(task)}
                title="Toggle completion"
              >
                {task.completed ? "✓" : ""}
              </button>

              <div className="task-info">
                <h3>{task.title}</h3>
                <div className="task-meta">
                  <span className={`priority ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && <span>Due: {task.dueDate}</span>}
                </div>
              </div>

              <button
                className="delete-btn"
                onClick={() => deleteTask(task._id)}
                title="Delete task"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function About() {
  return (
    <main className="container about-page">
      <span className="eyebrow">ABOUT THE PROJECT</span>
      <h1>Built as a simple full-stack academic project.</h1>

      <div className="about-grid">
        <section>
          <h2>Purpose</h2>
          <p>
            StudyFlow helps students organize academic tasks, prioritize work,
            set due dates, and track completion progress.
          </p>
        </section>

        <section>
          <h2>Technologies</h2>
          <ul>
            <li><strong>React:</strong> User interface</li>
            <li><strong>React Router:</strong> Multi-page navigation</li>
            <li><strong>Node.js + Express:</strong> Backend REST API</li>
            <li><strong>MongoDB:</strong> Database storage</li>
            <li><strong>Mongoose:</strong> Database modeling</li>
            <li><strong>Public API:</strong> Motivational quote integration</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function App() {
  return (
    <>
      <style>{`
        :root {
          --bg: #f6f7fb;
          --surface: #ffffff;
          --ink: #172033;
          --muted: #697386;
          --line: #e7eaf0;
          --dark: #182235;
          --accent: #4f46e5;
          --accent-soft: #eef2ff;
          --success: #16a34a;
          --danger: #dc2626;
          --shadow: 0 12px 35px rgba(20, 30, 55, 0.07);
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--ink);
          background:
            radial-gradient(circle at 0% 0%, rgba(79,70,229,0.06), transparent 30%),
            var(--bg);
        }

        button, input, select { font: inherit; }

        button { cursor: pointer; }

        .navbar {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .nav-inner {
          max-width: 1120px;
          margin: auto;
          min-height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .brand {
          display: flex;
          gap: 10px;
          align-items: center;
          text-decoration: none;
          color: var(--ink);
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .brand-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          color: white;
          background: var(--accent);
        }

        .nav-links { display: flex; gap: 8px; }

        .nav-links a {
          text-decoration: none;
          color: var(--muted);
          padding: 9px 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }

        .nav-links a:hover, .nav-links a.active {
          color: var(--accent);
          background: var(--accent-soft);
        }

        .container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 64px 24px 80px;
        }

        .eyebrow, .section-label {
          color: var(--accent);
          font-size: 11px;
          letter-spacing: 1.4px;
          font-weight: 800;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 50px;
          align-items: center;
          min-height: 430px;
        }

        .hero h1, .page-heading h1, .about-page > h1 {
          font-size: clamp(42px, 6vw, 70px);
          line-height: 1.02;
          letter-spacing: -3px;
          margin: 14px 0 20px;
        }

        .hero h1 span { color: var(--accent); }

        .hero p, .page-heading p {
          color: var(--muted);
          line-height: 1.75;
          max-width: 580px;
          font-size: 17px;
        }

        .hero-buttons { display: flex; gap: 12px; margin-top: 28px; }

        .primary-btn, .secondary-btn {
          text-decoration: none;
          padding: 13px 19px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
        }

        .primary-btn {
          background: var(--dark);
          color: white;
        }

        .secondary-btn {
          color: var(--ink);
          border: 1px solid var(--line);
          background: white;
        }

        .hero-card {
          background: var(--dark);
          color: white;
          border-radius: 24px;
          padding: 30px;
          min-height: 330px;
          box-shadow: 0 24px 60px rgba(24,34,53,0.2);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          color: #b8c0d0;
          font-size: 13px;
        }

        .pulse { color: #7ee787; }

        .focus-number {
          color: #5f6c85;
          font-size: 80px;
          font-weight: 800;
          margin-top: 28px;
          line-height: 1;
        }

        .hero-card h3 { font-size: 25px; margin: 8px 0; }
        .hero-card p { color: #b8c0d0; font-size: 14px; line-height: 1.6; }

        .mini-progress, .progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 24px;
        }

        .mini-progress-fill {
          width: 68%;
          height: 100%;
          background: #818cf8;
          border-radius: inherit;
        }

        .quote-section { margin-top: 70px; }

        .quote-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 34px;
          margin-top: 14px;
          box-shadow: var(--shadow);
        }

        .quote-mark {
          color: var(--accent);
          font-size: 60px;
          height: 42px;
          line-height: 1;
        }

        .quote-card > p {
          font-size: 24px;
          line-height: 1.5;
          max-width: 850px;
          margin: 18px 0;
          font-weight: 600;
        }

        .quote-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--muted);
          font-size: 14px;
        }

        .quote-footer button {
          border: 0;
          background: var(--accent-soft);
          color: var(--accent);
          padding: 9px 13px;
          border-radius: 8px;
          font-weight: 700;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-top: 24px;
        }

        .feature {
          background: white;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 24px;
        }

        .feature-number {
          color: var(--accent);
          font-weight: 800;
          font-size: 13px;
        }

        .feature h3 { margin-bottom: 6px; }
        .feature p { color: var(--muted); line-height: 1.6; margin: 0; }

        .page-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 28px;
        }

        .page-heading h1 {
          font-size: 46px;
          margin-bottom: 8px;
        }

        .clear-btn {
          background: white;
          border: 1px solid var(--line);
          padding: 10px 14px;
          border-radius: 9px;
          color: var(--muted);
          font-weight: 600;
        }

        .message {
          padding: 14px 16px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 14px;
          font-weight: 600;
        }

        .message.success {
          background: #ecfdf3;
          color: #167a3d;
          border: 1px solid #b7efcb;
        }

        .message.error {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card {
          background: white;
          border: 1px solid var(--line);
          padding: 20px;
          border-radius: 14px;
        }

        .stat-card span {
          color: var(--muted);
          font-size: 13px;
          display: block;
          margin-bottom: 8px;
        }

        .stat-card strong {
          font-size: 28px;
          letter-spacing: -1px;
        }

        .task-layout {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .add-task-card, .progress-card, .task-list-section {
          background: white;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 25px;
          box-shadow: var(--shadow);
        }

        .card-title {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-title span {
          background: var(--accent-soft);
          color: var(--accent);
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        .card-title h2, .list-header h2 { margin: 0; font-size: 20px; }

        label {
          display: block;
          color: #4b5563;
          font-size: 13px;
          font-weight: 700;
          margin: 13px 0 7px;
        }

        input, select {
          width: 100%;
          border: 1px solid #dce0e8;
          background: #fafbfc;
          padding: 11px 12px;
          border-radius: 9px;
          outline: none;
          color: var(--ink);
        }

        input:focus, select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(79,70,229,0.08);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .add-btn {
          width: 100%;
          margin-top: 20px;
          border: 0;
          background: var(--accent);
          color: white;
          padding: 12px;
          border-radius: 9px;
          font-weight: 700;
        }

        .progress-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .progress-circle {
          width: 145px;
          height: 145px;
          border-radius: 50%;
          border: 11px solid #eef0ff;
          margin: 25px auto 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .progress-circle strong {
          font-size: 35px;
          color: var(--accent);
        }

        .progress-circle span {
          color: var(--muted);
          font-size: 12px;
        }

        .progress-card p { color: var(--muted); font-size: 14px; }

        .progress-card .progress-bar {
          margin-top: 12px;
          background: #eceef4;
        }

        .progress-bar > div {
          height: 100%;
          background: var(--accent);
          border-radius: inherit;
          transition: width 0.3s ease;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .list-header span { color: var(--muted); font-size: 13px; }

        .search { width: 200px; }

        .filters {
          display: flex;
          gap: 8px;
          margin: 22px 0 12px;
        }

        .filters button {
          border: 1px solid var(--line);
          background: white;
          color: var(--muted);
          padding: 8px 13px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
        }

        .filters button.selected {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        .task-list { border-top: 1px solid var(--line); }

        .task-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 17px 4px;
          border-bottom: 1px solid var(--line);
        }

        .check-btn {
          width: 23px;
          height: 23px;
          border-radius: 50%;
          border: 2px solid #cbd1dd;
          background: white;
          color: white;
          flex: 0 0 auto;
        }

        .check-btn.checked {
          background: var(--success);
          border-color: var(--success);
        }

        .task-info { flex: 1; }
        .task-info h3 { margin: 0 0 7px; font-size: 15px; }
        .task-completed h3 { text-decoration: line-through; color: #9aa1ad; }

        .task-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          color: var(--muted);
          font-size: 12px;
        }

        .priority {
          padding: 3px 8px;
          border-radius: 999px;
          font-weight: 700;
        }

        .priority.high { color: #b91c1c; background: #fef2f2; }
        .priority.medium { color: #a16207; background: #fffbeb; }
        .priority.low { color: #047857; background: #ecfdf5; }

        .delete-btn {
          border: 0;
          background: transparent;
          color: #a1a7b3;
          font-size: 25px;
          line-height: 1;
        }

        .delete-btn:hover { color: var(--danger); }

        .empty-state {
          text-align: center;
          padding: 55px 20px;
          color: var(--muted);
        }

        .empty-state h3 { color: var(--ink); margin-bottom: 5px; }

        .empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--accent-soft);
          color: var(--accent);
          margin: auto;
          font-size: 20px;
          font-weight: 800;
        }

        .about-page > h1 { max-width: 850px; font-size: 52px; }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 35px;
        }

        .about-grid section {
          background: white;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 25px;
        }

        .about-grid p, .about-grid li {
          color: var(--muted);
          line-height: 1.7;
        }

        @media (max-width: 760px) {
          .nav-inner { padding: 0 15px; }
          .nav-links a { padding: 8px; }
          .container { padding: 42px 16px; }
          .hero, .task-layout, .about-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .feature-grid { grid-template-columns: 1fr; }
          .page-heading, .list-header { align-items: flex-start; gap: 15px; flex-direction: column; }
          .search { width: 100%; }
          .hero h1 { letter-spacing: -2px; }
        }
      `}</style>

      <Navigation />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;