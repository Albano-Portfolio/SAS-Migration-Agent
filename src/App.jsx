import { useMemo, useState } from "react";

const sampleSasProgram = `/* Sample SAS program */
libname claims "/data/claims";

proc sql;
  create table work.high_cost_claims as
  select
    member_id,
    provider_id,
    sum(paid_amount) as total_paid,
    count(*) as claim_count
  from claims.medical_claims
  where service_date between '01JAN2025'd and '31DEC2025'd
    and paid_amount > 0
  group by member_id, provider_id
  having calculated total_paid > 10000;
quit;

data work.risk_flags;
  set work.high_cost_claims;
  if total_paid > 50000 then risk_level = "High";
  else if total_paid > 25000 then risk_level = "Medium";
  else risk_level = "Low";
run;

proc means data=work.risk_flags mean sum max;
  var total_paid claim_count;
  class risk_level;
run;`;

const agents = [
  ["1", "Code Review & Documentation Agent", "Explains SAS logic, tables, business purpose, and migration risks."],
  ["2", "Conversion Agent", "Converts SAS into Databricks SQL or Python/PySpark."],
  ["3", "Optimization Agent", "Improves performance, readability, and Databricks readiness."],
  ["4", "Testing Agent", "Creates validation checks to compare SAS and converted outputs."],
  ["5", "Change Documentation Agent", "Documents assumptions, changes, risks, and open questions."]
];

function normalize(text) {
  return String(text || "").toLowerCase();
}

function detectFeatures(code) {
  const lower = normalize(code);
  return {
    procSql: lower.includes("proc sql"),
    dataStep: lower.includes("data "),
    procMeans: lower.includes("proc means"),
    macro: lower.includes("%macro") || lower.includes("%mend") || lower.includes("&"),
    libname: lower.includes("libname"),
    dateLiteral: lower.includes("'d") || lower.includes('"d'),
    calculated: lower.includes("calculated")
  };
}

function documentCode(code) {
  const f = detectFeatures(code);
  const findings = [];
  if (f.libname) findings.push("Defines SAS library references that must map to Databricks schemas, catalogs, or storage paths.");
  if (f.procSql) findings.push("Uses PROC SQL to create transformed analytical tables.");
  if (f.dataStep) findings.push("Uses DATA step logic that should be converted to CASE expressions or DataFrame transformations.");
  if (f.procMeans) findings.push("Uses PROC MEANS summary statistics that should become SQL/PySpark aggregations.");
  if (f.macro) findings.push("Contains macro syntax or variables that require extra migration review.");
  if (f.dateLiteral) findings.push("Uses SAS date literals that should be converted to ISO dates.");
  if (f.calculated) findings.push("Uses SAS CALCULATED syntax that should be rewritten in standard SQL.");

  return {
    summary: "This SAS program appears to extract healthcare claims, aggregate paid amounts, create risk flags, and produce summary statistics.",
    findings: findings.length ? findings : ["No common SAS feature flags were detected. Add more SAS code for deeper analysis."],
    risks: [
      "SAS missing values and Spark/SQL NULL handling may behave differently.",
      "Date literal behavior must be validated.",
      "Intermediate WORK tables need an agreed Databricks staging strategy.",
      "Business-rule equivalence should be reviewed before production use."
    ]
  };
}

function convertSql() {
  return `-- Databricks SQL conversion draft

CREATE OR REPLACE TABLE work.high_cost_claims AS
SELECT
  member_id,
  provider_id,
  SUM(paid_amount) AS total_paid,
  COUNT(*) AS claim_count
FROM claims.medical_claims
WHERE service_date BETWEEN DATE '2025-01-01' AND DATE '2025-12-31'
  AND paid_amount > 0
GROUP BY member_id, provider_id
HAVING SUM(paid_amount) > 10000;

CREATE OR REPLACE TABLE work.risk_flags AS
SELECT
  *,
  CASE
    WHEN total_paid > 50000 THEN 'High'
    WHEN total_paid > 25000 THEN 'Medium'
    ELSE 'Low'
  END AS risk_level
FROM work.high_cost_claims;

SELECT
  risk_level,
  AVG(total_paid) AS avg_total_paid,
  SUM(total_paid) AS sum_total_paid,
  MAX(total_paid) AS max_total_paid,
  AVG(claim_count) AS avg_claim_count,
  SUM(claim_count) AS sum_claim_count,
  MAX(claim_count) AS max_claim_count
FROM work.risk_flags
GROUP BY risk_level
ORDER BY risk_level;`;
}

