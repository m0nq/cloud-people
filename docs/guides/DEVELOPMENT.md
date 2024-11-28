# Development Guide

## Development Environment Setup

### Prerequisites

- Node.js (v20 or higher)
- Yarn
- Supabase CLI
- Git

### Initial Setup

1. Clone the repository:

    ```bash
    git clone git@github.com:m0nq/cloud-people.git
    cd cloud-people
    ```

2. Install dependencies:

    ```bash
    yarn install
    ```

3. Set up environment variables:

    - Copy `.env.example` to `.env`
    - Fill in required environment variables

4. Start the development server:
    ```bash
    pnpm dev
    ```

## Development Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- Feature branches: `feature/[feature-name]`
- Bug fixes: `fix/[bug-name]`

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Run `yarn lint` before committing

### Testing

- Write unit tests for utilities and components
- Write integration tests for API endpoints
- Run tests: `yarn test`

### Commit Guidelines

- Use conventional commit messages
- Include ticket/issue numbers in commits
- Keep commits atomic and focused

## Building and Deployment

1. Build the application:

    ```bash
    pnpm build
    ```

2. Preview production build:

    ```bash
    pnpm start
    ```

3. Deploy:
    - Deployments are automated via GitHub Actions
    - Merging to `main` triggers production deployment
    - Merging to `develop` triggers staging deployment

## Troubleshooting

Common issues and their solutions:

### Build Errors

- Clear `.next` directory
- Remove `node_modules` and reinstall
- Check Node.js version

### Database Issues

- Verify Supabase connection
- Check environment variables
- Run latest migrations
