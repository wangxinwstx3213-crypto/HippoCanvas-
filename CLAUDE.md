# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

河马体画布 (Hippo Canvas) is a visual design canvas application built with React and TypeScript that enables node-based image generation workflows using Gemini AI models through the Vector Engine API. Users can create visual workflows by connecting image upload nodes to AI generation nodes, with support for annotations, layer-based prompts, and real-time logging.

## Development Commands

### Main Application
- `npm install` - Install dependencies for the React application
- `npm run dev` - Start development server on port 3002 (due to port conflicts)
- `npm run build` - Build production application
- `npm run preview` - Preview production build

### API Testing
- `node test-vector-api.js` - Test Vector Engine API connectivity and models
- `node test-gmapi.js` - Test GMAPI integration functionality

### GMAPI Submodule
- `cd GMAPI && npm install` - Install GMAPI dependencies
- `cd GMAPI && npm test` - Run GMAPI internal tests

### Environment Setup
1. Install dependencies: `npm install` and `cd GMAPI && npm install`
2. Configure API keys in `.env.local` (VECTOR_ENGINE_API_KEY required)
3. Run API test: `node test-vector-api.js`
4. Run development server: `npm run dev`

## Architecture

### Core Components

**App.tsx** - Main application with:
- Canvas state management (nodes, connections, zoom/pan)
- Theme switching (dark/light)
- Node interaction handling (drag/drop, connections)
- Annotation system for image marking
- Generation workflow orchestration
- System logging and settings management

**Node System** (`components/NodeComponent.tsx`):
- Two node types: `IMAGE_UPLOAD` and `GENERATE_IMAGE`
- Interactive canvas with plug/socket connection system
- Annotation support for marking image regions
- Layer-based prompt composition
- Generation parameters (aspect ratio, resolution, count)

**Connection System** (`components/ConnectionLine.tsx`):
- Bezier curve connections with animations
- Drag-to-connect functionality
- Visual feedback and selection states
- Animated flow indicators

### Vector Engine API Integration

**Vector Engine API** provides Gemini AI model access through OpenAI-compatible endpoints:
- Base URL: `https://api.vectorengine.ai`
- Supports Gemini 2.5 Flash and 3 Pro models
- OpenAI-compatible `/v1/chat/completions` endpoint
- Returns images in Markdown format: `![image](data:image/png;base64,...)`

**Service Layer** (`services/geminiService.ts`):
- Direct fetch-based API calls to Vector Engine
- TypeScript wrapper for type safety
- Response parsing for Markdown image extraction
- Environment variable precedence (VECTOR_ENGINE_API_KEY > GEMINI_API_KEY)
- Error handling with detailed API error messages

### GMAPI Integration

**GMAPI** is a self-contained Node.js package in `./GMAPI/` that provides:
- Alternative API interface for Gemini models
- Reference image conditional generation
- Batch processing capabilities
- Comprehensive logging system
- File-based configuration support

### Key Data Structures

**Nodes**: `IMAGE_UPLOAD` (for input images with annotations) and `GENERATE_IMAGE` (for AI generation with layered prompts)

**Layers**: Hierarchical prompt structure where each layer can contain:
- Text prompts
- Annotation references (e.g., `@@1`)
- Inline image annotations

**Annotations**: Clickable image regions that insert references like `@@1` into prompts, enabling conditional generation based on marked areas

### Workflow

1. User uploads images to `IMAGE_UPLOAD` nodes
2. User marks regions on images creating annotations
3. User creates prompts in `GENERATE_IMAGE` nodes with annotation references
4. User connects upload nodes to generation nodes
5. System "bakes" annotations onto reference images
6. System compiles layered prompts with reference images
7. Vector Engine API generates images using Gemini models
8. Response parsing extracts base64 image data from Markdown format

## Configuration

### Environment Variables
- `VECTOR_ENGINE_API_KEY` - Primary API key for Vector Engine (required)
- `VECTOR_ENGINE_BASE_URL` - API base URL (defaults to https://api.vectorengine.ai)
- `GEMINI_API_KEY` - Legacy support (fallback if VECTOR_ENGINE_API_KEY not set)
- `DEFAULT_GEMINI_IMAGE_VERSION` - Default model version (defaults to 3.0)

### System Settings (in-app)
- Base URL for API endpoint (default: https://api.vectorengine.ai)
- Model selection (gemini-2.5-flash-image-preview, gemini-3-pro-image-preview)
- Aspect ratio (1:1, 16:9, 9:16, 3:4, 4:3)
- Image resolution (1K, 2K, 4K)

### Configuration Files
- `.env.local` - Main environment configuration
- `./GMAPI/.env.example` - GMAPI environment variable template
- `./GMAPI/GE.txt` - GMAPI JSON configuration file

## Development Patterns

### State Management
- React hooks (useState, useRef, useEffect) for local state
- Custom event handlers for user interactions
- Screen-to-world coordinate transformation for canvas

### Styling
- Tailwind CSS classes with inline styles
- Dark/light theme support via CSS variables
- Smooth animations and transitions

### TypeScript
- Comprehensive type definitions in `types.ts`
- Custom GMAPI types in `types/gmapi.d.ts`
- Strict typing throughout with interfaces

### Canvas Interaction
- Custom drag-and-drop implementation
- Click-to-add annotation system
- Keyboard shortcuts (Delete for removal)
- Mouse event coordination conversion

## Important Files

- `App.tsx` - Main application component and canvas logic
- `types.ts` - Core type definitions for nodes, connections, layers
- `services/geminiService.ts` - Vector Engine API integration layer
- `constants.ts` - UI dimensions and grid settings
- `vite.config.ts` - Build configuration with API key injection
- `test-vector-api.js` - Vector Engine API testing utility
- `test-gmapi.js` - GMAPI integration testing utility
- `./GMAPI/src/GeminiAPI.js` - Simplified API interface
- `./GMAPI/src/GeminiImageGenerator.js` - Core generation class

## Testing

### API Testing
- **Vector Engine API**: `node test-vector-api.js` - Tests connectivity, model listing, and image generation
- **GMAPI Integration**: `node test-gmapi.js` - Tests GMAPI wrapper functionality

### Troubleshooting Common Issues
- **Port conflicts**: App uses port 3002 due to port 3000/3001 conflicts
- **API Key errors**: Verify VECTOR_ENGINE_API_KEY in `.env.local`
- **Response parsing**: Check BC.TXT for detailed error messages
- **Module loading**: Ensure `npm install` and `cd GMAPI && npm install` completed

### Testing Workflow
1. Install dependencies: `npm install && cd GMAPI && npm install`
2. Test API connectivity: `node test-vector-api.js`
3. Start development server: `npm run dev`
4. Verify app loads at http://localhost:3002