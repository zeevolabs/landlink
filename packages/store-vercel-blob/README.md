# @zeevolabs/landlink-store-vercel-blob

Vercel Blob Storage config store adapter for [Landlink Admin](../admin).

## Installation

```bash
pnpm add @zeevolabs/landlink-store-vercel-blob
```

## Setup

1. Add Blob Storage to your Vercel project in the dashboard (Storage → Create → Blob).
2. Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into your environment.

## Usage

```ts
import { createVercelBlobStore } from "@zeevolabs/landlink-store-vercel-blob";
import { createAdminHandler } from "@zeevolabs/landlink-admin";
import { registry } from "./landlink.config";

const handler = createAdminHandler({
  store: createVercelBlobStore(),
  password: process.env.LANDLINK_ADMIN_PASSWORD,
  registry,
});
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `token` | `process.env.BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token. Automatically provided when Blob Storage is added to the Vercel project. |
| `path` | `landlink/config.json` | Path within the blob store. |

```ts
createVercelBlobStore({
  token: "custom-token",
  path: "my-app/config.json",
});
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token (auto-injected by Vercel when Blob Storage is enabled) |

## API

### `createVercelBlobStore(options?): ConfigStore`

Creates a `ConfigStore` backed by Vercel Blob Storage. Reads and writes config as a JSON blob.
