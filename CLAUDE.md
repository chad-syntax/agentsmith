# CLAUDE.md - AgentSmith Development Guidelines

## Build and Test Commands
- **Development**: `npm run dev` - Start Next.js dev server
- **Build**: `npm run build` - Build the Next.js application
- **Start**: `npm run start` - Start production server
- **Test**: `npm run test` - Run all tests with Jest
- **Test (Watch)**: `npm run test:watch` - Run tests in watch mode
- **Test Single File**: `npm run test -- -t "test name"` or `npm run test -- path/to/file.test.ts`
- **Type Generation**: `npm run typegen` - Generate Supabase TypeScript types

## Code Style Guidelines
- **Components**: Use named exports only; default exports only for Next.js page files
- **Functions**: Declare with const arrow format: `const myFunc = (params: Type) => {}`
- **Types**: Always explicitly type props as separate types, not inline
- **File Structure**:
  - Components in `/components` folder with max 2 components per file
  - Page components in `/page-components`
- **Imports**: Use path aliases: `@/` for src, `&/` for lib, `~/` for root
- **Naming**: PascalCase for components, camelCase for functions, kebab-case for files
- **Icons**: Only use icons from `@tabler/icons-react`
- **Styling**: Only use Tailwind CSS, no custom CSS
- **SQL**: Lowercase syntax for queries, concise index declarations with `create index concurrently`
- **Error Handling**: Use try/catch with appropriate error logging

Always follow existing patterns in the codebase.
