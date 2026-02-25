# VoidScaper

**Current Version:** v1.2.0  
**Status:** Active Deployment

## Project Overview
VoidScaper is a high-velocity endless runner built to test reflex latency and browser rendering optimization. Designed with a brutalist "Cyber-Void" aesthetic, it utilizes **React** for state management and **Phaser 3** for the physics engine.

## Tech Stack
*   **Core:** React 18 (TypeScript) / Vite
*   **Physics Engine:** Phaser 3 (Arcade Physics)
*   **Styling:** Tailwind CSS (Utility-first architecture)
*   **Audio:** Web Audio API (Real-time synthesis, no external assets)
*   **Deployment:** Netlify CI/CD Pipeline

## Key Features
*   **Procedural Difficulty:** The game loop implements a compounding speed increase of 6% every 60 points, forcing the player into a high-gamma flow state.
*   **Dynamic Obstacles:** Uses RNG logic to alternate between ground-based spikes and aerial drone threats.
*   **Local Audio Synthesis:** A custom `SoundManager` class generates retro-style SFX using pure oscillators, reducing asset load times to zero.
*   **Responsive Canvas:** Optimized for 60FPS performance on both desktop and mobile viewports.

## Local Installation

To run this protocol locally:

```bash
# 1. Clone the repository
git clone https://github.com/berinelson122-design/VoidScraper.git

# 2. Enter the directory
cd VoidScaper

# 3. Install dependencies
npm install

# 4. Initialize the dev server
npm run dev