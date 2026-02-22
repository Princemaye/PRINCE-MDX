# PRINCE-MDX WhatsApp Bot

## Overview
A multi-device WhatsApp bot built with Node.js and Baileys library. It provides various automated features for WhatsApp including auto-reactions, anti-delete, anti-link, chatbot capabilities, and more.

## Project Architecture
- **index.js** - Main entry point. Sets up Express server (port 5000) and initializes the WhatsApp bot connection
- **config.js** - Configuration via environment variables with defaults
- **mayel/** - Core bot framework (session management, helper functions, commands)
- **prince/** - Plugin modules (AI, downloader, tools, search, etc.)
- **mayel/session/** - WhatsApp session data (gitignored)

## Key Dependencies
- `prince-baileys` (gifted-baileys) - WhatsApp Web API
- `express` - Web server for status page
- `sharp` - Image processing
- `better-sqlite3` - Local database
- `ffmpeg` - Media processing

## Configuration
The bot requires a `SESSION_ID` environment variable to connect to WhatsApp. Other settings (prefix, owner number, bot name, etc.) are configured via environment variables - see `config.js` for all options.

## Running
- `node index.js` starts both the Express server on port 5000 and the WhatsApp bot connection
- The Express server serves a status page at the root URL

## Recent Changes
- 2026-02-22: Configured for Replit environment. Made server listen on 0.0.0.0:5000. Graceful handling when SESSION_ID is not set.
