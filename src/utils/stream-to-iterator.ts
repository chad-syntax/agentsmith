import { OpenrouterStreamingResponse } from '@/lib/openrouter';
import { EventSourceParserStream } from 'eventsource-parser/stream';

export type OpenrouterStreamEvent = {
  type: 'message';
  data: OpenrouterStreamingResponse;
};

export type LogUuidEvent = {
  type: 'logUuid';
  data: {
    logUuid: string;
  };
};

export type StreamEvent = OpenrouterStreamEvent | LogUuidEvent;

export async function* streamToIterator<T extends StreamEvent>(
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
): AsyncGenerator<T, void, undefined> {
  const eventStream = stream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  const reader = eventStream.getReader();

  try {
    while (true) {
      const { done, value: event } = await reader.read();
      if (done) {
        break;
      }

      if (event.data === '[DONE]') {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        yield { type: event.event || 'message', data } as T;
      } catch (e) {
        console.error('Error parsing stream data', e);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
