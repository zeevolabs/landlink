# @zeevolabs/landlink-store-fs

Filesystem-based config store adapter for [Landlink Admin](../admin).

## Installation

```bash
pnpm add @zeevolabs/landlink-store-fs
```

## Usage

```ts
import { createFileStore } from "@zeevolabs/landlink-store-fs";
import { createAdminHandler } from "@zeevolabs/landlink-admin";
import { registry } from "./landlink.config";

const handler = createAdminHandler({
  store: createFileStore(),
  password: process.env.LANDLINK_ADMIN_PASSWORD,
  registry,
});
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `path` | `data/landlink.config.json` | Absolute or relative path to the JSON config file. Directories are created automatically. |

```ts
createFileStore({ path: "custom/path/config.json" });
```

## Limitations

- **Not compatible with serverless platforms** that have read-only filesystems (Vercel, Netlify Functions, AWS Lambda).
- Best suited for: local development, VPS, Docker, traditional servers.
- For Vercel deployments, use [`@zeevolabs/landlink-store-vercel-blob`](../store-vercel-blob) instead.

## API

### `createFileStore(options?): ConfigStore`

Creates a `ConfigStore` that reads and writes config as a JSON file on disk.
