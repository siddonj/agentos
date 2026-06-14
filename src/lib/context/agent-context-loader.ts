export interface AgentContext {
  business: string
  agents: string
  tools: string
  loadedAt: Date
}

export async function loadAgentContext(): Promise<AgentContext> {
  try {
    const response = await fetch('/api/context/read')

    if (!response.ok) {
      throw new Error(`Failed to load context: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      business: data.data.business || '',
      agents: data.data.agents || '',
      tools: data.data.tools || '',
      loadedAt: new Date(),
    }
  } catch (error) {
    console.error('Error loading agent context:', error)
    throw new Error(`Cannot load agent context: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function createContextualSystemPrompt(basePrompt: string, context: AgentContext): string {
  return `${basePrompt}

---
BUSINESS CONTEXT (Read this first, then proceed with the task above):

## Your Business
${context.business}

## Your Agent Team
${context.agents}

## Available Tools
${context.tools}

---
Now proceed with the task, ensuring all work aligns with the business context above.
`
}

export async function getBusinessContext(): Promise<string> {
  try {
    const response = await fetch('/api/context/business')
    if (!response.ok) throw new Error(`Failed to fetch business context`)
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error('Error loading business context:', error)
    return ''
  }
}

export async function getAgentTeamContext(): Promise<string> {
  try {
    const response = await fetch('/api/context/agents')
    if (!response.ok) throw new Error(`Failed to fetch agents context`)
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error('Error loading agent team context:', error)
    return ''
  }
}

export async function getToolsContext(): Promise<string> {
  try {
    const response = await fetch('/api/context/tools')
    if (!response.ok) throw new Error(`Failed to fetch tools context`)
    const data = await response.json()
    return data.content
  } catch (error) {
    console.error('Error loading tools context:', error)
    return ''
  }
}
