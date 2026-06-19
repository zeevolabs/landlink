# @zeevolabs/landlink-admin

Optional admin panel extension for [Landlink](../landlink). Provides server-side utilities to build a config editing interface with pluggable storage.

## Installation

```bash
pnpm add @zeevolabs/landlink-admin
```

## Usage

### 1. Choose a store adapter

The admin requires a `ConfigStore` implementation. Pick one that fits your deployment:

| Adapter | Package | Best for |
|---------|---------|----------|
| Vercel Blob | `@zeevolabs/landlink-store-vercel-blob` | Vercel deployments |
| Filesystem | `@zeevolabs/landlink-store-fs` | Local dev, VPS, Docker |
| Custom | Implement `ConfigStore` | Any other backend |

### 2. Create API route handlers

```ts
// app/api/admin/config/route.ts
import { createAdminHandler } from "@zeevolabs/landlink-admin";
import { createVercelBlobStore } from "@zeevolabs/landlink-store-vercel-blob";
import { registry } from "../../../../landlink.config";

const handler = createAdminHandler({
  store: createVercelBlobStore(),
  password: process.env.LANDLINK_ADMIN_PASSWORD,
  registry,
});

export const GET = handler.GET;
export const PUT = handler.PUT;
```

### 3. Implement a custom store (optional)

```ts
import type { ConfigStore } from "@zeevolabs/landlink-admin";

const myStore: ConfigStore = {
  async get() {
    // return config object or null
  },
  async put(config) {
    // persist config object
  },
};
```

## API

### `createAdminHandler(options)`

Returns `{ GET, PUT }` request handlers compatible with Next.js App Router route handlers.

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `store` | `ConfigStore` | Yes | Storage adapter for reading/writing config |
| `password` | `string \| undefined` | Yes | Admin password (read from env var by the consumer) |
| `registry` | `Registry` | Yes | Block registry for config validation |

### `checkPassword(request, password)`

Compares the `x-admin-password` request header against the provided password. Returns `{ ok: boolean }`.

### `zodToFields(schema)`

Introspects a Zod schema and returns an array of `FieldDescriptor` objects describing the fields — useful for auto-generating admin forms.

### `ConfigStore` (interface)

```ts
interface ConfigStore {
  get(): Promise<Record<string, unknown> | null>;
  put(config: Record<string, unknown>): Promise<void>;
}
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `LANDLINK_ADMIN_PASSWORD` | Password for admin access (passed by the consumer, not read by the library) |
