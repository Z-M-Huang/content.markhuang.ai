/**
 * Upload compiled articles and manifest to Cloudflare R2 via S3 API.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, existsSync } from "fs";
import { basename, join } from "path";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Missing required R2 environment variables");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function upload(key: string, body: Buffer, contentType: string) {
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  console.log(`Uploaded: ${key}`);
}

const articlesDir = "dist/articles";
const manifestPath = "dist/manifest.json";

// Upload articles first, then manifest — avoids a window where
// the manifest references slugs whose MDX hasn't landed yet.
if (existsSync(articlesDir)) {
  for (const file of readdirSync(articlesDir)) {
    if (!file.endsWith(".mdx")) continue;
    const filePath = join(articlesDir, file);
    await upload(`articles/${file}`, readFileSync(filePath), "text/mdx");
  }
}

if (existsSync(manifestPath)) {
  await upload("manifest.json", readFileSync(manifestPath), "application/json");
}

console.log(`Done — uploaded to bucket: ${R2_BUCKET_NAME}`);
