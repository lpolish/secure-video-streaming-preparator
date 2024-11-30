# Video Streaming Preparator

This project is a monorepo containing a frontend Next.js application and a backend AWS Lambda-based service for video processing and streaming.

## Project Structure

- \`packages/frontend\`: Next.js application for video upload and management
- \`packages/backend\`: AWS Lambda functions for video processing and API endpoints

## Getting Started

1. Install dependencies:
   \`\`\`
   pnpm install
   \`\`\`

2. Start the development servers:
   \`\`\`
   pnpm run dev
   \`\`\`

3. Build the project:
   \`\`\`
   pnpm run build
   \`\`\`

4. Deploy the backend:
   \`\`\`
   pnpm run deploy:backend
   \`\`\`

## Environment Variables

Make sure to set up the following environment variables:

- \`AWS_ACCESS_KEY_ID\`
- \`AWS_SECRET_ACCESS_KEY\`
- \`AWS_REGION\`
- \`S3_BUCKET_NAME\`
- \`DYNAMODB_TABLE_NAME\`

## Environment Files

Both the frontend and backend packages have `.env.example` files that list the required environment variables. To set up your local environment:

1. Copy `.env.example` to `.env` in both `packages/frontend` and `packages/backend` directories.
2. Fill in the values in the `.env` files with your specific configuration.

Example:
\`\`\`
cp packages/frontend/.env.example packages/frontend/.env
cp packages/backend/.env.example packages/backend/.env
\`\`\`

Then edit both `.env` files with your specific values.

## License

This project is licensed under the MIT License.

