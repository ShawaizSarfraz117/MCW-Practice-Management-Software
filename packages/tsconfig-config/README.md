# @mcw/tsconfig-config

This package contains shared TypeScript configurations for various project types in the MCW Platform.

## Usage

### 1. Install the package

Since this is a workspace package in a monorepo, you can reference it directly in your project's `package.json`:

```json
{
  "dependencies": {
    "@mcw/tsconfig-config": "*"
  }
}
```

### 2. Reference the configuration in your tsconfig.json

#### Base Configuration (for library packages)

```json
{
  "extends": "@mcw/tsconfig-config"
}
```

#### Next.js Configuration

```json
{
  "extends": "@mcw/tsconfig-config/next"
}
```

#### React Configuration (for non-Next.js React apps)

```json
{
  "extends": "@mcw/tsconfig-config/react"
}
```

#### Node.js Configuration

```json
{
  "extends": "@mcw/tsconfig-config/node"
}
```

### 3. Add project-specific options

You can extend the shared configuration with your own project-specific options:

```json
{
  "extends": "@mcw/tsconfig-config/next",
  "compilerOptions": {
    "rootDir": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  },
  "include": ["additional-types.d.ts"]
}
```

## Available Configurations

- **base.json**: Base TypeScript configuration for all projects
- **next.json**: Configuration for Next.js projects
- **react.json**: Configuration for React projects (non-Next.js)
- **node.json**: Configuration for Node.js projects
