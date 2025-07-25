> [!WARNING]
> Agentsmith is currently in alpha. Changes are pushed frequently and may include breaking changes. If you encounter any issues, please reach out to support@agentsmith.dev for assistance.

# @agentsmith-app/sdk

The Agentsmith SDK provides a type-safe way to interact with your AI agents and prompts. It enables you to:

- Fetch and compile prompts with full TypeScript type safety
- Execute prompts against various AI models through OpenRouter
- Integrate AI capabilities into your applications with confidence

The SDK is designed to work seamlessly with the Agentsmith platform, ensuring that your prompts are always in sync and properly typed.

## Getting Started

### 1. Install the SDK

```sh
npm install @agentsmith-app/sdk
```

### 2. Initialize the SDK in your code

```ts
// import the generated types (default location is in the agentsmith folder after sync)
import { Agency } from '../agentsmith/agentsmith.types';

const sdkApiKey = 'sdk_********************************'; // copy from your project page/organization settings page
const projectId = '123456-abcde-7890-fghij-klmnopqrstuv'; // copy from your project page

const client = new AgentsmithClient<Agency>(sdkApiKey, projectId);
```

### 3. Fetch your prompts

```ts
// pass in the slug, or a string in `slug@version` format
const helloWorldLatest = await client.getPrompt('hello-world');
const helloWorldLatestAlt = await client.getPrompt('hello-world@latest');
const helloWorld0dot0dot1 = await client.getPrompt('hello-world@0.0.1');
```

### 4. Compile or Execute your prompts

```ts
const helloWorldPrompt = await client.getPrompt('hello-world');

// variable typing enforced
const { compiledPrompt, finalVariables } = helloWorldPrompt.compile({
  firstName: 'John',
  lastName: 'Doe',
});

console.log('Compiled prompt:', compiledPrompt);
console.log('Final Variables prompt compiled with:' finalVariables);

// variable typing enforces
const { completion } = await helloWorldPrompt.execute({
  firstName: 'John',
  lastName: 'Doe,
});

console.log('Completion', completion); // LLM response
```

### 5. Customize compilation or execution

```ts
const helloWorldPrompt = await client.getPrompt('hello-world');

// Override global context variables during compilation
const { compiledPrompt } = await helloWorldPrompt.compile(
  { firstName: 'John', lastName: 'Doe' },
  {
    globals: {
      companyName: 'Acme Corp', // Override global context variable
      environment: 'production',
    },
  },
);

// Override both global context and model config during execution
const { completion } = await helloWorldPrompt.execute(
  { firstName: 'John', lastName: 'Doe' },
  {
    globals: {
      companyName: 'Acme Corp',
      environment: 'production',
    },
    config: {
      temperature: 0.7,
      model: 'x-ai/grok-3-mini-beta',
    },
  },
);
```

