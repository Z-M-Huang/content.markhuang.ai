import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  compileCaseStudies,
  findMissingPublishedCaseStudyFiles,
  getChangedCaseStudySlugsMissingFromManifest,
  type CaseStudyManifestEntry,
} from "../compile-case-studies.ts";

function caseStudy(slug: string, published = true): CaseStudyManifestEntry {
  return {
    slug,
    title: slug,
    summary: slug,
    date: "2026-05-17",
    tags: [],
    published,
  };
}

test("getChangedCaseStudySlugsMissingFromManifest reports changed files absent from manifest", () => {
  const missing = getChangedCaseStudySlugsMissingFromManifest(
    { caseStudies: [caseStudy("present")] },
    new Set(["missing", "present"]),
  );

  assert.deepEqual(missing, ["missing"]);
});

test("findMissingPublishedCaseStudyFiles reports published entries without MDX files", async () => {
  const root = await mkdtemp(join(tmpdir(), "case-study-compile-test-"));
  const caseStudiesDir = join(root, "case-studies");
  await mkdir(caseStudiesDir, { recursive: true });
  await writeFile(join(caseStudiesDir, "present.mdx"), "# Present\n");

  const missing = await findMissingPublishedCaseStudyFiles(caseStudiesDir, [
    caseStudy("present"),
    caseStudy("missing"),
  ]);

  assert.deepEqual(missing, ["missing.mdx"]);
});

test("compileCaseStudies writes published manifest and compiled MDX", async () => {
  const root = await mkdtemp(join(tmpdir(), "case-study-compile-test-"));
  const caseStudiesDir = join(root, "case-studies");
  await mkdir(caseStudiesDir, { recursive: true });
  await writeFile(
    join(caseStudiesDir, "manifest.json"),
    JSON.stringify({
      caseStudies: [caseStudy("published"), caseStudy("draft", false)],
    }),
  );
  await writeFile(
    join(caseStudiesDir, "published.mdx"),
    "# Published\n\n```typescript\nconst x = 1;\n```\n",
  );

  const result = await compileCaseStudies({ rootDir: root });

  assert.deepEqual(result, { compiled: 1, published: 1 });
  const manifest = JSON.parse(
    await readFile(join(root, "dist", "case-studies", "manifest.json"), "utf-8"),
  );
  assert.deepEqual(manifest.caseStudies.map((entry: CaseStudyManifestEntry) => entry.slug), [
    "published",
  ]);

  const mdx = await readFile(join(root, "dist", "case-studies", "published.mdx"), "utf-8");
  assert.match(mdx, /data-language="typescript"/);
});
