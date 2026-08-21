#!/usr/bin/env node
/**
 * generate-security-report.js
 *
 * Parses Trivy + pnpm-audit JSON outputs (downloaded artifacts) and splices an
 * auto-generated results section into the end of VULNERABILITIES.md between
 * SECURITY-SCAN markers. Zero dependencies — runs on the CI runner's Node 22.
 *
 * Expected artifact layout (downloaded via actions/download-artifact):
 *   scan-artifacts/repo-scan/pnpm-audit.json
 *   scan-artifacts/repo-scan/trivy-fs.json
 *   scan-artifacts/image-scan/trivy-image.json
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const ARTIFACTS = path.join(ROOT, 'scan-artifacts');
const DOC = path.join(ROOT, 'VULNERABILITIES.md');

const START = '<!-- SECURITY-SCAN:START -->';
const END = '<!-- SECURITY-SCAN:END -->';

const REPO = process.env.REPO || 'wildfirebill-ai/localai-code-editor';
const RUN_URL = process.env.RUN_URL || '';
const EVENT = process.env.EVENT_NAME || 'manual';
const RELEASE_TAG = process.env.RELEASE_TAG || '';
const INPUT_TAG = process.env.INPUT_TAG || '';

function readJson(rel) {
  const p = path.join(ARTIFACTS, rel);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    console.warn(`[report] missing/unreadable artifact: ${rel}`);
    return null;
  }
}

function esc(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/* ---------- Trivy ---------- */

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };

function parseTrivy(json, maxRows = 30) {
  if (!json || !Array.isArray(json.Results)) {
    return { counts: null, rows: [], total: 0, truncated: 0 };
  }
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  let all = [];
  for (const result of json.Results) {
    for (const v of result.Vulnerabilities ?? []) {
      const sev = (v.Severity || 'UNKNOWN').toUpperCase();
      if (sev in counts) counts[sev]++;
      all.push({
        id: v.VulnerabilityID || '?',
        pkg: v.PkgName || '?',
        installed: v.InstalledVersion || '?',
        fixed: v.FixedVersion || '(no fix)',
        sev,
        title: (v.Title || '').slice(0, 90),
        target: result.Target || '',
      });
    }
  }
  const total = all.length;
  all.sort((a, b) => (SEV_ORDER[a.sev] ?? 9) - (SEV_ORDER[b.sev] ?? 9));
  const detail = all.filter((v) => v.sev === 'CRITICAL' || v.sev === 'HIGH');
  return {
    counts,
    total,
    rows: detail.slice(0, maxRows),
    truncated: Math.max(0, detail.length - maxRows),
  };
}

function trivySection(title, parsed, extraNote) {
  const lines = [`### ${title}`, ''];
  if (!parsed.counts) {
    lines.push('_Scan result unavailable (artifact missing)._');
    lines.push('');
    return lines.join('\n');
  }
  lines.push(
    `**Totals:** ${parsed.counts.CRITICAL} critical · ${parsed.counts.HIGH} high · ` +
      `${parsed.counts.MEDIUM} medium · ${parsed.counts.LOW} low` +
      (extraNote ? ` · _${extraNote}_` : '')
  );
  lines.push('');
  if (parsed.rows.length === 0) {
    lines.push('✅ No HIGH or CRITICAL vulnerabilities found.');
  } else {
    lines.push('| Severity | ID | Package | Installed | Fixed | Title |');
    lines.push('|---|---|---|---|---|---|');
    for (const r of parsed.rows) {
      lines.push(
        `| ${r.sev} | ${esc(r.id)} | ${esc(r.pkg)} | ${esc(r.installed)} | ${esc(r.fixed)} | ${esc(r.title)} |`
      );
    }
    if (parsed.truncated > 0) lines.push(`\n_…and ${parsed.truncated} more HIGH/CRITICAL findings truncated._`);
  }
  lines.push('');
  return lines.join('\n');
}

/* ---------- pnpm audit ---------- */

function parsePnpmAudit(json) {
  // pnpm --json output mirrors npm: either { advisories: {...} } or { vulnerabilities: {...} }
  if (!json) return { counts: {}, rows: [], total: 0 };
  const counts = {};
  let advisories = [];
  if (json.advisories && typeof json.advisories === 'object') {
    advisories = Object.values(json.advisories);
  } else if (json.vulnerabilities && typeof json.vulnerabilities === 'object') {
    advisories = Object.values(json.vulnerabilities).map((v) => ({
      module_name: v.name,
      severity: Array.isArray(v.severity) ? v.severity[0] : v.severity,
      title: v.title ?? v.via?.map((x) => x.title ?? x).join(', '),
      url: Array.isArray(v.via) ? v.via.filter((x) => typeof x === 'object').map((x) => x.url)[0] : undefined,
      vulnerable_versions: v.range,
      patched_versions: (v.fixAvailable === true ? 'see latest' : v.fixAvailable?.version) || '?',
    }));
  }
  let all = [];
  for (const a of advisories) {
    const sev = String(a.severity || 'UNKNOWN').toUpperCase();
    counts[sev] = (counts[sev] || 0) + 1;
    all.push({
      sev,
      module: a.module_name || a.name || '?',
      title: (a.title || '').slice(0, 90),
      vulnerable: a.vulnerable_versions || a.range || '?',
      patched: a.patched_versions || '?',
      url: a.url || '',
    });
  }
  const order = { CRITICAL: 0, HIGH: 1, MODERATE: 2, MEDIUM: 2, LOW: 3 };
  all.sort((a, b) => (order[a.sev] ?? 9) - (order[b.sev] ?? 9));
  return { counts, rows: all.slice(0, 30), total: all.length };
}

