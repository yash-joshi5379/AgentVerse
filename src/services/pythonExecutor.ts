/**
 * Python Script Executor Service
 * 
 * Executes Python scripts and returns parsed JSON output.
 * Used to run the FindMyFood collaborative filtering algorithm.
 */

import { spawn } from 'child_process';
import path from 'path';

export interface PythonExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Execute a Python script and return parsed JSON output
 */
export async function executePythonScript<T>(
  scriptPath: string,
  args: string[] = [],
  cwd?: string
): Promise<PythonExecutionResult<T>> {
  return new Promise((resolve) => {
    try {
      const python = spawn('python', [scriptPath, ...args], {
        cwd: cwd || path.dirname(scriptPath),
        env: process.env,
      });

      let stdoutData = '';
      let stderrData = '';

      python.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', stderrData);
          resolve({
            success: false,
            error: `Python script exited with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const jsonData = JSON.parse(stdoutData);
          resolve({
            success: true,
            data: jsonData,
          });
        } catch (parseError) {
          console.error('Failed to parse Python output:', stdoutData);
          resolve({
            success: false,
            error: `Failed to parse JSON: ${parseError}`,
          });
        }
      });

      python.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        resolve({
          success: false,
          error: `Failed to execute Python script: ${error.message}`,
        });
      });
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

