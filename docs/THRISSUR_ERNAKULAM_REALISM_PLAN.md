# Thrissur → Ernakulam (NH 544) Realism Plan

The goal here isn't to perfectly replicate the highway on a map. It's to nail the *mental map* of NH 544. If someone from Thrissur or Kochi says "yep, this feels like Paliyekkara after Chalakudy", that's a win.

## 1) Route Breakdown By Zone

Your existing `ZONES` array lines up incredibly well with the real route. Lean into these distinctions to sell the journey.

| Zone | Real Area | Vibe | What To Focus On |
| :-- | :-- | :-- | :-- |
| `Thrissur City` | Thrissur outskirts & Swaraj Round area | Semi-rural, busy town roads transitioning to highway | Tiled roofed shops, bakeries, tyre shops, petrol pumps, more autos and two wheelers. |
| `Paliyekkara Toll` | Paliyekkara, near Wadakkanchery area | The most recognizable landmark on this route | Beef up the toll plaza, add FASTag gantries, queue markers, "PALIYEKKARA TOLL" boards and a longer slowdown zone. |
| `Chalakudy & Koratty` | Chalakudy, Koratty, Athirappilly approach | Green highway stretch | Fewer buildings, more coconut/rubber trees, gentle curves, crash barriers and an increase in potholes. This is your "cruising" zone. |
| `Angamaly & Aluva` | Angamaly, Nedumbassery (Cochin Airport), Aluva | Getting busier and more industrial | Airport signboards, logistics yards, lorries, flyovers, and more directional signage. |
| `Kalamassery` | Kalamassery, HMT Junction area | Industrial + University belt | Metro pillars (you already have these), overhead gantries, hoardings, tighter traffic, more buses. |
| `Ernakulam City` | Edappally, Palarivattom, Vyttila, MG Road approach | Urban Kochi chaos | Flyovers, service roads, pedestrian crossings, more signals, billboards, high rises and more visibility to the backwaters. |

## 2) Using Your Existing OSM Data

You already load `level_data.json` and use it for waypoints. With a few tweaks, it can be a lot more powerful.

| Change | Reason | Implementation Notes |
| :-- | :-- | :-- |
| `Preserve real names` | Instantly recognizable to locals | Keep the exact OSM names on signboards and UI. Don't sanitize things like `Paliyekkara Toll, National Highway 47`. |
| `Differentiate junctions` | Not every signal deserves a 30 second red light stop | Only run the full `spawnEducationalJunction` for major junctions (e.g. Kadavanthra, Palarivattom). For smaller ones, just spawn a signboard and a small crossing instead. |
| `Better deduplication` | Edappally has clusters of very close points | Your current 150 unit threshold is a good start. For clusters, prioritize the one with the "fullest" name or the one tagged as a major junction. |
| `Expand POIs` | Add life to the route | Use Overpass Turbo to pull `amenity=fuel`, `shop=tyres`, `amenity=restaurant`, `tourism=hotel` near NH 544 and spawn them as simple shell meshes. |
| `Prioritize real tolls` | Paliyekkara is special | Treat anything tagged `barrier=toll_booth` as a "major" toll (bigger gantry, more pillars, stricter slowdown) as opposed to generic barriers. |

## 3) Visual Details To Add

These are all cheap in Three.js and have the highest return on investment.

| Detail | Effort | Impact | Notes |
| :-- | :-- | :-- | :-- |
| `Zone based buildings` | Low | Very High | Modify `buildEnvironment()` to pick a palette per `S.currentZone`. Thrissur: tiled, single floor. Ernakulam: concrete showrooms, glass, high rises. |
| `Overhead NH 544 Gantries` | Low | Very High | Add green and white direction boards above the road for major transitions (e.g "THRISSUR ← \| ERNAKULAM → \| KOCHI AIRPORT"). Canvas textures like your toll boards. |
| `Crash Barriers` | Low | High | Swap plain curbs for concrete jersey barriers on bridges, tight curves and the Aluva bridge section. |
| `Cats Eyes / Reflectors` | Low | High | Small emissive cylinders along the median and edges. Subtle at night and adds a ton of depth. |
| `KM Stones` | Very Low | High | Spawn every ~400-600m with "NH 544" and a KM value. Weirdly nostalgic and great for selling distance. |
| `Kerala Billboards` | Low | High | Malayalam ads for jewellery, textiles, ayurveda and gold. Use slightly worn textures to keep it authentic. |
| `Bus Shelters & Poles` | Very Low | High | Add KSEB poles, transformers and simple bus shelters at junctions. Very common on NH 544. |
| `Vegetation Shift` | Very Low | High | Lots of palms in rural zones, transition to rubber trees mid route, heavily tone down trees and add more concrete in Ernakulam. |
| `Bridge Polish` | Low | High | Make the Aluva/Periyar bridge section more obvious. Use a concrete road material, railings, different lighting and a better view of the water if applicable. |

## 4) Traffic & Gameplay Realism

NH 544 has a very distinct flow. Tweaking your spawners to match it will go a long way.