function auditSection(parsed) {
  const lines = ['### Repository dependencies (pnpm audit)', ''];
  if (parsed.total === 0 && Object.keys(parsed.counts).length === 0) {
    lines.push('✅ No advisories reported.');
    lines.push('');
    return lines.join('\n');
  }
  const summary = Object.entries(parsed.counts)
    .sort(([a], [b]) => (order_(a) - order_(b)))
    .map(([k, v]) => `${v} ${k.toLowerCase()}`)
    .join(' · ');
  lines.push(`**Totals:** ${summary || '0 findings'}`);
  lines.push('');
  if (parsed.rows.length) {
    lines.push('| Severity | Package | Title | Vulnerable | Patched |');
    lines.push('|---|---|---|---|---|');
    for (const r of parsed.rows) {
      lines.push(
        `| ${r.sev} | ${esc(r.module)} | ${esc(r.title)}${r.url ? ` ([ref](${r.url}))` : ''} | ${esc(r.vulnerable)} | ${esc(r.patched)} |`
      );
    }
  } else {
    lines.push('✅ No HIGH or CRITICAL advisories.');
  }
  lines.push('');
  return lines.join('\n');
}

function order_(s) {
  return { CRITICAL: 0, HIGH: 1, MODERATE: 2, MEDIUM: 2, LOW: 3 }[String(s).toUpperCase()] ?? 9;
}

/* ---------- Build section ---------- */

function main() {
  const imageTag =
    EVENT === 'release'
      ? (RELEASE_TAG.replace(/^v/, '') || 'latest')
      : (INPUT_TAG || 'latest');

  const trivyImage = parseTrivy(readJson('image-scan/trivy-image.json'));
  const trivyFs = parseTrivy(readJson('repo-scan/trivy-fs.json'));
  const pnpmAudit = parsePnpmAudit(readJson('repo-scan/pnpm-audit.json'));

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const refLabel =
    EVENT === 'release'
      ? `release \`${RELEASE_TAG}\``
      : EVENT === 'push'
        ? 'tag push (main release pipeline)'
        : EVENT === 'schedule'
          ? 'scheduled weekly scan (main @ HEAD)'
          : `manual dispatch (${EVENT})`;

  const section = [
    START,
    '## 🤖 Automated Scan Results',
    '',
    `> **Last scan:** ${now} · **Target:** \`${refLabel}\` · Docker image \`ghcr.io/${REPO}:${imageTag}\``,
    `> [Full run logs](${RUN_URL}) — generated by the security-scan workflow. Do not edit this section manually.`,
    '',
    trivySection(
      `Docker image \`ghcr.io/${REPO}:${imageTag}\` (OS + library packages; unfixed vulns ignored)`,
      trivyImage
    ),
    trivySection('Repository filesystem (lockfiles, configs; vulns + misconfig + secrets)', trivyFs),
    auditSection(pnpmAudit),
    END,
  ].join('\n');

  // Splice into VULNERABILITIES.md
  let doc = fs.readFileSync(DOC, 'utf-8');
  const startIdx = doc.indexOf(START);
  const endIdx = doc.indexOf(END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    doc = doc.slice(0, startIdx) + section + '\n' + doc.slice(endIdx + END.length);
    // Trim trailing whitespace before section
    doc = doc.replace(/\n{3,}## 🤖 Automated/g, '\n\n## 🤖 Automated');
  } else {
    doc = doc.trimEnd() + '\n\n' + section + '\n';
  }

  fs.writeFileSync(DOC, doc, 'utf-8');
  console.log('[report] VULNERABILITIES.md updated.');
  console.log(`[report] image CRITICAL=${trivyImage.counts?.CRITICAL ?? '?'} HIGH=${trivyImage.counts?.HIGH ?? '?'}` +
    ` · fs CRITICAL=${trivyFs.counts?.CRITICAL ?? '?'} HIGH=${trivyFs.counts?.HIGH ?? '?'}` +
    ` · audit total=${pnpmAudit.total}`);
}

main();
