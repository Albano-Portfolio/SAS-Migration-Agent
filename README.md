# SAS Migration Agent Orchestrator

A React/Vite portfolio app that demonstrates a multi-agent workflow for documenting and converting SAS programs to Databricks SQL or Python/PySpark.

## What It Does

The app coordinates five agent-style workflows:

1. Code Review & Documentation Agent
2. Conversion Agent
3. Optimization Agent
4. Testing Agent
5. Change Documentation Agent

## Why This Shows Agent Orchestration

This project breaks a complex SAS migration into specialized agents. Each agent has a clear responsibility, and the outputs are combined into a single migration report.

This demonstrates:
- task decomposition
- multi-step workflow automation
- migration governance
- human review checkpoints
- agent-style orchestration
- SAS-to-Databricks modernization thinking

## Setup

Install Node.js LTS, then run:

```bash
cd sas-migration-agent-orchestrator
npm install
npm run dev
```

Open the local URL shown, usually:

```text
http://localhost:5173
```

## How to Use

1. Paste SAS code into the input box.
2. Choose Databricks SQL or Python/PySpark.
3. Review the five agent outputs.
4. Copy converted code.
5. Download the migration report.
6. Copy the agent prompt and use it in ChatGPT, Claude, Cursor, GitHub Copilot, or Databricks Assistant.

## GitHub Upload

Upload these files to your repo:

```text
package.json
index.html
README.md
src/
```

## GitHub Pages Deployment

Run:

```bash
npm install
npm run build
```

Rename `dist` to `docs`.

Upload the `docs` folder to GitHub.

Then set GitHub Pages to:

```text
Source: Deploy from branch
Branch: main
Folder: /docs
```

## Interview Explanation

You can say:

> I built a SAS Migration Agent Orchestrator that demonstrates how multiple specialized agents can work together to automate a code migration workflow. One agent reviews and documents SAS code, another converts it to Databricks SQL or PySpark, another optimizes it, another creates validation tests, and another documents changes. This shows I understand agent orchestration, workflow automation, migration governance, and analytics modernization.

## Resume Bullet

Designed and built a React-based SAS Migration Agent Orchestrator that coordinates multiple agent-style workflows to document SAS programs, convert logic to Databricks SQL or PySpark, recommend optimizations, generate validation tests, and document migration changes.
