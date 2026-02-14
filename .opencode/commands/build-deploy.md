---
description: Build SDK and update all test environments
agent: build
---

# Build and Deploy SDK to Test Environments

This command builds the SDK and copies it to all test environments (WordPress plugin and demo app).

## Step 1: Build the SDK

Run the build command:

```bash
npm run build
```

**Expected output**: Build should complete successfully and generate `dist/index.js`

**If build fails**: Report the error to the user and stop execution.

## Step 2: Copy to WordPress Plugin

Copy the built SDK to the WordPress plugin assets directory:

```bash
cp dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js
```

## Step 3: Copy to Demo Application

Copy the built SDK to the demo application:

```bash
cp dist/index.js demo/app/guiders-sdk.js
```

## Step 4: Verify

Confirm that all files were updated successfully:

```bash
ls -lh dist/index.js wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js demo/app/guiders-sdk.js
```

## Step 5: Report Success

Inform the user:

```
✅ SDK actualizado exitosamente en todos los entornos de prueba

📦 Archivos actualizados:
  • dist/index.js
  • wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.js
  • demo/app/guiders-sdk.js

🔄 Los cambios estarán disponibles después de recargar la página en:
  • WordPress: http://localhost:8090
  • Demo App: http://localhost:8083
```
