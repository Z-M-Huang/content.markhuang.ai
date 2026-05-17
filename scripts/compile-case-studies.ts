/**
 * Compile AI adoption case-study MDX by pre-highlighting fenced code blocks.
 *
 * Output:
 *   dist/case-studies/manifest.json
 *   dist/case-studies/{slug}.mdx
 *
 * The frontend fetches these from R2 at render time.
 */

import { access, mkdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { createHighlighter } from "shiki";
import { LANGS, highlightCodeBlocks } from "./compile.ts";

export interface CaseStudyManifestEntry {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
}

export interface CaseStudyManifestFile {
  caseStudies: CaseStudyManifestEntry[];
}

export function getChangedCaseStudySlugsMissingFromManifest(
  manifestFile: CaseStudyManifestFile,
  changedSlugs: Set<string> | null,
): string[] {
  if (!changedSlugs) {
    return [];
  }

  const manifestSlugs = new Set(manifestFile.caseStudies.map((caseStudy) => caseStudy.slug));
  return [...changedSlugs].filter((slug) => !manifestSlugs.has(slug)).sort();
}

export async function findMissingPublishedCaseStudyFiles(
  caseStudiesDir: string,
  published: CaseStudyManifestEntry[],
): Promise<string[]> {
  const missing: string[] = [];

  for (const caseStudy of published) {
    const mdxPath = join(caseStudiesDir, `${caseStudy.slug}.mdx`);
    try {
      await access(mdxPath);
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "ENOENT") {
        missing.push(`${caseStudy.slug}.mdx`);
        continue;
      }
      throw err;
    }
  }

  return missing;
}

interface CompileCaseStudiesOptions {
  rootDir?: string;
  changedSlugs?: Set<string> | null;
}

export async function compileCaseStudies({
  rootDir = resolve(import.meta.dirname, ".."),
  changedSlugs = null,
}: CompileCaseStudiesOptions = {}): Promise<{ compiled: number; published: number }> {
  const caseStudiesDir = join(rootDir, "case-studies");
  const distDir = join(rootDir, "dist", "case-studies");

  const manifestFile = JSON.parse(
    await readFile(join(caseStudiesDir, "manifest.json"), "utf-8"),
  ) as CaseStudyManifestFile;
  const published = manifestFile.caseStudies
    .filter((caseStudy) => caseStudy.published)
    .sort((a, b) => b.date.localeCompare(a.date));

  const missingChangedSlugs = getChangedCaseStudySlugsMissingFromManifest(
    manifestFile,
    changedSlugs,
  );
  if (missingChangedSlugs.length > 0) {
    throw new Error(
      `Changed case-study files are missing from case-studies/manifest.json: ${missingChangedSlugs.join(", ")}`,
    );
  }

  const missingFiles = await findMissingPublishedCaseStudyFiles(caseStudiesDir, published);
  if (missingFiles.length > 0) {
    throw new Error(
      `Published manifest entries are missing case-study files:\n${missingFiles
        .map((file) => `  - case-studies/${file}`)
        .join("\n")}`,
    );
  }

  const toCompile = changedSlugs
    ? published.filter((caseStudy) => changedSlugs.has(caseStudy.slug))
    : published;

  await mkdir(distDir, { recursive: true });

  if (toCompile.length === 0) {
    await writeFile(
      join(distDir, "manifest.json"),
      JSON.stringify({ caseStudies: published }, null, 2),
    );
    console.log("No case studies to compile");
    console.log(`Case-study manifest: ${published.length} published entries`);
    return { compiled: 0, published: published.length };
  }

  console.log("Initializing shiki highlighter...");
  const highlighter = await createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: LANGS,
  });

  let compiled = 0;
  const errors: string[] = [];

  try {
    for (const caseStudy of toCompile) {
      const mdxPath = join(caseStudiesDir, `${caseStudy.slug}.mdx`);
      const outPath = join(distDir, `${caseStudy.slug}.mdx`);

      try {
        const raw = await readFile(mdxPath, "utf-8");
        const highlighted = highlightCodeBlocks(raw, highlighter);
        await writeFile(outPath, highlighted);
        compiled++;
        console.log(`  ✓ ${caseStudy.slug}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${caseStudy.slug}: ${msg}`);
        console.error(`  ✗ ${caseStudy.slug}: ${msg}`);
      }
    }
  } finally {
    highlighter.dispose();
  }

  await writeFile(
    join(distDir, "manifest.json"),
    JSON.stringify({ caseStudies: published }, null, 2),
  );

  console.log(`\nCompiled ${compiled}/${toCompile.length} case studies`);
  console.log(`Case-study manifest: ${published.length} published entries`);

  if (errors.length > 0) {
    throw new Error(`Case-study compile errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  return { compiled, published: published.length };
}

async function main() {
  const args = process.argv.slice(2);
  const changedIdx = args.indexOf("--changed");
  const changedSlugs = changedIdx >= 0 ? new Set(args.slice(changedIdx + 1)) : null;

  await compileCaseStudies({ changedSlugs });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
