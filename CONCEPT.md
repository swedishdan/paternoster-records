# Paternoster

**A record shop on a lift that never stops.** Paternoster is a fictional independent record shop in Prague. Its floors are linked by a paternoster, an open lift that loops nonstop. The line is *Everything comes back around*.

## Identity
- **Mark:** the loop. A rounded track with two cabins on it, which animate around the logo.
- **Device:** the blue enamel house-number plate found on every Prague building. Floor numbers, the menu and the shop's address "17" are all set as plates.
- **Color:** cobalt enamel `#1F45A8`, enamel white `#F2EFE6`, shaft black `#111214`, and red `#D7362B` for stop buttons, stickers and stamps. Warm oak appears only inside the cabins.
- **Type:** Archivo is set expanded for the brand and condensed for motion and numbers. Record titles always appear in Newsreader italic. IBM Plex Mono is used for labels.

## The site is the building
- Each section is a floor, separated by a concrete slab marked with its height in metres.
- The header plate shows the current floor. Press P or 1–5 to ride to that floor.
- **The landing (WebGL):** a real 3D shaft behind the blue enamel wall, with fourteen glowing oak cabins on one continuous loop, each carrying its record. Click a cabin to step off with it. Scrolling flies the camera in and up through the concrete slab, and the screen goes black exactly where the next section begins.
- **Entry:** choose "Enter with sound" or "Enter quietly". The camera then drops down through the floors and arrives at the landing.
- **Lift display:** an amber 5×7 dot-matrix ticker, with accents, listing what is riding now. It speeds up as you scroll.
- STOP pauses all motion.
- **New in:** hover a record and its cabin is called to the landing.
- **Second-hand:** drag to flip through a 3D crate. Records are graded M to G.
- **The lap:** a 3:52 ride around the building, driven by scroll.
- **Cabin 7:** concerts in the lift, booked by the lap.
- **Visit:** the address, hours and the top wheel.
- **Over the top:** scrolling past the end loops you back to the ground floor.

## Details
- Custom cursor with labels and magnetic buttons.
- Headlines build letter by letter, and the numbers count up.
- A floor rail runs with the ground floor at the bottom, like the building.
- The footer letters ride up and down like cabins.

## Craft
Every sleeve is generated in code, and every sound is synthesised. Only transform and opacity are animated. Reduced motion starts the site with the lift stopped.
