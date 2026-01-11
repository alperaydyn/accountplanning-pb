# Demo Mode - Technical Specifications

## Overview

The Demo Mode provides an interactive guided tour system that walks users through the application with audio narration, visual highlighting, and step-by-step explanations. Designed for both user onboarding and investor presentations.

---

## Key Features

### 1. Multi-Language Support
- Supports all application languages: Turkish (tr), English (en), Spanish (es)
- Demo content is displayed and narrated in the user's selected language
- Audio files are generated separately for each language

### 2. Modular Audio Narration
- Each panel/functionality has its own dedicated audio file
- Audio is generated using ElevenLabs Text-to-Speech API
- Pre-generated and stored in Supabase Storage for instant playback

### 3. Visual Focus System
- **Spotlight Effect**: Dims surrounding areas while highlighting the active element
- **Pulse Animation**: Draws attention to interactive elements
- **Border Highlight**: Outlines the current focus area
- **Arrow Indicators**: Points to specific UI elements

### 4. Automated Interactions
- Auto-expand collapsible panels
- Auto-click to open dropdowns/modals
- Scroll to bring elements into view
- Pause for user to observe before continuing

### 5. Playback Controls
- Play/Pause functionality
- Skip to next/previous step
- Progress indicator showing current step
- Exit demo at any time
- Speed control (0.5x, 1x, 1.5x)

---

## Technical Architecture

### Folder Structure
```
src/demo/
├── demo_instructions.md          # This documentation
├── types.ts                      # TypeScript type definitions
├── contexts/
│   └── DemoContext.tsx           # Demo state management
├── components/
│   ├── DemoOverlay.tsx           # Spotlight and dimming overlay
│   ├── DemoTooltip.tsx           # Explanation popups
│   ├── DemoControls.tsx          # Playback controls bar
│   └── DemoTrigger.tsx           # Start demo button
├── hooks/
│   └── useDemoAudio.ts           # Audio playback management
└── scripts/
    ├── dashboard.ts              # Dashboard page demo steps
    ├── customers.ts              # Customers page demo steps
    ├── primary-bank.ts           # Primary Bank page demo steps
    └── actions.ts                # Actions Agenda demo steps
```

### Database Schema
```sql
CREATE TABLE demo_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR NOT NULL,
  step_order INTEGER NOT NULL,
  element_selector VARCHAR NOT NULL,
  short_text_tr TEXT NOT NULL,
  short_text_en TEXT NOT NULL,
  short_text_es TEXT NOT NULL,
  narrative_tr TEXT NOT NULL,
  narrative_en TEXT NOT NULL,
  narrative_es TEXT NOT NULL,
  audio_url_tr TEXT,
  audio_url_en TEXT,
  audio_url_es TEXT,
  highlight_type VARCHAR DEFAULT 'spotlight',
  actions JSONB DEFAULT '[]',
  duration_ms INTEGER DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Edge Function
- `generate-demo-audio`: Generates audio using ElevenLabs API
  - Input: narrative text, language, voice settings
  - Output: URL of stored audio file in Supabase Storage

---

## Demo Flow

### Entry Points
1. Settings page → "Start Demo" button
2. Header → Help icon → "Guided Tour" option
3. URL parameter: `?demo=true`
4. First-time user welcome modal

### Step Execution Flow
1. Navigate to target page (if needed)
2. Apply spotlight overlay to target element
3. Display tooltip with short explanation
4. Play corresponding audio narration
5. Execute any automated actions (click, expand, scroll)
6. Wait for audio completion + pause duration
7. Transition to next step

---

## Element Targeting

Use `data-demo-id` attributes for reliable element selection:

```tsx
<Card data-demo-id="summary-cards">
  ...
</Card>
```

### Reserved Demo IDs for Dashboard
- `page-header` - Main page title area
- `date-selector` - Date picker dropdown
- `summary-cards` - Key metrics cards container
- `primary-bank-score` - Primary bank score card
- `benchmark-score` - Benchmark score card
- `pending-actions` - Pending actions card
- `insights-panel` - AI insights section
- `product-table` - Product performance table
- `product-row-{id}` - Individual product rows

---

## Audio Generation Guidelines

### Voice Selection
- Use consistent voice per language:
  - Turkish: Custom or "Brian" (professional)
  - English: "Brian" (nPczCjzI2devNBz1zQrb)
  - Spanish: "Laura" (FGY2WhTYpPnrIDTdsKH5)

### Narrative Writing Rules
1. Keep narrations under 30 seconds per step
2. Use clear, professional tone
3. Reference visual elements being highlighted
4. Include transition phrases between steps
5. Avoid technical jargon - focus on user benefits

---

## State Management

### DemoContext State
```typescript
interface DemoState {
  isActive: boolean;
  currentPage: string;
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  audioProgress: number;
  steps: DemoStep[];
}
```

### Local Storage
- Save progress on exit for resumption
- Store user preferences (speed, volume)

---

## Implementation Checklist

- [x] Create demo types and interfaces
- [x] Create DemoContext with state management
- [x] Build DemoOverlay with spotlight effect
- [x] Build DemoTooltip component
- [x] Build DemoControls bar
- [x] Create useDemoAudio hook
- [x] Define Dashboard demo script
- [x] Create ElevenLabs audio generation edge function
- [x] Add demo trigger in AppHeader
- [x] Add data-demo-id attributes to Dashboard elements
- [x] Add i18n translations for demo UI
- [ ] Generate audio files for all languages
- [ ] Test end-to-end flow
- [ ] Add remaining page scripts (Customers, Primary Bank, etc.)
