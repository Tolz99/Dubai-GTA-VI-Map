import type { StoryMission } from './types';

// "Story missions" — curated multi-stop routes through the city.
export const MISSIONS: StoryMission[] = [
  { id: 'm1', number: 1, title: 'Welcome to Downtown', subtitle: 'Tallest tower, biggest mall, loudest fountain.',
    color: '#FFD23F', reward: 'SKYLINE ROOKIE', stops: ['DM', 'aquarium', 'burj-khalifa', 'dubai-fountain', 'sky-views'] },
  { id: 'm2', number: 2, title: 'Old Dubai', subtitle: 'Wind towers, a 1-dirham boat and a street of gold.',
    color: '#E8A54B', reward: 'CREEK LEGEND', stops: ['al-fahidi', 'arabian-tea-house', 'abra-crossing', 'spice-souk', 'gold-souk', 'perfume-souk'] },
  { id: 'm3', number: 3, title: 'Palm Protocol', subtitle: 'Work your way up the trunk to the pink palace.',
    color: '#3DFFD8', reward: 'PALM INSIDER', stops: ['palm-view', 'NAK', 'palm-west-beach', 'the-pointe', 'atlantis-palm', 'aquaventure'] },
  { id: 'm4', number: 4, title: 'Marina Nights', subtitle: 'Neon towers, a zipline and the giant wheel.',
    color: '#FF3D8B', reward: 'NIGHT RIDER', stops: ['marina-walk', 'xline', 'jbr-walk', 'BEACH', 'BLUE', 'ain-dubai'] },
  { id: 'm5', number: 5, title: 'Sail & Surf', subtitle: 'The sail, the souk and the kite surfers.',
    color: '#29E3FF', reward: 'BEACH BOSS', stops: ['sunset-beach', 'burj-al-arab', 'SOUK', 'kite-beach', 'salt-kite'] },
  { id: 'm6', number: 6, title: 'Future City', subtitle: 'From 2071 back to a golden frame.',
    color: '#B66DFF', reward: 'TIME TRAVELLER', stops: ['museum-future', 'emirates-towers', 'one-za-abeel', 'dubai-frame', 'CW', 'green-planet'] },
  { id: 'm7', number: 7, title: 'Snow in the Desert', subtitle: 'Ski at −4°C, then launch at 100 km/h.',
    color: '#E6E1FF', reward: 'ICE COLD', stops: ['MOE', 'ski-dubai', 'DHM', 'storm-coaster'] },
  { id: 'm8', number: 8, title: 'Street Eats', subtitle: 'Five legendary cheap eats. Bring cash and appetite.',
    color: '#FF8A3D', reward: 'FOOD HUNTER', stops: ['ravi', 'al-mallah-satwa', 'BOX', 'bu-qtair', 'al-ustad'] },
  { id: 'm9', number: 9, title: 'Art District', subtitle: 'Warehouses, galleries and serious coffee.',
    color: '#8FA8FF', reward: 'CULTURE VULTURE', stops: ['alserkal', 'tom-serg', 'project-chaiwala', 'd3', 'jameel-arts'] },
  { id: 'm10', number: 10, title: 'Adrenaline', subtitle: 'Jump, dive, race. Sign the waivers.',
    color: '#FF4D5E', reward: 'NO FEAR', stops: ['skydive-palm', 'deep-dive', 'img-worlds', 'dubai-autodrome'] },
  { id: 'm11', number: 11, title: 'Desert Run', subtitle: 'Lakes in the dunes, flamingos and a fort feast.',
    color: '#F5B971', reward: 'DUNE RUNNER', stops: ['al-qudra', 'love-lake', 'al-hadheerah', 'desert-safari'] },
  { id: 'm12', number: 12, title: 'Mountain Escape', subtitle: 'Road trip to the Hajar mountains.',
    color: '#45E08A', reward: 'HIGHLANDER', stops: ['hatta-dam', 'hatta-heritage'] },
];
