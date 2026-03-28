// create-icons.mjs
import { writeFileSync } from 'fs';

// A known-valid 1x1 blue PNG in base64
const BLUE_1X1_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12NgYGD' +
  '4DwABBAEAwyvnRQAAAABJRU5ErkJggg==';

const buf = Buffer.from(BLUE_1X1_B64, 'base64');

for (const size of [16, 48, 128]) {
  writeFileSync(`icons/icon${size}.png`, buf);
  console.log(`icons/icon${size}.png written (placeholder — replace before distribution)`);
}
