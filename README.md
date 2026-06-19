# BigQuery Release Notes Explorer

A SaaS dashboard application built with **Python Flask** and **Vanilla HTML, CSS, and JavaScript**. 

The app automatically fetches the official Google BigQuery Release Notes RSS/Atom feed, parses and groups individual updates by their category, displays them in a clean professional light-themed dashboard, and allows developers to customize and tweet about specific updates.

---

## Developed via Google's Antigravity CLI 🚀

> [!IMPORTANT]
> This entire project was built using **Google's Antigravity CLI (`agy`)** as part of the **Kaggle x Google Day-2 workshop on Agents & Vibe Coding**.

### What is Antigravity CLI?
**Antigravity CLI (`agy`)** is Google's advanced, autonomous AI developer agent companion designed for software engineering. Running directly on the local terminal, `agy` integrates a powerful Gemini reasoning model with deep filesystem, shell command, browser automation, and subagent orchestration tools. This allows the developer to collaborate on codebase creation, modification, debugging, and testing entirely via natural language prompts, while the CLI autonomously compiles code, resolves errors, and stages commits.

### `agy` Commands Used During Development
During the design, development, and deployment of this application, the following `agy` commands were utilized:

*   **`agy`** (or **`agy -i` / `agy --prompt-interactive`**): Used to initiate the interactive developer agent session inside the repository workspace, launching the pair-programming loop.
*   **`agy --continue`** (or **`agy -c`**): Used to resume and continue the most recent coding conversation session, allowing the agent to persist context across terminals and system restarts.
*   **`agy models`**: Used to query and list the available Google Gemini models that can power the developer agent.
*   **`agy plugin`** (or **`agy plugins`**): Used to view, enable, and manage developer agent extensions (such as `chrome-devtools-plugin` for accessibility/LCP auditing and `modern-web-guidance-plugin` for CSS/JS guidelines).

### Built With
*   **Agentic Orchestrator**: Google's Antigravity CLI (`agy`)
*   **AI Foundation Model**: Gemini 3.5 Flash
*   **Backend Framework**: Python Flask (with `feedparser` and `BeautifulSoup4`)
*   **Frontend Stack**: Vanilla HTML5, Vanilla CSS3, and Vanilla ES6 JavaScript (built completely from scratch without external frameworks or UI libraries)

---

## Preview

![BigQuery Release Notes Explorer Dashboard](docs/screenshot.png)

---

## Key Features

- **Live Metrics Dashboard:** Real-time tracking of total updates, new features, announcements, and known issues.

- **Smart HTML Parsing:** Automatically segments aggregated BigQuery XML feeds into individual, actionable updates.

- **Interactive Search & Filtering:** Offers live text search, color-coded category tags, and dynamic chronological sorting.

- **Automated X (Twitter) Composer:** Auto-generates platform-ready drafts with smart word-boundary truncation and a live visual character counter.

- **Precision Deep-Linking:** Routes users directly to exact date anchors within Google Cloud's official release notes.

- **Resilient Backend Architecture:** Ensures high performance and stability using in-memory caching and fault-tolerant parsing to bypass local certificate barriers.

---

## File Structure

```text
bigquery-release-notes-app/
├── app.py                  # Flask Application Server (API + HTML Routes)
├── templates/
│   └── index.html          # Clean HTML5 Template Structure
├── static/
│   ├── css/
│   │   └── style.css       # Custom Light Theme Styles & Transitions
│   └── js/
│       └── app.js          # Client-Side Rendering, Filtering & Share Logic
├── .gitignore              # Git Ignore Exclusions (Virtualenv, Caches, etc.)
└── README.md               # Project Documentation
```

---

## Quick Start & Running

### Prerequisites
Make sure you have **Python 3.12** or higher installed.

### Installation

1. Navigate to the project root directory:
   ```bash
   cd bigquery-release-notes-app
   ```

2. Create a Python virtual environment:
   ```bash
   python3 -m venv .venv
   ```

3. Activate the virtual environment:
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows:
     ```bash
     .venv\Scripts\activate
     ```

4. Install the required dependencies:
   ```bash
   pip install Flask requests feedparser beautifulsoup4
   ```

### Running the Server

Start the Flask application:
```bash
python app.py
```

Local Access: Upon startup, the application runs on port `8080`. Open your browser and navigate to:
👉 **[http://localhost:8080/](http://localhost:8080/)**

---

## Dependencies

- **[Flask](https://flask.palletsprojects.com/)**: Micro-web framework to serve endpoints and assets.
- **[BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/)**: HTML parsing to extract individual updates.
- **[Feedparser](https://github.com/kurtmckee/feedparser)**: Atom/RSS feed parser.
- **[Requests](https://requests.readthedocs.io/)**: Fallback HTTP client for network fetch requests.
