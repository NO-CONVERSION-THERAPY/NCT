const http = require('node:http');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');

function clearProjectModules() {
  Object.keys(require.cache).forEach((modulePath) => {
    if (modulePath.startsWith(projectRoot)) {
      delete require.cache[modulePath];
    }
  });
}

function loadApp(envOverrides = {}) {
  const effectiveEnvOverrides = {
    MAINTENANCE_MODE: 'false',
    MAINTENANCE_NOTICE: '',
    MAP_DATA_NODE_TRANSPORT_OVERRIDES: 'false',
    FORM_ID: 'test-form-id',
    ...envOverrides
  };

  const originalValues = Object.fromEntries(
    Object.keys(effectiveEnvOverrides).map((key) => [key, process.env[key]])
  );

  Object.entries(effectiveEnvOverrides).forEach(([key, value]) => {
    process.env[key] = value;
  });

  clearProjectModules();
  const app = require(path.join(projectRoot, 'app/server'));

  Object.entries(originalValues).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });

  return app;
}

function loadAppWithPatchedFormService(envOverrides = {}, patchFormService) {
  const effectiveEnvOverrides = {
    MAINTENANCE_MODE: 'false',
    MAINTENANCE_NOTICE: '',
    MAP_DATA_NODE_TRANSPORT_OVERRIDES: 'false',
    FORM_ID: 'test-form-id',
    ...envOverrides
  };

  const originalValues = Object.fromEntries(
    Object.keys(effectiveEnvOverrides).map((key) => [key, process.env[key]])
  );

  Object.entries(effectiveEnvOverrides).forEach(([key, value]) => {
    process.env[key] = value;
  });

  clearProjectModules();
  const formService = require(path.join(projectRoot, 'app/services/formService'));
  const restorePatch = typeof patchFormService === 'function'
    ? patchFormService(formService)
    : null;
  const app = require(path.join(projectRoot, 'app/server'));

  Object.entries(originalValues).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });

  return {
    app,
    restore() {
      if (typeof restorePatch === 'function') {
        restorePatch();
      }
    }
  };
}

function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : 0;

      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        async close() {
          await new Promise((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }

              closeResolve();
            });
          });
        }
      });
    });

    server.on('error', reject);
  });
}

function requestPath(app, requestPath) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const request = http.request({
        hostname: '127.0.0.1',
        port,
        method: 'GET',
        path: requestPath
      }, (response) => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          server.close(() => {
            resolve({
              body,
              headers: response.headers,
              statusCode: response.statusCode
            });
          });
        });
      });

      request.on('error', (error) => {
        server.close(() => reject(error));
      });

      request.end();
    });
  });
}

module.exports = {
  clearProjectModules,
  loadApp,
  loadAppWithPatchedFormService,
  projectRoot,
  requestPath,
  startServer
};
