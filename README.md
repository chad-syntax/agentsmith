> [!WARNING]
> Agentsmith is currently in alpha. Changes are pushed frequently and may include breaking changes. If you encounter any issues, please reach out to support@agentsmith.dev for assistance.

# Agentsmith

**Develop AI agents with peace of mind**

[![License](https://img.shields.io/badge/License-Apache_2.0-lightgrey.svg)](https://opensource.org/licenses/Apache-2.0)
[![Website](https://img.shields.io/badge/agentsmith.dev-brightgreen)](https://agentsmith.dev)
[![Plans & Pricing](https://img.shields.io/badge/Purchase-blueviolet)](https://agentsmith.dev/#pricing)
[![Roadmap](https://img.shields.io/badge/Roadmap-blue)](https://agentsmith.dev/roadmap)
[![Docs](https://img.shields.io/badge/Docs-white)](https://agentsmith.dev/docs)

## Documentation

You can find more comprehensive documentation pages, reference, and more at [agentsmith.dev/docs](https://agentsmith.dev/docs)

## SDK

The Agentsmith SDK allows you to easily integrate your AI agents into your applications.
For detailed SDK documentation and usage examples, please refer to the [SDK Documentation](https://agentsmith.dev/docs/sdk), or the [SDK Readme](ts-sdk/README.md)

## Overview

Agentsmith is a Prompt CMS app for building, testing, and deploying LLM prompts with confidence. Our intuitive prompt authoring tools, seamless GitHub synchronization, and type-safe SDK make AI development accessible to both technical and non-technical users while ensuring reliability and maintainability in production environments.

## Features

- ✨ **Exceptional Prompt Authoring** - Intuitive prompt engineering tools with variables and versioning support
- 🔄 **Seamless GitHub Synchronization** - Sync prompt versions and content to your repository via Pull Requests
- 🛡️ **Type-Safe SDK** - Fully-typed TypeScript SDK (Python coming soon!) prevent erroneous prompt modifications
- ↔️ **Provider Switching** - Effortlessly switch between AI providers and models using OpenRouter
- 🌍 **Open Source** - Community-driven development with full transparency
- 🧪 **Test & Refine** - Test prompts with different models and inputs for optimal performance
- 🚀 **Deploy & Scale** - Production-ready deployment with flexible infrastructure

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with GitHub OAuth
- **UI Components**: Radix UI, shadcn/ui, Lucide React
- **AI Integration**: OpenRouter API for multi-provider support
- **GitHub Integration**: GitHub App with Octokit
- **Testing**: Jest with TypeScript support
- **Deployment**: Vercel-ready with Supabase integration
- **SDK**: Agentsmith TypeScript SDK (Python coming soon!)

## Contributing

We welcome contributions from the community! Here's how to get started:

1. **Fork the repository** and create a feature branch
2. **Make your changes** following our coding standards
3. **Write tests** for new functionality
4. **Run the test suite** to ensure everything works
5. **Submit a pull request** with a clear description

### Development Guidelines

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Write tests for new features and bug fixes
- Keep PRs focused and atomic
- Update documentation as needed

### Code Style

- Use Prettier for code formatting
- Follow the existing naming conventions
- Prefer named exports over default exports (except for Next.js pages)
- Use path aliases (`@/`, `&/`, `~/`) for imports

## Support

- **General Questions**: [team@agentsmith.dev](mailto:team@agentsmith.dev)
- **Technical Support**: [support@agentsmith.dev](mailto:support@agentsmith.dev)
- **Bug Reports**: [GitHub Issues](https://github.com/chad-syntax/agentsmith/issues)
- **Feature Requests**: [Agentsmith Roadmap](https://agentsmith.dev/roadmap)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Roadmap

We're constantly improving Agentsmith! Check out our public roadmap to see what's coming next and vote on features you'd like to see.

[View Roadmap 🗓](https://agentsmith.dev/roadmap)
