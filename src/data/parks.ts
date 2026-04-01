import { Park } from './types';

export const RATE_PER_NIGHT = 350;

export const parks: Park[] = [
  {
    id: 'moremi',
    name: 'Moremi Game Reserve',
    sites: [
      { id: 'smox1', name: 'SMOX 1', parkId: 'moremi' },
      { id: 'smox2', name: 'SMOX 2', parkId: 'moremi' },
      { id: 'smox3', name: 'SMOX 3', parkId: 'moremi' },
      { id: 'smot', name: 'SMOT', parkId: 'moremi' },
      { id: 'xinni-m', name: 'XINNI Main', parkId: 'moremi' },
      { id: 'xinni-2', name: 'XINNI 2', parkId: 'moremi' },
      { id: 'maqwegana', name: 'Maqwegana', parkId: 'moremi' },
      { id: 'mgr10', name: 'MGR 10', parkId: 'moremi' },
    ],
  },
  {
    id: 'khwai',
    name: 'Khwai Community Area',
    sites: [
      { id: 'samahundu', name: 'Samahundu', parkId: 'khwai' },
      { id: 'dombo-hpool', name: 'Dombo Hippo Pool', parkId: 'khwai' },
      { id: 'smok3', name: 'SMOK 3', parkId: 'khwai' },
      { id: 'smok-main', name: 'SMOK Main', parkId: 'khwai' },
    ],
  },
  {
    id: 'savuti',
    name: 'Savuti / Chobe National Park',
    sites: [
      { id: 'sv1', name: 'SV 1', parkId: 'savuti' },
      { id: 'sv3', name: 'SV 3', parkId: 'savuti' },
      { id: 'sv4', name: 'SV 4', parkId: 'savuti' },
      { id: 'sv6', name: 'SV 6', parkId: 'savuti' },
      { id: 'cnp21', name: 'CNP 21', parkId: 'savuti' },
      { id: 'hippo-pool', name: 'Hippo Pool', parkId: 'savuti' },
      { id: 'rhino-vlei', name: 'Rhino Vlei', parkId: 'savuti' },
      { id: 'peters-pan', name: "Peter's Pan", parkId: 'savuti' },
      { id: 'smos-main', name: 'SMOS Main', parkId: 'savuti' },
      { id: 'svti', name: 'SVTI', parkId: 'savuti' },
    ],
  },
  {
    id: 'chobe',
    name: 'Chobe National Park',
    sites: [
      { id: 'cnp3', name: 'CNP 3', parkId: 'chobe' },
      { id: 'cnp4', name: 'CNP 4', parkId: 'chobe' },
      { id: 'cnp5', name: 'CNP 5', parkId: 'chobe' },
      { id: 'cnp6', name: 'CNP 6', parkId: 'chobe' },
    ],
  },
  {
    id: 'ckgr',
    name: 'Central Kalahari Game Reserve',
    sites: [
      { id: 'deception-valley', name: 'Deception Valley', parkId: 'ckgr' },
      { id: 'letiahau', name: 'Letiahau', parkId: 'ckgr' },
    ],
  },
  {
    id: 'nxai',
    name: 'Nxai Pan National Park',
    sites: [
      { id: 'nxai1', name: 'Nxai Pan 1', parkId: 'nxai' },
    ],
  },
  {
    id: 'makgadikgadi',
    name: 'Makgadikgadi Pans',
    sites: [
      { id: 'khumaga', name: 'Khumaga', parkId: 'makgadikgadi' },
    ],
  },
  {
    id: 'mababe',
    name: 'Mababe',
    sites: [
      { id: 'phepheng', name: 'Phepheng', parkId: 'mababe' },
    ],
  },
];

export const companies = [
  'Elephant Trails Safari',
  'Shangana Safaris',
  'Wild Africa Safaris',
  'Bush View Tours',
  'Tony Mobile Safari',
  'Royale Wilderness',
  'Central Kalahari Safaris',
  'African Bush Lovers',
  'African Jacana Safaris',
  'Semunyeni Safaris',
  'Torn Nose Safaris',
  'Chase Africa',
  'Umpengu Safaris',
  'Ulinda Safaris',
  'African Bush Safaris',
  'Sky Theme Safaris',
  'Unlimited Safaris',
  'Temogo Safaris',
  'Thru The Looking Glass',
  'Most Travel / Dawn to Dusk',
];

export function getParkById(id: string) {
  return parks.find(p => p.id === id);
}

export function getSiteById(parkId: string, siteId: string) {
  const park = getParkById(parkId);
  return park?.sites.find(s => s.id === siteId);
}
