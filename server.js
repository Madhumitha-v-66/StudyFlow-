import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/studentTaskManager", {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log("✓ Connected to MongoDB"))
  .catch((error) => console.log("✗ MongoDB connection error:", error.message));

// Task schema
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      default: "Medium"
    },
    dueDate: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// GET all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Could not load tasks. Check that MongoDB is running."
    });
  }
});

// POST a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "Task title is required."
      });
    }

    const newTask = new Task({
      title: title.trim(),
      priority: priority || "Medium",
      dueDate: dueDate || ""
    });

    await newTask.save();

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({
      message: "Could not add task. Check MongoDB connection."
    });
  }
});

// PUT update task completion
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: req.body.completed },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Could not update task." });
  }
});

// DELETE one task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete task." });
  }
});

// DELETE completed tasks
app.delete("/api/tasks", async (req, res) => {
  try {
    const result = await Task.deleteMany({ completed: true });

    res.json({
      message: `${result.deletedCount} completed task(s) removed.`
    });
  } catch (error) {
    res.status(500).json({ message: "Could not clear completed tasks." });
  }
});

// Academic / study motivation quotes
const studyQuotes = [
  {
    q: "Education is the most powerful weapon which you can use to change the world.",
    a: "Nelson Mandela"
  },
  {
    q: "The beautiful thing about learning is that nobody can take it away from you.",
    a: "B. B. King"
  },
  {
    q: "Success is the sum of small efforts, repeated day in and day out.",
    a: "Robert Collier"
  },
  {
    q: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    a: "Mahatma Gandhi"
  },
  {
    q: "An investment in knowledge pays the best interest.",
    a: "Benjamin Franklin"
  }
];

// Public API endpoint with reliable academic fallback
app.get("/api/quote", async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");

    if (response.ok) {
      const data = await response.json();

      // We still use the public API, but use a study-focused fallback if unavailable.
      if (data && data[0] && data[0].q) {
        return res.json({
          q: data[0].q,
          a: data[0].a,
          source: "Public API"
        });
      }
    }
  } catch (error) {
    // Continue to local fallback
  }

  const quote = studyQuotes[Math.floor(Math.random() * studyQuotes.length)];

  res.json({
    ...quote,
    source: "Study collection"
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
});