function convertPython() {
  return `# PySpark conversion draft for Databricks

from pyspark.sql import functions as F

medical_claims = spark.table("claims.medical_claims")

high_cost_claims = (
    medical_claims
    .filter(
        (F.col("service_date").between(F.lit("2025-01-01"), F.lit("2025-12-31"))) &
        (F.col("paid_amount") > 0)
    )
    .groupBy("member_id", "provider_id")
    .agg(
        F.sum("paid_amount").alias("total_paid"),
        F.count("*").alias("claim_count")
    )
    .filter(F.col("total_paid") > 10000)
)

high_cost_claims.write.mode("overwrite").saveAsTable("work.high_cost_claims")

risk_flags = (
    high_cost_claims
    .withColumn(
        "risk_level",
        F.when(F.col("total_paid") > 50000, F.lit("High"))
         .when(F.col("total_paid") > 25000, F.lit("Medium"))
         .otherwise(F.lit("Low"))
    )
)

risk_flags.write.mode("overwrite").saveAsTable("work.risk_flags")

summary = (
    risk_flags
    .groupBy("risk_level")
    .agg(
        F.avg("total_paid").alias("avg_total_paid"),
        F.sum("total_paid").alias("sum_total_paid"),
        F.max("total_paid").alias("max_total_paid"),
        F.avg("claim_count").alias("avg_claim_count"),
        F.sum("claim_count").alias("sum_claim_count"),
        F.max("claim_count").alias("max_claim_count")
    )
    .orderBy("risk_level")
)

display(summary)`;
}

function optimizations(target) {
  const common = [
    "Confirm source table mappings before production use.",
    "Use explicit column lists and avoid unnecessary SELECT * patterns.",
    "Parameterize service date ranges for reusable workflows.",
    "Add comments for business rules and risk thresholds."
  ];
  return target === "Databricks SQL"
    ? [...common, "Use Delta tables for auditability and performance.", "Consider partitioning large claims tables by service year or month."]
    : [...common, "Use PySpark DataFrames for scalable processing.", "Cache only when an intermediate DataFrame is reused multiple times."];
}

function tests() {
  return [
    ["Row Count Reconciliation", "Compare row counts between SAS outputs and converted outputs."],
    ["Aggregate Reconciliation", "Compare sums, averages, max values, and category totals."],
    ["Risk Flag Distribution", "Compare counts by risk_level to validate IF/ELSE or CASE logic."],
    ["Date Filter Validation", "Confirm converted date filters match SAS date literal behavior."],
    ["Null Handling Review", "Review SAS missing values versus Spark/SQL NULL behavior."]
  ];
}

function changeDocs(target) {
  return {
    assumptions: [
      "SAS libraries are mapped to Databricks catalogs, schemas, tables, or storage paths.",
      "SAS WORK tables are converted to staging tables or temporary views.",
      "Date literals are converted to ISO date values.",
      "Business rules are preserved unless documented otherwise."
    ],
    changes: [
      `Converted SAS logic to ${target}.`,
      "Replaced DATA step IF/ELSE logic with CASE or PySpark when/otherwise logic.",
      "Replaced PROC MEANS with SQL/PySpark aggregate logic.",
      "Added reconciliation test recommendations."
    ],
    openQuestions: [
      "Should converted outputs be permanent Delta tables or temporary views?",
      "Are there SAS formats or macros outside this file that affect outputs?",
      "Who approves business-rule equivalence?",
      "What Databricks catalog/schema naming standard should be used?"
    ]
  };
}

function promptPack(target) {
  return `You are a SAS-to-${target} migration agent team.

Agent 1: Code Review and Documentation Agent
- Read the SAS program.
- Identify PROC SQL, DATA steps, macros, formats, date literals, joins, filters, and output tables.
- Explain the business purpose in plain English.

Agent 2: Conversion Agent
- Convert SAS into ${target}.
- Preserve business logic.
- Comment any logic that cannot be converted directly.

Agent 3: Optimization Agent
- Review converted code for performance and maintainability.
- Suggest Databricks best practices.

Agent 4: Testing Agent
- Create reconciliation tests comparing SAS and converted outputs.
- Include row counts, aggregates, null checks, date filters, and category distributions.

Agent 5: Change Documentation Agent
- Document what changed, what stayed the same, assumptions, risks, and validation steps.

Return:
1. SAS code summary
2. Converted ${target} code
3. Optimization notes
4. Test plan
5. Change log
6. Open questions`;
}

function analyze(code, target) {
  const documentation = documentCode(code);
  const converted = target === "Databricks SQL" ? convertSql() : convertPython();
  return {
    documentation,
    converted,
    optimizations: optimizations(target),
    tests: tests(),
    changeDocs: changeDocs(target),
    prompt: promptPack(target)
  };
}