The config object you pass extends the prompt config object defined in the studio.
You can pass whatever values are supported by [OpenRouter's API](https://openrouter.ai/docs/api-reference/overview):

### 6. Shutdown the client when finished

**Important:** Always call `shutdown()` when your application is done using the SDK to prevent scripts from hanging:

```ts
const client = new AgentsmithClient<Agency>(sdkApiKey, projectId);

// Your application logic...
const helloWorldPrompt = await client.getPrompt('hello-world');
const { content } = await helloWorldPrompt.execute({
  firstName: 'John',
  lastName: 'Doe',
});

console.log('Response:', content);

// Shutdown the client before exiting
await client.shutdown();
```

Without calling `shutdown()`, your Node.js process may hang indefinitely due to:

- Background HTTP connections staying open
- Internal processing queues waiting for more work
- JWT refresh timers continuing to run

This is especially important in:

- CLI tools and scripts
- Serverless functions
- Applications that process requests and exit

## Advanced Usage

### Client configuration

The `AgentsmithClient` constructor accepts an optional third parameter with advanced configuration options:

```ts
import { Agency } from '../agentsmith/agentsmith.types';

const client = new AgentsmithClient<Agency>(
  'sdk_********************************', // API key
  '123456-abcde-7890-fghij-klmnopqrstuv', // Project ID
  {
    // Configuration options
    fetchStrategy: 'remote-fallback',
    logLevel: 'warn',
    agentsmithDirectory: './custom-agentsmith-folder',
    logger: customLogger,
    queueOptions: { concurrency: 5 },
  },
);
```

#### Available configuration options

**`fetchStrategy`** - Controls how prompts and globals are fetched:

- `'remote-fallback'` (default) - Try filesystem first, fallback to remote API
- `'fs-fallback'` - Try remote API first, fallback to filesystem
- `'remote-only'` - Always fetch from remote API, fail if unavailable
- `'fs-only'` - Always fetch from filesystem, fail if files don't exist

**`logLevel`** - Controls SDK logging verbosity:

- `'debug'` - Show all logs including debug information
- `'info'` - Show info, warnings, and errors
- `'warn'` (default) - Show warnings and errors only
- `'error'` - Show errors only
- `'silent'` - No logging output

**`logger`** - Custom logger implementation (optional):

```ts
const customLogger = {
  debug: (message: string, ...args: any[]) => myLogger.debug(message, args),
  info: (message: string, ...args: any[]) => myLogger.info(message, args),
  warn: (message: string, ...args: any[]) => myLogger.warn(message, args),
  error: (message: string, ...args: any[]) => myLogger.error(message, args),
};
```

**`agentsmithDirectory`** - Path to your agentsmith folder (default: `'./agentsmith'`)

**`queueOptions`** - Options for the internal processing queue (uses [p-queue](https://github.com/sindresorhus/p-queue)):

```ts
queueOptions: {
  concurrency: 3,     // Number of concurrent operations
  interval: 1000,     // Minimum time between operations
  intervalCap: 10,    // Max operations per interval
}
```

**`agentsmithApiRoot`**, **`supabaseUrl`**, **`supabaseAnonKey`** - Override default API endpoints (typically only needed for self-hosted instances)

#### Graceful shutdown

When your application is shutting down, call the `shutdown()` method to ensure all background operations complete gracefully:

```ts
const client = new AgentsmithClient<Agency>(apiKey, projectId);

// Your application code...
await client.getPrompt('hello-world').execute({ name: 'John' });

// Before exiting your application
await client.shutdown();
```

The `shutdown()` method will:

- Cancel any ongoing HTTP requests
- Wait for all queued operations (like log saving) to complete
- Clean up timers and connections
- Allow your application to exit cleanly

This is especially important in serverless environments or when processing multiple requests concurrently.

### Execute method return values

The SDK's `execute` method returns different fields depending on whether you're using streaming or non-streaming execution. You can destructure these fields to access specific parts of the response:

### Non-streaming execution

```ts
const helloWorldPrompt = await client.getPrompt('hello-world');

// Access the content directly without diving into completion.choices[0].message.content
const { content } = await helloWorldPrompt.execute({
  firstName: 'John',
  lastName: 'Doe',
});

console.log('AI Response:', content);

// Access the full OpenRouter response object for additional metadata
const { completion, response } = await helloWorldPrompt.execute({
  firstName: 'John',
  lastName: 'Doe',
});

console.log('Full completion:', completion);
console.log('HTTP response status:', response.status);
console.log('Usage info:', completion.usage);

// Access the compiled prompt and variables that were used in execution
const { compiledPrompt, finalVariables } = await helloWorldPrompt.execute({
  firstName: 'John',
  lastName: 'Doe',
});

console.log('Compiled prompt sent to LLM:', compiledPrompt);
console.log('Final variables used:', finalVariables);
```

### Streaming execution

```ts
const helloWorldPrompt = await client.getPrompt('hello-world');

// Stream tokens as they arrive
const { tokens } = await helloWorldPrompt.execute(
  { firstName: 'John', lastName: 'Doe' },
  { config: { stream: true } },
);

// Simple token streaming
for await (const token of tokens) {
  if (token) {
    process.stdout.write(token);
  }
}

// Access the raw SSE stream for more control
const { stream } = await helloWorldPrompt.execute(
  { firstName: 'John', lastName: 'Doe' },
  { config: { stream: true } },
);

// Process parsed SSE events
for await (const event of stream) {
  // Each event contains parsed data from the SSE stream
  if (event.data?.choices?.[0]?.delta?.content) {
    process.stdout.write(event.data.choices[0].delta.content);
  }

  // Handle usage information when streaming completes
  if (event.data?.usage) {
    console.log('\nUsage:', event.data.usage);
  }
}

// Access other fields like the HTTP response and compiled prompt
const { response, compiledPrompt, finalVariables } = await helloWorldPrompt.execute(
  { firstName: 'John', lastName: 'Doe' },
  { config: { stream: true } },
);

console.log('HTTP response headers:', response.headers);
console.log('Compiled prompt:', compiledPrompt);
console.log('Variables used:', finalVariables);
```

### Custom message arrays

By default, `execute` compiles your prompt and sends it as a single user message. For advanced use cases, you can compile the prompt separately and create your own message array:

```ts
const helloWorldPrompt = await client.getPrompt('hello-world');

// First, compile the prompt to get the final content
const { compiledPrompt } = await helloWorldPrompt.compile({
  firstName: 'John',
  lastName: 'Doe',
});

// Create a custom messages array for multi-turn conversations
const customMessages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello, I need help with something.' },
  { role: 'assistant', content: 'Of course! How can I assist you today?' },
  { role: 'user', content: compiledPrompt }, // Use your compiled prompt
];

// Execute with custom messages array
const { completion } = await helloWorldPrompt.execute(
  { firstName: 'John', lastName: 'Doe' },
  {
    config: {
      messages: customMessages, // Override the default single-message behavior
      temperature: 0.7,
    },
  },
);

console.log('Multi-turn response:', completion.choices[0].message.content);
```

This is particularly useful for:

- Building multi-turn conversations
- Adding system prompts or context
- Creating few-shot examples with assistant responses
- Implementing conversation flows where your compiled prompt is just one part of a larger exchange

### Available return fields

**Non-streaming execution** returns:

- `content` - The AI response content (shortcut for `completion.choices[0].message.content`)
- `reasoning` - The AI response reasoning content (shortcut for `completion.choices[0].message.reasoning`)
- `toolCalls` - The AI response tool calls
- `completion` - Full OpenRouter completion object with choices, usage, etc.
- `response` - Raw HTTP Response object
- `compiledPrompt` - The final prompt sent to the LLM
- `finalVariables` - Variables used in compilation (includes defaults and globals)
- `logUuid` - UUID of the log entry created for this execution

**Streaming execution** returns:

- `tokens` - AsyncGenerator that yields content tokens as strings
- `reasoningTokens` - AsyncGenerator that yields reasoning tokens as strings
- `toolCalls` - AsyncGenerator that yields tool calls
- `completion` - A Promise of the final completion data in NonStreamingResponse format
- `stream` - Raw SSE stream as an AsyncIterable of parsed events
- `response` - Raw HTTP Response object
- `compiledPrompt` - The final prompt sent to the LLM
- `finalVariables` - Variables used in compilation (includes defaults and globals)
- `logUuid` - UUID of the log entry created for this execution

## Development

1.  **Install dependencies**

    Navigate to the `sdk` directory and install the necessary dependencies:

    ```sh
    cd sdk
    npm install
    ```

2.  **Build the SDK**

    Run the build command which will build esm, cjs, and dts files into the `sdk/dist` directory

    ```sh
    npm run build
    ```

3.  **Link the SDK**

    To test local changes in a consuming project without publishing to npm, use `npm link`:

    - **In the `sdk` directory:**
      Create a global symbolic link.

      ```sh
      npm link
      ```

      Remember to rebuild the SDK (step 2) after making changes.

    - **In your consuming project:**
      Link the globally created symbolic link to your project's `node_modules` directory.
      ```sh
      npm link @agentsmith-app/sdk
      ```

    Now, your consuming project will use your local version of `@agentsmith-app/sdk`. Changes in the SDK (followed by a rebuild) will be reflected immediately.

### Unlinking the SDK

Once you're done with local development and testing, you might want to unlink the SDK to revert to using the version from npm.

1.  **In your consuming project:**

    ```sh
    npm unlink @agentsmith-app/sdk
    # Optionally, reinstall the package from npm if you were using a published version before linking
    # npm install @agentsmith-app/sdk
    ```

2.  **In the `agentsmith/sdk` directory (optional but good practice):**
    This removes the global link.
    ```sh
    npm unlink
    ```

This will remove the symbolic links and restore the normal package resolution.

## Roadmap

- [ ] Add background check for latest prompts in db and hold in memory
- [ ] Add memoization for prompts to reduce calls to fs/db