| Tweak | Effort | Impact | Notes |
| :-- | :-- | :-- | :-- |
| `Zone based traffic mix` | Low | Very High | Rural (Thrissur/Chalakudy): more autos, two wheelers and small cars. Mid (Angamaly): more container lorries and KSRTC buses. Urban (Kalamassery/Ernakulam): more cars, taxis and buses. |
| `Trucks dominate mid route` | Low | High | Heavily weight `createContainerTruck` between Chalakudy and Angamaly. This is the stretch where they're the most common. |
| `Speed tapering` | Low | High | Slightly lower the effective max speed in urban zones (especially zone 5). This forces more braking and weaving, making it feel way more like Kochi traffic. |
| `Smarter junction traffic` | Medium | High | At larger junctions, have cross traffic come in waves or linger longer. Your T-bone collision is great, utilize it more for Edappally style chaos. |
| `Merges & T-Junctions` | Medium | High | Mix up 4-way crossings with T-junctions and service road merges. Breaks up the repetitive junction pattern. |
| `Lane hogging` | Low | High | Occasionally have slow trucks drift slightly into other lanes on straights or up gentle inclines. Forces natural weaving without making it unfair. |

## 5) Route Selection: Thrissur → Ernakulam or Ernakulam → Thrissur

Add the ability to start from either end of the route. Don't flip the entire Three.js scene, flip *traversal* of waypoints and distance.

### UI Changes
- Add a route selector on the start screen between the instructions and the "Click or Press ENTER to Start" button.
- Two options: `THRISSUR → ERNAKULAM` (default, Southbound) and `ERNAKULAM → THRISSUR` (Northbound).
- Style to match the existing Teko/Outfit theme with active states.

### Game State
- Add `S.reverse: false` to the game state.
- Track selected route from the start screen (e.g. `data-route="forward"` or `"reverse"`).
- On `startGame()`, apply reverse setup based off of selection.

### Traversal Logic
- **Start position**: If reverse, start near the end of `S.totalJourneyDistance` (e.g. `S.distanceTraveled = S.totalJourneyDistance - 800`) so the player begins around the Ernakulam side.
- **Waypoint iteration**: Traverse waypoints from end to start. Track `S.nextWaypointIndex` accordingly, or build a reversed array on game start.
- **Zone calculation**: Compute zone based off of "distance from start of chosen route". When going in reverse, use `S.totalJourneyDistance - S.distanceTraveled` to look up zones so the zone names transition correctly (e.g. start in `Ernakulam City` and move towards `Thrissur City`).
- **Progress bar**: Invert fill percentage. `progressPct = S.reverse ? (1 - (S.distanceTraveled / S.totalJourneyDistance)) * 100 : (S.distanceTraveled / S.totalJourneyDistance) * 100`. Keep the auto icon moving in the direction of travel.
- **Spawns/culling**: The world still scrolls relative to the player, so most existing culling logic can remain as-is. Just ensure waypoint triggers fire in the correct order.
- **Tolls/Junctions/Gridlock**: All landmarks stay in the same world positions. They should still trigger correctly when encountered in reverse. Keep landmark names identical (encountering `Paliyekkara Toll` on the way back is fun and recognizable).
- **Reset**: `restartGame()` must clear `S.reverse`, reset indices, and restore correct starting positions for the selected route. 

### Implementation Notes
- **Don't flip the scene**: Avoid rotating the entire road/scene. Flipping traversal is far cleaner and less error prone.
- **Keep arcade readable**: Oncoming traffic still behaves correctly, just the "route" context changes.
- **UX**: Update the journey bar labels to reflect direction if desired, but not strictly necessary. The main thing is being able to start from Ernakulam.

## Recommended Implementation Order (Highest ROI First)

Do this in order to see the biggest jump in feel with the least amount of work.

| Order | Task | Notes |
| :-- | :-- | :-- |
| 1 | `Zone based environment` | Update `buildEnvironment()` to use different building palettes and densities per zone. This is the single biggest visual change. |
| 2 | `Improve signage` | Add overhead NH 544 gantries and ensure real OSM junction names are displayed. Leverages your existing `level_data.json` work. |
| 3 | `Traffic mix by zone` | Tweak `spawnSameDirectionObstacle` and `spawnOncomingVehicle` weights based off of `S.currentZone`. |
| 4 | `Landmark polish` | Beef up Paliyekkara toll, polish the Aluva bridge section, and make Angamaly feel more airport adjacent. |
| 5 | `Road furniture` | Add crash barriers, cats eyes, KM stones and KSEB poles. Lots of small details that stack incredibly well. |
| 6 | `Junction variety` | Replace some copy pasted 4-ways with merges/T-junctions and only do full stops at major junctions. |
| 7 | `Billboards & flora shift` | Final pass on ads and swapping palm heavy areas for more urban clutter in Kochi. |

## Pro Tips

- **Mental map > GPS**: Don't try to match every curve 1:1. Match the *sequence* of landmarks. Paliyekkara -> Chalakudy -> Angamaly -> Aluva -> Kalamassery -> Edappally is the key.
- **Less is more for buildings**: Don't fill every square inch. Leaving some open fields between towns makes the transitions hit harder.
- **Lean into the details you already have**: Your metro pillars, toll booth, educational junctions and backwaters are already huge strengths. Doubling down on those will be more effective than rewriting the entire road generation.
- **Keep it arcade first**: Realism should serve the fun. If something makes the highway less readable or more frustrating, tone it down. The goal is "recognizably NH 544" not a driving sim.
