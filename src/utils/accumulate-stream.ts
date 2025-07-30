import merge from 'lodash.merge';
import { OpenrouterStreamEvent } from './stream-to-iterator';
import {
  OpenrouterNonStreamingResponse,
  OpenrouterStreamingResponse,
  ToolCall,
} from '@/lib/openrouter';

// need to add non-chat stream suppport

export const accumulateChatStreamToCompletion = async (
  stream: AsyncIterable<OpenrouterStreamEvent>,
) => {
  let accumulatedCompletion: Partial<OpenrouterStreamingResponse> = {};
  let content = '';
  let reasoning = '';
  const toolCalls: ToolCall[] = [];

  for await (const event of stream) {
    const chunk = event.data;
    // usage chunk contains null stop values we don't want to merge
    if (chunk.usage) {
      accumulatedCompletion.usage = merge(accumulatedCompletion.usage, chunk.usage);
    } else if (chunk.choices) {
      content += chunk.choices[0].delta.content ?? '';
      if (chunk.choices[0].delta.reasoning) {
        reasoning += chunk.choices[0].delta.reasoning;
      }
      if (chunk.choices[0].delta.tool_calls) {
        toolCalls.push(...chunk.choices[0].delta.tool_calls);
      }
      accumulatedCompletion = merge(accumulatedCompletion, chunk);
    }
  }

  const completion: OpenrouterNonStreamingResponse = {
    id: accumulatedCompletion.id ?? '',
    created: accumulatedCompletion.created ?? 0,
    model: accumulatedCompletion.model ?? '',
    provider: accumulatedCompletion.provider ?? '',
    object: 'chat.completion',
    choices: (accumulatedCompletion.choices ?? []).map(({ delta, ...choice }) => ({
      ...choice,
      message: {
        content,
        role: delta.role ?? 'assistant',
        ...(reasoning ? { reasoning } : {}),
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      },
    })),
    usage: accumulatedCompletion.usage,
  };

  return completion;
};
