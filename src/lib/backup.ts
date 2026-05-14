import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  includeData?: boolean;
}

/**
 * Create a PostgreSQL database backup
 */
export async function createBackup(options: BackupOptions = {}): Promise<{
  success: boolean;
  filePath?: string;
  size?: number;
  error?: string;
}> {
  const {
    outputDir = "./backups",
    compress = true,
    includeData = true,
  } = options;

  try {
    // Ensure backup directory exists
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dbName = process.env.DATABASE_URL?.split("/").pop()?.split("?")[0] || "smalllet";
    const filename = `smalllet_backup_${timestamp}.sql${compress ? ".gz" : ""}`;
    const filePath = path.join(outputDir, filename);

    // Extract connection details from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || "";
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!urlMatch) {
      return { success: false, error: "Invalid DATABASE_URL format" };
    }

    const [, user, password, host, port, database] = urlMatch;

    // Build pg_dump command
    const dumpCmd = compress
      ? `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --no-owner --no-acl | gzip > "${filePath}"`
      : `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --no-owner --no-acl > "${filePath}"`;

    await execAsync(dumpCmd);

    // Get file size
    const { stdout } = await execAsync(`stat -f%z "${filePath}" 2>/dev/null || stat -c%s "${filePath}"`);
    const size = parseInt(stdout.trim());

    // Create metadata file
    const metadata = {
      timestamp: new Date().toISOString(),
      database: database,
      compressed: compress,
      size,
      version: process.env.npm_package_version || "1.0.0",
    };
    await writeFile(
      `${filePath}.json`,
      JSON.stringify(metadata, null, 2)
    );

    return { success: true, filePath, size };
  } catch (error: any) {
    console.error("Backup failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Restore from a PostgreSQL backup
 */
export async function restoreBackup(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!urlMatch) {
      return { success: false, error: "Invalid DATABASE_URL format" };
    }

    const [, user, password, host, port, database] = urlMatch;

    const isCompressed = filePath.endsWith(".gz");
    const restoreCmd = isCompressed
      ? `gunzip -c "${filePath}" | PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database}`
      : `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database} < "${filePath}"`;

    await execAsync(restoreCmd);

    return { success: true };
  } catch (error: any) {
    console.error("Restore failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * List available backups
 */
export async function listBackups(backupDir = "./backups"): Promise<{
  backups: Array<{
    filename: string;
    path: string;
    size: number;
    createdAt: Date;
    compressed: boolean;
  }>;
}> {
  try {
    const { readdir, stat } = await import("fs/promises");

    if (!existsSync(backupDir)) {
      return { backups: [] };
    }

    const files = await readdir(backupDir);
    const backups = await Promise.all(
      files
        .filter((f) => f.endsWith(".sql") || f.endsWith(".sql.gz"))
        .map(async (filename) => {
          const filePath = path.join(backupDir, filename);
          const stats = await stat(filePath);
          return {
            filename,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            compressed: filename.endsWith(".gz"),
          };
        })
    );

    return { backups: backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) };
  } catch (error) {
    return { backups: [] };
  }
}
