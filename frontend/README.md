# NSDO Task Management Frontend

This is the frontend for the NSDO Task Management system, built with React, Vite, Redux Toolkit, React Query, and Material-UI. It supports component-driven development with Storybook and automated CI/CD via GitHub Actions.

## Getting Started

### Install dependencies

```bash
npm install
```

### Development server

```bash
npm run dev
```

Runs the app in development mode at [http://localhost:5173](http://localhost:5173).

### Lint code

```bash
npm run lint
```

Checks code quality using ESLint.

### Run tests

```bash
npm test
```

Runs unit tests using Vitest.

### Build for production

```bash
npm run build
```

Builds the app for production in the `dist` folder.

### Storybook

```bash
npm run storybook
```

Starts Storybook for isolated UI component development at [http://localhost:6006](http://localhost:6006).

```bash
npm run build-storybook
```

Builds the static Storybook site.

## API Integration

- Uses **React Query** for data fetching, caching, and synchronization.
- API calls are centralized using Axios.
- Global error handling is supported via React Query.

## CI/CD

- Automated with **GitHub Actions**.
- Runs linting, tests, and build on every push and pull request.
- Enforces code quality before merging.

## Accessibility & Theming

- Designed with accessibility best practices (ARIA, focus management, contrast).
- Supports consistent theming.
- Dark/light mode toggle planned.

## Documentation

- UI components documented in Storybook.
- API contracts documented alongside services.
- Developer onboarding guide in progress.

## Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Query](https://react-query.tanstack.com/)
- [Storybook](https://storybook.js.org/)
