# CI/Local Environment Alignment

## Issue Discovered

The CI was failing on TypeScript checks while local checks were passing. This was due to a fundamental difference in how packages are handled:

### Root Cause

1. **@mcw/email** package exports compiled JavaScript from `dist/`:

   ```json
   "exports": {
     ".": {
       "types": "./dist/index.d.ts",
       "import": "./dist/index.js",
       "require": "./dist/index.js"
     }
   }
   ```

2. **All other packages** export TypeScript directly from `src/`:

   ```json
   "exports": {
     ".": "./src/index.ts"
   }
   ```

3. Locally, the `dist/` folder for @mcw/email existed from previous builds
4. In CI (fresh environment), the `dist/` folder didn't exist, causing TypeScript to fail when resolving `@mcw/email`

## Solution Implemented

### 1. Updated CI Workflow (.github/workflows/pr-checks.yml)

Added a build step for the email package before running TypeScript checks:

```yaml
- name: Build email package
  run: npm run build --workspace=@mcw/email
```

### 2. Updated Local Pre-Push Script (scripts/pre-push-check.sh)

Added the same build step to ensure consistency:

```bash
# 4. Build email package (required for TypeScript checks)
print_status "Building email package..."
npm run build --workspace=@mcw/email
check_result "Email package built"
```

## Best Practices Going Forward

1. **Consistency**: All packages should either:

   - Export TypeScript directly (current pattern for most packages)
   - OR export compiled JavaScript (only @mcw/email currently)

2. **Build Requirements**: If a package requires building, it should be:

   - Documented clearly
   - Built in both CI and local check scripts
   - Listed in a central location

3. **Testing**: Always test with a clean environment:
   ```bash
   # Clean test (simulates CI environment)
   rm -rf packages/email/dist
   npm run check:pre-push
   ```

## Recommended Future Improvements

1. **Standardize Package Exports**: Consider migrating @mcw/email to export TypeScript directly like other packages
2. **Or Build All Packages**: If compiled output is preferred, add build scripts to all packages
3. **Add Pre-Check**: Add a script that verifies all required dist folders exist before running checks
