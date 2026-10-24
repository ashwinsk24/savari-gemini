# Savari Giri Giri!

A high-octane Kerala auto-rickshaw arcade experience across NH 544 (Thrissur ⇄ Ernakulam).

## 🚀 The Game

Jump into the driver's seat of a souped-up autorickshaw! Race through busy streets, dodge traffic, navigate pedestrians, and master the art of the 'Blink Drive' to weave through impossible gaps.

## 🎯 The Vibe

**"Bullet Time meets Kerala Chaos."**
We're blending the hyper-stylized action of *Hotline Miami* with the scenic, sun-drenched chaos of Kochi's streets. It’s fast, it’s frenetic, and it’s unapologetically Indian.

## 🌟 Key Features

-   **The Blink Drive** - Trigger a slow-motion dash to slide through traffic and pedestrians. Miss a window, and you're toast!
-   **Dynamic AI** -
    -   **Pedestrians** - Jauntily crossing roads, sitting on dividers, and yelling at you to watch out.
    -   **Auto-Drivers** - Your sworn rivals. They'll cut you off, block you, and honk aggressively.
    -   **Police Cruisers** - Hot on your tail. Don't let them crash into you!
    -   **Scavenger Drones** - Soaring above, adding aerial chaos.
-   **Procedural City** - A sprawling, randomly generated Kochi map with:
    -   **Toll Booths** - Race through cash lanes for a speed boost.
    -   **Traffic Signals** - Red means stop! Green means GO!
    -   **Street Food Stalls** - Smell the spices as you drift past.
-   **Cinematic Destruction** - Cars explode, obstacles shatter, and debris flies in glorious slow-motion.
-   **Authentic Soundtrack** - A pulsing, synth-heavy score that captures the energy of the streets.

## 🛠️ Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/)
-   **3D Engine:** [Three.js](https://threejs.org/)
-   **3D Assets:** **Gemini 3D** (via `three/models`)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## 🏁 Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   OpenAI API Key (for the Roasting Bot)

### Installation

1.  Clone the repository.
2.  Run the setup script:
    ```bash
    ./setup.sh
    ```
    *This will install dependencies and set up the `.env` file.*

### Running the Game

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### How to Play

-   **W/A/S/D** or **Arrow Keys**: Drive the Auto
-   **Space**: Brake
-   **Left Click**: Activate **Blink Drive** (Slow-mo)

### AI Configuration

Ensure your `.env` file contains:

```env
OPENROAST_API_KEY=your_key_here
```

## 🎮 The Story

You are **Savi** (short for Savari), Kochi's most audacious tuk-tuk driver. Bored with the mundane life of ferrying tourists, you've converted your auto with stolen tech and street-racer modifications. Your goal: to become the legend of the Kochi streets, one burnout at a time.

## 🌟 Meet the Team

-   **The AI Director (Gemini 3D):** Powers the procedural world generation, ensuring every drive is unique.
-   **The Roaster (OpenAI):** Provides real-time, hilarious commentary and roasting based on your driving skill (or lack thereof).
-   **The Developer:** [Your Name/Company]
