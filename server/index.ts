import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { initializeDatabase } from "../db/sqlite-migrate";
import labelPrintingRoutes from "./label-printing-routes.js";
// Sequential ID support enabled.
import { sqlite } from "../db/sqlite-index.js";


const app = express();
console.log('🚩 Checkpoint 1: Express initialized');
// Parse JSON with appropriate limits for backup files (reduced to prevent memory issues)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
console.log('🚩 Checkpoint 2: Middleware configured');

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

console.log('🚩 Checkpoint 3: Entering async block');
(async () => {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    const server = await registerRoutes(app);

    // Register dedicated Label Printing Routes before Vite setup
    app.use("/api", labelPrintingRoutes);

    // Add global error handlers to prevent server crashes
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error('Stack:', error.stack);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Add general error handler middleware
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('❌ Express Error:', err);

      if (res.headersSent) {
        return next(err);
      }

      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5004
    const port = Number(process.env.PORT) || 5004;
    let retryCount = 0;
    const maxRetries = 5;

    const startServer = () => {
      console.log(`🚀 [PID:${process.pid}] Attempting to start server on port ${port}... (Attempt ${retryCount + 1})`);
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
        retryCount = 0; // Reset on success
      });
    };

    // Handle server errors with better recovery
    server.on('error', async (error: any) => {
      console.error(`❌ [PID:${process.pid}] Server error:`, error);

      // Robust EADDRINUSE handling
      if (error.code === 'EADDRINUSE') {
        if (retryCount >= maxRetries) {
           console.error(`🛑 [PID:${process.pid}] Failed to bind to port ${port} after ${maxRetries} attempts. Giving up.`);
           process.exit(1);
        }
        
        retryCount++;
        console.warn(`⚠️ [PID:${process.pid}] Port ${port} is currently taken.`);
        
        try {
          const { execSync } = await import('child_process');
          if (process.platform === 'linux') {
            console.log(`🔍 [PID:${process.pid}] Linux: Checking what is using port ${port}...`);
            try {
              const info = execSync(`lsof -i :${port} -sTCP:LISTEN -t`).toString().trim();
              if (info) {
                console.log(`🗡️ [PID:${process.pid}] Found process(es) ${info} on port ${port}. Sending SIGKILL...`);
                execSync(`kill -9 ${info}`, { stdio: 'inherit' });
              } else {
                console.log(`❓ [PID:${process.pid}] Port ${port} seems busy but lsof found no PID. Trying fuser...`);
                execSync(`fuser -k ${port}/tcp`, { stdio: 'inherit' });
              }
            } catch (e) {
              console.log(`⚠️ [PID:${process.pid}] lsof/fuser check failed or no process found. Using fuser -k as fallback...`);
              try { execSync(`fuser -k ${port}/tcp`, { stdio: 'inherit' }); } catch(f) {}
            }
          } else if (process.platform === 'win32') {
            console.log(`🔍 [PID:${process.pid}] Windows: Clearing port ${port}...`);
            try {
              const output = execSync(`netstat -ano | findstr :${port}`).toString();
              const pids = output.split('\n').map(l => l.trim().split(/\s+/).pop()).filter(p => p && !isNaN(Number(p)));
              const uniquePids = [...new Set(pids)];
              for (const pid of uniquePids) {
                if (pid && pid !== process.pid.toString()) {
                  console.log(`🗡️ Killing PID: ${pid}`);
                  execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
                }
              }
            } catch (netstatError) {
              console.log('💡 No existing process found to kill via netstat.');
            }
          }

          const delay = 3000 * retryCount;
          console.log(`🔄 [PID:${process.pid}] Waiting ${delay/1000}s for port to release before retry...`);
          setTimeout(startServer, delay);
        } catch (killError) {
          console.error(`❌ [PID:${process.pid}] Failed to automatically clear port:`, (killError as Error).message);
          console.log(`💡 Manual fix: run 'sudo fuser -k ${port}/tcp'`);
          process.exit(1);
        }
        return;
      }

      console.error('Server encountered an error, but will attempt to stay alive if possible.');
    });

    startServer();

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', (error as Error).stack);
    process.exit(1);
  }
})();