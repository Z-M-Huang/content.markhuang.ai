# content.markhuang.ai

Content repository for [markhuang.ai](https://markhuang.ai). The Go backend fetches content from this repo via the GitHub raw API with in-memory caching and webhook-driven invalidation.

## Structure

```
content.markhuang.ai/
├── blog/
│   ├── manifest.json          # Source of truth for all article metadata
│   ├── ai-llms/               # AI & LLMs category
│   ├── motorcycles/            # Motorcycles category
│   ├── software-engineering/   # Software Engineering category
│   └── tutorials/              # Tutorials category
│       └── *.mdx               # Article content files
└── knowledge/                  # AI chat widget knowledge base (*.md)
```

## Blog Articles

### manifest.json

All article metadata lives in `blog/manifest.json`. Each entry contains:

| Field           | Type       | Description                              |
|-----------------|------------|------------------------------------------|
| `slug`          | string     | URL-safe identifier (matches MDX filename) |
| `title`         | string     | Article title                            |
| `description`   | string     | Short description for SEO/previews       |
| `date`          | string     | Publication date (`YYYY-MM-DD`)          |
| `category`      | string     | Directory name (e.g. `tutorials`)        |
| `categoryLabel` | string     | Display name (e.g. `Tutorials`)          |
| `tags`          | string[]   | Topic tags                               |
| `published`     | boolean    | Set `false` to hide from listings        |
| `image`         | string\|null | Optional hero image URL                |
| `readTime`      | string     | Estimated read time (e.g. `11 min read`) |

### MDX Files

Article content is stored as MDX at `blog/{category}/{slug}.mdx`. The backend resolves articles by category + slug from the manifest.

## Knowledge Base

Markdown files in `knowledge/` are used by the AI chat widget. The backend fetches `knowledge/manifest.json` (when present) and individual `*.md` files to provide context for chat responses.

## How the Backend Consumes This Repo

| Setting                | Env Var              | Default                              |
|------------------------|----------------------|--------------------------------------|
| Repository             | `CONTENT_REPO`       | `Z-M-Huang/content.markhuang.ai`    |
| Branch                 | `CONTENT_BRANCH`     | `main`                               |
| Path prefix            | `CONTENT_PATH_PREFIX`| _(empty — reads from root)_          |

- **Production**: Backend fetches from GitHub raw API (`raw.githubusercontent.com`)
- **Cache invalidation**: A GitHub webhook (`POST /api/v1/webhook/github`) triggers cache refresh when content is pushed
- **Local dev**: Backend can also read from a local directory via `FileContentReader`

## Adding a New Article

1. Add a new entry to `blog/manifest.json` with all required fields
2. Create the MDX file at `blog/{category}/{slug}.mdx`
3. Push to `main` — the webhook automatically invalidates the backend cache

## MDX Features

The following features are supported in `.mdx` article files.

### Syntax-Highlighted Code Blocks

Standard fenced code blocks with language identifiers are syntax-highlighted automatically. Supported languages include `go`, `typescript`, `javascript`, `python`, `bash`, `json`, `yaml`, and many others.

````mdx
```go
func main() {
    fmt.Println("Hello, world!")
}
```
````

### Playground Code Blocks

Add `playground` after the language identifier to include a "Run this code" link to the Go Playground.

````mdx
```go playground
package main

import "fmt"

func main() {
    fmt.Println("Try it on the Go Playground")
}
```
````

### Mermaid Diagrams

Use `mermaid` as the language identifier to render diagrams as inline SVG charts.

````mdx
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Other action]
```
````

### Callout Components

Use the `<Callout>` component with a `type` prop to render styled callout boxes.

```mdx
<Callout type="info">Informational note for the reader.</Callout>

<Callout type="warning">Warning about a potential issue.</Callout>

<Callout type="tip">Helpful tip or best practice.</Callout>

<Callout type="error">Error or critical notice.</Callout>
```

Supported types: `info`, `warning`, `tip`, `error`.

### Images

Standard markdown image syntax is rendered as a Next.js `<Image>` component wrapped in `<figure>` / `<figcaption>` for accessibility and layout.

```mdx
![Description of the image](https://example.com/image.png)
```

### Tables

GFM (GitHub Flavored Markdown) tables are supported and rendered inside a responsive wrapper for horizontal scrolling on small screens.

```mdx
| Column A | Column B | Column C |
|----------|----------|----------|
| value 1  | value 2  | value 3  |
```
