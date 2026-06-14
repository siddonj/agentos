import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

function getVaultPath(): string {
  if (process.env.VAULT_ROOT) {
    return process.env.VAULT_ROOT
  }

  try {
    const configPath = join(process.cwd(), 'config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf-8'))
    return config.vaultRoot || 'c:\\users\\siddon\\Obsidian'
  } catch {
    return 'c:\\users\\siddon\\Obsidian'
  }
}

function readContextFile(filename: string): { content: string; lastModified: string } | null {
  try {
    const vaultRoot = getVaultPath()
    const filePath = join(vaultRoot, filename)

    const realPath = require('path').resolve(filePath)
    const realVault = require('path').resolve(vaultRoot)
    if (!realPath.startsWith(realVault)) {
      throw new Error('Path traversal detected')
    }

    const content = readFileSync(filePath, 'utf-8')
    const stats = require('fs').statSync(filePath)

    return {
      content,
      lastModified: stats.mtime.toISOString(),
    }
  } catch (error) {
    console.error(`Error reading context file ${filename}:`, error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const file = readContextFile('automation/agents.md')

    if (!file) {
      return NextResponse.json(
        {
          error: 'Context file not found: automation/agents.md',
          hint: 'Create vault/automation/agents.md in your Obsidian vault',
          vaultPath: getVaultPath(),
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      type: 'agents',
      description: 'Agent Team Definition',
      content: file.content,
      path: 'automation/agents.md',
      lastModified: file.lastModified,
      size: file.content.length,
    })
  } catch (error) {
    console.error('Error in context API:', error)
    return NextResponse.json(
      {
        error: 'Failed to read context',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
