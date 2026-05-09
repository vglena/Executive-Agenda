/**
 * lib/ai/index.ts — Factory y re-exports del módulo LLM.
 *
 * Uso:
 *   import { getLLMAdapter } from '@/lib/ai'
 *   const llm = getLLMAdapter()   // OpenAIAdapter si hay API key, NullLLMAdapter si no
 *
 * Para cambiar de proveedor: crear una nueva clase que implemente LLMAdapter,
 * instanciarla aquí según una variable de entorno (ej. LLM_PROVIDER=anthropic).
 */

import type { LLMAdapter } from './types'
import { NullLLMAdapter } from './null.adapter'
import { OpenAIAdapter } from './openai.adapter'

export { NullLLMAdapter } from './null.adapter'
export { OpenAIAdapter } from './openai.adapter'
export type { LLMAdapter, TaskWithScore, SummaryContext } from './types'

/**
 * getLLMAdapter — devuelve el adaptador LLM activo.
 * - Con OPENAI_API_KEY → OpenAIAdapter
 * - Sin OPENAI_API_KEY → NullLLMAdapter (fallback determinista, sin llamadas externas)
 */
export function getLLMAdapter(): LLMAdapter {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIAdapter()
  }
  console.warn('[llm] OPENAI_API_KEY no configurada — usando NullLLMAdapter (fallback local)')
  return new NullLLMAdapter()
}
