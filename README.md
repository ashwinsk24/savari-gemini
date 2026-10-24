# Savari Giri Giri

A Kerala-style auto-rickshaw arcade game set along NH 544 between **Thrissur** and **Ernakulam**. Drive the classic Auto Rickshaw through real Kerala towns, pick up and drop off passengers, obey traffic rules, and make your way down the highway.

## Features

- **Two Routes** - Drive from Thrissur to Ernakulam (Southbound) or Ernakulam to Thrissur (Northbound). Route selection is available on the start screen.
- **Passenger System** - Pickup customers from the roadside and drop them off at their destination to earn fares. The in-game fare meter and ride card track your trip.
- **Real NH 544 Route** - Zones based on actual towns along the route including Thrissur, Ollur, Chalakudy, Angamaly, Aluva, Kalamassery, Edappally, and Ernakulam.
- **Traffic & Rules** - Navigate traffic lights, junctions with cross-traffic, toll booths (Paliyekkara style), and watch out for oncoming vehicles.
- **Day/Night Cycle** - Time progresses as you drive along the route.
- **Boost & Physics** - Speed up with Pazham Pori Boost, handle curves, and deal with realistic road conditions.
- **Scoring** - Earn distance and bonus points. Fares add to your trip earnings tracked in the HUD.
- **Roast AI** - On a new high score, Auto Chettan roasts you via the Gemini-powered API at `/api/roast`.

## Tech Stack

- **Rendering**: [Three.js](https://threejs.org/) (loaded via CDN)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **API**: Vercel Serverless Function at `api/roast.js` (Google Gemini)

## Running Locally

This is a static site. You can run it with any local server:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## How to Play

- **W / ↑** - Accelerate
- **S / ↓** - Brake/Reverse
- **A / ← / D / →** - Steer
- **Space** - Pazham Pori Boost (when ready)
- **H** - Horn
- **Enter** - Start game / Retry on game over
- **T** - Skip time of day

## Notes

- Select your route (Thrissur → Ernakulam or Ernakulam → Thrissur) before starting.
- Stop at red lights and follow junction instructions to avoid penalties.
- Slow down at toll plazas - FASTag lane is the left lane, cash lane is blocked.
