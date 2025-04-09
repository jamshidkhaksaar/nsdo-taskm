# NSDO Task Management Frontend - Developer Onboarding Guide

Welcome to the NSDO Task Management frontend project! This guide will help you get started quickly and follow best practices.

## Prerequisites

- Node.js 18+
- npm 8+
- Git
- Access to the project repository

## Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-org/nsdo-taskm.git
cd nsdo-taskm/frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

4. **Run Storybook**

```bash
npm run storybook
```

Visit [http://localhost:6006](http://localhost:6006).

## Code Quality

- **Lint code:** `npm run lint`
- **Run tests:** `npm test`
- **Build app:** `npm run build`

CI/CD will enforce linting, testing, and building on pull requests.

## Branching Strategy

- `main`: Production-ready code
- `develop`: Latest development changes
- Feature branches: `feature/your-feature`
- Bugfix branches: `bugfix/your-bugfix`

## Making Changes

1. Create a new branch from `develop`.
2. Make your changes.
3. Run lint and tests locally.
4. Commit with clear messages.
5. Push and open a pull request targeting `develop`.
6. Ensure CI checks pass before merging.

## API Integration

- Use **React Query** for data fetching.
- API calls are centralized using Axios.
- Mock APIs can be used in Storybook for isolated UI development.

## UI Components

- Develop and document components in **Storybook**.
- Follow accessibility best practices (ARIA, focus, contrast).
- Use consistent theming.

## Additional Resources

- [README.md](./README.md)
- [Vite Documentation](https://vitejs.dev/)
- [React Query](https://react-query.tanstack.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Storybook](https://storybook.js.org/)

Welcome aboard!