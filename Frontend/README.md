# OneInbox

A standalone application containing Mail and Chat sections extracted from the main application.

## Features

- **Mail Section**: Full-featured mail interface with labels, compose, and details
- **Chat Section**: Complete chat interface with conversations, messages, and contacts

## Getting Started

### Installation

```bash
yarn install
# or
npm install
```

### Development

```bash
yarn dev
# or
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
yarn build
# or
npm run build
```

## Routes

- `/` - Mail view (default)
- `/mail` - Mail view
- `/chat` - Chat view

## Structure

```
oneinbox/
├── src/
│   ├── sections/
│   │   ├── mail/        # Mail section components
│   │   └── chat/        # Chat section components
│   ├── actions/         # API actions (mail, chat)
│   ├── types/           # TypeScript types
│   ├── components/      # Shared components
│   ├── layouts/         # Layout components
│   ├── routes/          # Routing configuration
│   ├── theme/           # Theme configuration
│   ├── locales/         # Internationalization
│   └── utils/           # Utility functions
├── public/              # Static assets
└── package.json
```

## Dependencies

This app uses the same dependencies as the original application, including:
- React 19
- Material-UI v7
- React Router v7
- SWR for data fetching
- TipTap for rich text editing
- And more...

## Notes

- ✅ All components, actions, and utilities from the original mail and chat sections are included
- ✅ Complete design system with all styling preserved
- ✅ All 11 mail section files and 24 chat section files copied
- ✅ The app is configured to work independently with minimal setup
- ✅ Authentication is set to JWT by default (can be configured in `src/global-config.ts`)
- ✅ All dependencies from the original template are included

## Verification

- **Mail Section**: 11 files ✅ (matches original)
- **Chat Section**: 24 files ✅ (matches original)
- **All Components**: Copied ✅
- **All Dependencies**: Installed ✅
- **Design System**: Complete ✅

See `SETUP_COMPLETE.md` for detailed verification.
