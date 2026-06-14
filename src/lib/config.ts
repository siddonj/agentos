import path from 'path'
import { existsSync, readFileSync } from 'fs'

interface Config {
  vaultRoot: string
  databasePath: string
  dashboardPort: number
  appRoot: string
}

let config: Config | null = null

export function loadConfig(): Config {
  if (config) return config

  const configPath = path.join(process.cwd(), 'config.json')

  if (!existsSync(configPath)) {
    // Use defaults
    config = {
      vaultRoot: 'c:\\users\\siddon\\Obsidian',
      databasePath: path.join(process.cwd(), 'data', 'agent-os.db'),
      dashboardPort: 3737,
      appRoot: path.join(process.cwd(), '..')
    }
    return config
  }

  try {
    const configContent = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(configContent)
    config = {
      vaultRoot: parsed.vaultRoot || 'c:\\users\\siddon\\Obsidian',
      databasePath: parsed.databasePath || path.join(process.cwd(), 'data', 'agent-os.db'),
      dashboardPort: parsed.dashboardPort || 3737,
      appRoot: parsed.appRoot || path.join(process.cwd(), '..')
    }
  } catch (error) {
    console.error('Failed to parse config.json:', error)
    config = {
      vaultRoot: 'c:\\users\\siddon\\Obsidian',
      databasePath: path.join(process.cwd(), 'data', 'agent-os.db'),
      dashboardPort: 3737,
      appRoot: path.join(process.cwd(), '..')
    }
  }

  return config
}

export function getConfig(): Config {
  if (!config) {
    loadConfig()
  }
  return config!
}
