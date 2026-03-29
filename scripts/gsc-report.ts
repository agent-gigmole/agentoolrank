#!/usr/bin/env bun
/**
 * Google Search Console 数据拉取 + 分析报告
 *
 * Usage: bun run scripts/gsc-report.ts [--days=7]
 *
 * Outputs a structured report to stdout + saves JSON to data/gsc-latest.json
 */
import { google } from "googleapis";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SITE_URL = "sc-domain:agentoolrank.com";
const KEY_PATH = join(process.cwd(), "gsc-service-account.json");
const OUTPUT_PATH = join(process.cwd(), "data", "gsc-latest.json");

const DAYS = parseInt(
  process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "7"
);

async function getAuth() {
  const keyFile = JSON.parse(readFileSync(KEY_PATH, "utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return auth;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function main() {
  const auth = await getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // GSC data is delayed ~2 days
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - DAYS);

  console.log(`\n=== GSC Report: ${formatDate(startDate)} ~ ${formatDate(endDate)} (${DAYS} days) ===\n`);

  // 1. Overall performance
  const overall = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: [],
    },
  });

  const totals = overall.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  console.log("--- 总览 ---");
  console.log(`  点击: ${totals.clicks}`);
  console.log(`  展示: ${totals.impressions}`);
  console.log(`  CTR: ${((totals.ctr as number) * 100).toFixed(1)}%`);
  console.log(`  平均排名: ${(totals.position as number).toFixed(1)}`);

  // 2. Top queries
  const queries = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["query"],
      rowLimit: 20,
    },
  });

  console.log("\n--- Top 查询词 ---");
  if (queries.data.rows?.length) {
    for (const row of queries.data.rows) {
      const q = row.keys![0];
      console.log(
        `  ${q.padEnd(40)} | 点击:${String(row.clicks).padStart(3)} | 展示:${String(row.impressions).padStart(4)} | CTR:${((row.ctr as number) * 100).toFixed(0).padStart(3)}% | 排名:${(row.position as number).toFixed(1)}`
      );
    }
  } else {
    console.log("  (无数据)");
  }

  // 3. Top pages
  const pages = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["page"],
      rowLimit: 20,
    },
  });

  console.log("\n--- Top 页面 ---");
  if (pages.data.rows?.length) {
    for (const row of pages.data.rows) {
      const page = row.keys![0].replace("https://agentoolrank.com", "");
      console.log(
        `  ${(page || "/").padEnd(50)} | 点击:${String(row.clicks).padStart(3)} | 展示:${String(row.impressions).padStart(4)} | 排名:${(row.position as number).toFixed(1)}`
      );
    }
  } else {
    console.log("  (无数据)");
  }

  // 4. Daily trend
  const daily = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["date"],
    },
  });

  console.log("\n--- 每日趋势 ---");
  if (daily.data.rows?.length) {
    for (const row of daily.data.rows) {
      const bar = "█".repeat(Math.min(row.impressions as number, 50));
      console.log(
        `  ${row.keys![0]} | 点击:${String(row.clicks).padStart(2)} | 展示:${String(row.impressions).padStart(3)} | ${bar}`
      );
    }
  }

  // 5. Countries
  const countries = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ["country"],
      rowLimit: 10,
    },
  });

  console.log("\n--- 国家/地区 ---");
  if (countries.data.rows?.length) {
    for (const row of countries.data.rows) {
      console.log(
        `  ${row.keys![0].padEnd(10)} | 展示:${String(row.impressions).padStart(4)} | 点击:${String(row.clicks).padStart(3)}`
      );
    }
  }

  // 6. Index coverage (sitemaps)
  try {
    const sitemaps = await searchconsole.sitemaps.list({ siteUrl: SITE_URL });
    console.log("\n--- Sitemap 状态 ---");
    if (sitemaps.data.sitemap?.length) {
      for (const sm of sitemaps.data.sitemap) {
        console.log(`  ${sm.path}`);
        console.log(`    状态: ${sm.isPending ? "pending" : "已处理"}`);
        console.log(`    发现 URL: ${sm.contents?.[0]?.submitted || "?"}`);
        console.log(`    已索引: ${sm.contents?.[0]?.indexed || "?"}`);
      }
    }
  } catch {
    console.log("\n--- Sitemap: 无法获取 ---");
  }

  // Save JSON report
  const report = {
    generated: new Date().toISOString(),
    period: { start: formatDate(startDate), end: formatDate(endDate), days: DAYS },
    totals,
    queries: queries.data.rows || [],
    pages: pages.data.rows || [],
    daily: daily.data.rows || [],
    countries: countries.data.rows || [],
  };

  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n报告已保存: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("GSC API error:", err.message);
  if (err.message?.includes("403")) {
    console.error("\n可能原因: 服务账号未被添加到 GSC 用户权限中");
    console.error("解决: GSC → 设置 → 用户和权限 → 添加 agentoolrank-gsc@wide-river-463112-i5.iam.gserviceaccount.com");
  }
  process.exit(1);
});
