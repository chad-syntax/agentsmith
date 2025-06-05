> [!WARNING]
> Agentsmith is currently in alpha. Changes are pushed frequently and may include breaking changes. If you encounter any issues, please reach out to support@agentsmith.app for assistance.

# @agentsmith/sdk

The Agentsmith SDK provides a type-safe way to interact with your AI agents and prompts. It enables you to:

- Fetch and compile prompts with full TypeScript type safety
- Execute prompts against various AI models through OpenRouter
- Manage prompt versions and variables
- Integrate AI capabilities into your applications with confidence

The SDK is designed to work seamlessly with the Agentsmith platform, ensuring that your prompts are always in sync and properly typed.

## Getting Started

### 1. Install the SDK

```sh
npm install @agentsmith/sdk
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
      npm link @agentsmith/sdk
      ```

    Now, your consuming project will use your local version of `@agentsmith/sdk`. Changes in the SDK (followed by a rebuild) will be reflected immediately.

### Unlinking the SDK

Once you're done with local development and testing, you might want to unlink the SDK to revert to using the version from npm.

1.  **In your consuming project:**

    ```sh
    npm unlink @agentsmith/sdk
    # Optionally, reinstall the package from npm if you were using a published version before linking
    # npm install @agentsmith/sdk
    ```

2.  **In the `agentsmith/sdk` directory (optional but good practice):**
    This removes the global link.
    ```sh
    npm unlink
    ```

This will remove the symbolic links and restore the normal package resolution.

## Roadmap

- [ ] Add token refreshing logic
- [ ] Add `fetchStrategy` option to force fetching from fs or db
- [ ] Add background check for latest prompts in db and hold in memory
- [ ] Add memoization for prompts to reduce calls to fs/db
- [ ] Reduce request blocking by enqueing log saving requests (background queue)
- [ ] Improved Error handling and logging
- [ ] Support streaming
- [ ] Support Tool Calling
