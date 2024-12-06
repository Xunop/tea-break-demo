This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Struct

```
app
├── api
│   ├── admin
│   │   ├── papers
│   │   │   ├── route.ts (GET, POST - Get all papers, Upload a new paper)
│   │   │   └── [paperId]
│   │   │       ├── route.ts (PUT, DELETE - Edit or delete a paper by paperId)
│   │   └── reporters
│   │       └── [reporterId]
│   │           └── approve.ts (POST - Approve a reporter registration)
│   ├── users
│   │   ├── route.ts (POST - Register a new user)
│   │   └── [userId]
│   │       └── friend.ts (POST - Add a friend by userId)
│   ├── papers
│   │   └── [paperId]
│   │       ├── comments.ts (POST - Add a comment to a paper by paperId)
│   │       └── download.ts (GET - Download a paper by paperId)
│   ├── reporters
│   │   ├── route.ts (POST - Register a new conference reporter)
│   │   └── [reporterId]
│   │       ├── papers
│   │       │   ├── route.ts (GET, POST - Get or upload papers by reporterId)
│   │       │   └── [paperId]
│   │       │       └── stats.ts (GET - Get stats for a specific paper by paperId)
├── components
│   ├── Header.tsx (Header component with navigation links)
│   ├── Footer.tsx (Footer component)
│   ├── PaperCard.tsx (Component for displaying a paper card)
│   └── Modal.tsx (Reusable modal component for login or confirmation actions)
├── fonts
│   ├── GeistMonoVF.woff
│   └── GeistVF.woff
├── globals.css (Global styles using TailwindCSS)
├── layout.tsx (Main layout including Header and Footer)
├── (routes)
│   ├── index
│   │   └── page.tsx (Home page - Welcome message and user actions)
│   ├── papers
│   │   └── page.tsx (Papers listing page)
│   └── profile
│       └── page.tsx (User profile page)
public
├── file.svg
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
store
├── useAppStore.ts (Zustand store for managing user and paper states)
utils
├── api.ts (Utility functions for interacting with the backend API)
├── auth.ts (Utility functions for handling authentication)
└── constants.ts (Constants like API URLs, etc.)
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
