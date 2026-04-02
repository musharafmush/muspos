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

    const startServer = () => {
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });
    };

    // Handle server errors with better recovery
    server.on('error', async (error: any) => {
      console.error('❌ Server error:', error);

      // Robust EADDRINUSE handling
      if (error.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${port} is already in use.`);
        console.log(`📡 Attempting to clear port ${port} and restart...`);

        try {
          const { execSync } = await import('child_process');
          if (process.platform === 'linux') {
            console.log('🐧 Linux detected, using fuser -k...');
            execSync(`fuser -k ${port}/tcp`, { stdio: 'inherit' });
          } else if (process.platform === 'win32') {
            console.log('🪟 Windows detected, using taskkill...');
            try {
              const output = execSync(`netstat -ano | findstr :${port}`).toString();
              const pid = output.split(/\s+/).filter(Boolean).pop();
              if (pid && !isNaN(Number(pid))) {
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
              }
            } catch (netstatError) {
              console.log('💡 No existing process found to kill via netstat.');
            }
          }

          console.log('🔄 Port cleared. Restarting server in 2 seconds...');
          setTimeout(startServer, 2000);
        } catch (killError) {
          console.error('❌ Failed to automatically kill process:', (killError as Error).message);
          console.log(`💡 Manual fix: ${process.platform === 'linux' ? `sudo fuser -k ${port}/tcp` : `npx kill-port ${port}`}`);
          process.exit(1);
        }
        return;
      }

      // For other errors, log but don't necessarily exit
      console.error('Server encountered an error, but will attempt to stay alive if possible.');
    });

    startServer();

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', (error as Error).stack);
    process.exit(1);
  }
})();