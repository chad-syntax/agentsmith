# Contributing to Agentsmith

## Rules

1. Only use named exports
2. All pages should have a single top level page component in page-components
3. All components should be in components folder either as a single file named after the component or in a subfolder named after the component
4. All functions should be declared in const rocket format: `const rocket = async (payload: any) => { ... }`
5. All props should be explicitly typed as `ComponentProps` and not typed inline ex: `props: { foo: any }` is bad `promps: ComponentProps` is good.
6. Only use icons from `@tabler/icons-react`