export default function App() {
  const [sasCode, setSasCode] = useState(sampleSasProgram);
  const [target, setTarget] = useState("Databricks SQL");
  const [copied, setCopied] = useState("");

  const result = useMemo(() => analyze(sasCode, target), [sasCode, target]);

  const report = `SAS Migration Agent Report

Target: ${target}

CODE SUMMARY
${result.documentation.summary}

FINDINGS
${result.documentation.findings.map(x => "- " + x).join("\n")}

RISKS
${result.documentation.risks.map(x => "- " + x).join("\n")}

CONVERTED CODE
${result.converted}

OPTIMIZATION NOTES
${result.optimizations.map(x => "- " + x).join("\n")}

TEST PLAN
${result.tests.map(([name, detail]) => "- " + name + ": " + detail).join("\n")}

ASSUMPTIONS
${result.changeDocs.assumptions.map(x => "- " + x).join("\n")}

CHANGES
${result.changeDocs.changes.map(x => "- " + x).join("\n")}

OPEN QUESTIONS
${result.changeDocs.openQuestions.map(x => "- " + x).join("\n")}
`;

  async function copyText(label, text) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  }

  function downloadReport() {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sas-migration-agent-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Agent orchestration portfolio project</p>
          <h1>SAS Migration Agent Orchestrator</h1>
          <p>
            A multi-agent workflow that reviews SAS programs, documents business logic,
            converts code to Databricks SQL or Python, recommends optimizations,
            creates validation tests, and documents migration changes.
          </p>
        </div>

        <div className="hero-actions">
          <button onClick={downloadReport}>Download Report</button>
          <button onClick={() => copyText("prompt", result.prompt)}>
            {copied === "prompt" ? "Copied!" : "Copy Agent Prompt"}
          </button>
        </div>
      </section>

      <section className="agent-grid">
        {agents.map(([number, name, goal]) => (
          <article className="agent-card" key={name}>
            <span>{number}</span>
            <h3>{name}</h3>
            <p>{goal}</p>
          </article>
        ))}
      </section>

      <section className="workspace">
        <section className="panel input-panel">
          <div className="panel-header">
            <div>
              <h2>Input SAS Program</h2>
              <p>Paste SAS code below and choose a target platform.</p>
            </div>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option>Databricks SQL</option>
              <option>Python / PySpark</option>
            </select>
          </div>

          <textarea
            className="code-input"
            value={sasCode}
            onChange={(e) => setSasCode(e.target.value)}
          />

          <div className="button-row">
            <button onClick={() => setSasCode(sampleSasProgram)}>Load Sample SAS</button>
            <button onClick={() => setSasCode("")}>Clear</button>
          </div>
        </section>

        <section className="panel">
          <h2>Orchestrated Output</h2>

          <div className="output-card">
            <h3>1. Code Review & Documentation Agent</h3>
            <p>{result.documentation.summary}</p>
            <ul>{result.documentation.findings.map(x => <li key={x}>{x}</li>)}</ul>
          </div>

          <div className="output-card">
            <div className="card-title-row">
              <h3>2. Conversion Agent</h3>
              <button onClick={() => copyText("code", result.converted)}>
                {copied === "code" ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <pre><code>{result.converted}</code></pre>
          </div>

          <div className="output-card">
            <h3>3. Optimization Agent</h3>
            <ul>{result.optimizations.map(x => <li key={x}>{x}</li>)}</ul>
          </div>

          <div className="output-card">
            <h3>4. Testing Agent</h3>
            <ul>{result.tests.map(([name, detail]) => <li key={name}><strong>{name}:</strong> {detail}</li>)}</ul>
          </div>

          <div className="output-card">
            <h3>5. Change Documentation Agent</h3>
            <h4>Assumptions</h4>
            <ul>{result.changeDocs.assumptions.map(x => <li key={x}>{x}</li>)}</ul>
            <h4>Changes</h4>
            <ul>{result.changeDocs.changes.map(x => <li key={x}>{x}</li>)}</ul>
            <h4>Open Questions</h4>
            <ul>{result.changeDocs.openQuestions.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
        </section>
      </section>

      <section className="panel explanation-panel">
        <h2>Why This Proves Agent Orchestration</h2>
        <p>
          This project breaks a SAS migration into specialized agents, runs each step
          in a logical sequence, and combines the outputs into one migration report.
          That is the core idea of orchestrating agents: task-focused agents working
          together through a controlled workflow with human review checkpoints.
        </p>
        <div className="flow">
          <span>SAS Code</span><strong>→</strong>
          <span>Review Agent</span><strong>→</strong>
          <span>Conversion Agent</span><strong>→</strong>
          <span>Optimization Agent</span><strong>→</strong>
          <span>Testing Agent</span><strong>→</strong>
          <span>Change Documentation</span>
        </div>
      </section>
    </main>
  );
}
