> [!WARNING]
> Agentsmith is currently in alpha. Changes are pushed frequently and may include breaking changes. If you encounter any issues, please reach out to support@agentsmith.app for assistance.

# Agentsmith

**Develop AI agents with peace of mind**

[![License](https://img.shields.io/badge/License-Apache_2.0-lightgrey.svg)](https://opensource.org/licenses/Apache-2.0)
[![Website](https://img.shields.io/badge/agentsmith.app-brightgreen)](https://agentsmith.app)
[![Plans & Pricing](https://img.shields.io/badge/Join%20Alpha%20Club-blueviolet)](https://agentsmith.app/#pricing)
[![Roadmap](https://img.shields.io/badge/Roadmap-blue)](https://agentsmith.app/roadmap)

## Overview

Agentsmith is an agent development platform for building, testing, and deploying AI agents with confidence. Our intuitive prompt authoring tools, seamless GitHub synchronization, and type-safe SDK make AI development accessible to both technical and non-technical users while ensuring reliability and maintainability in production environments.

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

## SDK

The Agentsmith SDK allows you to easily integrate your AI agents into your applications.
For detailed SDK documentation and usage examples, please refer to our [SDK Documentation](ts-sdk/README.md).

## Documentation

As Agentsmith is currently in alpha, we do not have dedicated documentation pages available yet. We are working hard to build out comprehensive guides and references.

### Self-Hosting

Guidance and detailed documentation for self-hosting Agentsmith are also under development and will be released as we move out of the alpha phase. For now, the setup instructions below are primarily targeted towards development and contributions.

## Getting Started (Development)

### Prerequisites

- Node.js 22+ and npm
- Git
- Supabase account
- GitHub account (for GitHub App setup)

### 1. Clone the Repository

```bash
git clone https://github.com/chad-syntax/agentsmith.git
cd agentsmith
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# GitHub App Configuration
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY=your_github_app_private_key_base64
GITHUB_APP_WEBHOOK_SECRET=your_github_app_webhook_secret
GITHUB_APP_NAME=your_github_app_name
SMEE_WEBHOOK_PROXY_URL=your_smee_channel_url

# GitHub OAuth (for Supabase Auth)
SUPABASE_AUTH_GITHUB_CLIENT_ID=your_github_oauth_client_id
SUPABASE_AUTH_GITHUB_SECRET=your_github_oauth_client_secret

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host

# Optional: Cloudflare Turnstile (for anonymous email submission)
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key
```

### 4. Start Development Server

```bash
npm run dev
```

Your application will be available at `http://localhost:3000`.

### 5. Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test
npm run test -- path/to/test.test.ts
```

## Environment Variables

| Variable                                    | Description                                | Where to Get                                         |
| ------------------------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                  | Your Supabase project URL                  | Supabase Dashboard > Settings > API                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`             | Supabase anonymous/public key              | Supabase Dashboard > Settings > API                  |
| `SUPABASE_JWT_SECRET`                       | Supabase JWT secret for signing tokens     | Supabase Dashboard > Settings > API > JWT Secret     |
| `GITHUB_APP_ID`                             | GitHub App ID                              | GitHub > Settings > Developer settings > GitHub Apps |
| `GITHUB_APP_PRIVATE_KEY`                    | GitHub App private key (base64 encoded)    | Generated when creating GitHub App                   |
| `GITHUB_APP_WEBHOOK_SECRET`                 | GitHub App webhook secret                  | Set when creating GitHub App                         |
| `GITHUB_APP_NAME`                           | GitHub App name/slug                       | GitHub App settings                                  |
| `SMEE_WEBHOOK_PROXY_URL`                    | (Local Dev Only) Your Smee.io channel URL  | Create a channel at [smee.io](https://smee.io/)      |
| `SUPABASE_AUTH_GITHUB_CLIENT_ID`            | GitHub OAuth App Client ID                 | GitHub App settings                                  |
| `SUPABASE_AUTH_GITHUB_SECRET`               | GitHub OAuth App Client Secret             | GitHub App settings                                  |
| `NEXT_PUBLIC_SITE_URL`                      | Your site URL                              | `http://localhost:3000` for local development        |
| `NEXT_PUBLIC_POSTHOG_KEY`                   | (Optional) PostHog key for analytics       | PostHog Project Settings                             |
| `NEXT_PUBLIC_POSTHOG_HOST`                  | (Optional) PostHog host for analytics      | PostHog Project Settings                             |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | (Optional) Cloudflare Turnstile Site Key   | Cloudflare Dashboard > Turnstile                     |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY`           | (Optional) Cloudflare Turnstile Secret Key | Cloudflare Dashboard > Turnstile                     |

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

### 2. Get API Keys

1. Navigate to Settings > API in your Supabase dashboard
2. Copy the Project URL and anon/public key to your `.env.local`
3. Copy the jwt secret into your `.env.local` this is used for the `github_webhook` service role

### 3. Set Up Database Schema

The project includes migration files in `/supabase/migrations/`.

To apply the migrations, use the Supabase CLI:

```bash
# Install Supabase CLI (if you haven't already)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if you haven't already)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 4. Configure Authentication

1. In Supabase Dashboard > Authentication > Settings
2. Add your site URL to "Site URL" field
3. Add redirect URLs for OAuth (see GitHub App Setup section)

### 5. Running Supabase Locally

You can instead run supabase locally by installing the supabase cli and running

```sh
supabase start
```

This command will then output the environment variables you need to supply in your `.env.local`

## GitHub App Setup

Agentsmith requires a GitHub App for repository synchronization and OAuth authentication.

### 1. Create a GitHub App

1. Go to GitHub > Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the following:
   - **GitHub App name**: Choose a unique name
   - **Homepage URL**: `https://agentsmith.app` (or your domain)
   - **Setup URL**: `https://your-domain.com/github/setup` (use `http://localhost:3000/github/setup` for local development)
   - **Webhook URL**:
     - For **production**: `https://your-domain.com/api/github/webhook`
     - For **local development**: Use a webhook proxy service like [smee.io](https://smee.io/).
       1. Go to [smee.io](https://smee.io/) and create a new channel.
       2. Use the generated Smee channel URL (e.g., `https://smee.io/your-unique-channel`) as the Webhook URL in your GitHub App settings.
       3. Set `SMEE_WEBHOOK_PROXY_URL` in your `.env.local` to the smee channel url
       4. Start the local Smee client to forward these webhooks to your local server by running: `npm run smee-proxy:start` (this will typically forward to `http://localhost:3000/api/github/webhook` or as configured in your `smee-proxy` script).
   - **Webhook secret**: Generate a secure random string

### 2. Set Permissions

Configure the following repository permissions:

- **Contents**: Read & Write
- **Metadata**: Read-only
- **Pull requests**: Read & Write
- **Issues**: Read & Write
- **Account Permissions**: Read-only (for email address)

### 3. Subscribe to Events

- Push
- Pull request

### 4. Generate Private Key

1. Scroll down to "Private keys" section
2. Click "Generate a private key"
3. Download the `.pem` file
4. Convert to base64: `base64 -i path/to/your-key.pem`
5. Add the base64 string to your environment variables

### 5. Configure OAuth Credentials (within the GitHub App)

1. In your GitHub App's settings page, navigate to the OAuth settings or client secrets section.
2. Generate a new client secret.
3. Copy the "Client ID" and the newly generated "Client Secret".
4. Add these to your Supabase project's GitHub auth provider settings and to your `.env.local` file as `SUPABASE_AUTH_GITHUB_CLIENT_ID` and `SUPABASE_AUTH_GITHUB_SECRET` respectively.
5. Ensure the "Authorization callback URL" in your GitHub App's OAuth settings points to your Supabase callback URL: `https://your-supabase-project-ref.supabase.co/auth/v1/callback`.

## Core Concepts

### Prompt Management

- **Prompts**: Template-based AI prompts with variable support
- **Versions**: Prompt versions that can be updated, with semantic versioning
- **Variables**: Dynamic placeholders in prompts for runtime substitution

### Organization & Projects

- **Organizations**: Top-level entities for team collaboration
- **Projects**: Containers for related prompts and configurations
- **GitHub Integration**: Sync prompts to repositories via Pull Requests

### Type Safety

- **Generated Types**: Automatic TypeScript type generation from Supabase schema
- **SDK Integration**: Fully-typed SDK prevents runtime prompt errors
- **Template Compilation**: Compile-time validation of prompt templates

### AI Provider Integration

- **OpenRouter**: Multi-provider AI model access
- **Model Switching**: Runtime provider/model switching without code changes
- **Cost Optimization**: Choose optimal models based on use case and budget

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

## Alpha Club ✨

**Get early access to Agentsmith!**

Join our Alpha Club to receive early access to new features and provide feedback that shapes the future of the platform. Alpha Club members get:

- ⭐ Immediate access to all features
- 💰 50% off yearly pricing when we launch
- 🗣️ Direct feedback channel with our team
- ⭐ Priority support and feature requests

[Join the Alpha Club ✨](https://agentsmith.app/#pricing)

## Support

- **General Questions**: [team@agentsmith.app](mailto:team@agentsmith.app)
- **Technical Support**: [support@agentsmith.app](mailto:support@agentsmith.app)
- **Bug Reports**: [GitHub Issues](https://github.com/your-username/agentsmith/issues)
- **Feature Requests**: [Agentsmith Roadmap](https://agentsmith.app/roadmap)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Roadmap

We're constantly improving Agentsmith! Check out our public roadmap to see what's coming next and vote on features you'd like to see.

[View Roadmap 🗓](https://agentsmith.app/roadmap)
