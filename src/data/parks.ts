import { Park } from './types';

export const RATE_PER_NIGHT = 350;

export const parks: Park[] = [
  {
    id: 'moremi',
    name: 'Moremi Game Reserve',
    description: 'The crown jewel of the Okavango Delta — pristine wetlands teeming with wildlife.',
    image: 'moremi',
    sites: [
      { id: 'smot', name: 'SMOT', parkId: 'moremi', coordinates: 'S19°14\'12", E23°20\'56"' },
      { id: 'mgr10', name: 'MGR 10', parkId: 'moremi', coordinates: 'S19°14\'50", E23°23\'39"' },
      { id: 'maqwegana', name: 'Maqwegana', parkId: 'moremi', coordinates: 'S19°13\'33", E23°24\'09"' },
      { id: 'smox1', name: 'SMOX 1', parkId: 'moremi', coordinates: 'S19°11\'43", E23°24\'50"' },
      { id: 'smox2', name: 'SMOX 2', parkId: 'moremi', coordinates: 'S19°11\'21", E23°25\'13"' },
      { id: 'smox3', name: 'SMOX 3', parkId: 'moremi', coordinates: 'S19°12\'51", E23°24\'16"' },
      { id: 'xakanaxa', name: 'Xakanaxa', parkId: 'moremi', coordinates: 'S19°14\'28", E23°31\'20"' },
      { id: 'second-bridge', name: 'Second Bridge', parkId: 'moremi', coordinates: 'S19°16\'52", E23°22\'36"' },
      { id: 'xinni-main', name: 'Xiini Main', parkId: 'moremi', coordinates: 'S19°22\'17", E23°29\'45"' },
      { id: 'xinni-2', name: 'Xiini 2', parkId: 'moremi', coordinates: 'S19°22\'30", E23°30\'07"' },
      { id: 'xinni-3', name: 'Xiini 3', parkId: 'moremi', coordinates: 'S19°22\'13", E23°30\'16"' },
      { id: 'xinni-reserve', name: 'Xiini Reserve', parkId: 'moremi', coordinates: 'S19°22\'09", E23°29\'39"' },
      { id: 'black-pool', name: 'Black Pool', parkId: 'moremi', coordinates: 'S19°29\'20", E23°32\'39"' },
    ],
  },
  {
    id: 'khwai',
    name: 'Khwai Community Area',
    description: 'Community-managed concession bordering Moremi — famous for predator sightings.',
    image: 'moremi',
    sites: [
      { id: 'samahundu', name: 'Samahundu', parkId: 'khwai', coordinates: 'S19°11\'38", E23°39\'50"' },
      { id: 'dombo-hpool', name: 'Dombo Hippo Pool', parkId: 'khwai', coordinates: 'S19°11\'47", E23°39\'06"' },
      { id: 'smok3', name: 'SMOK 3', parkId: 'khwai', coordinates: 'S19°10\'45", E23°44\'06"' },
      { id: 'smok-main', name: 'SMOK Main', parkId: 'khwai', coordinates: 'S19°10\'08", E23°45\'15"' },
      { id: 'smok-reserve', name: 'SMOK Reserve', parkId: 'khwai', coordinates: 'S19°10\'10", E23°45\'14"' },
      { id: 'smok2', name: 'SMOK 2', parkId: 'khwai', coordinates: 'S19°10\'09", E23°45\'20"' },
    ],
  },
  {
    id: 'savuti',
    name: 'Savuti / Linyanti',
    description: 'Legendary predator country with the famous Savuti Channel and vast marshlands.',
    image: 'chobe',
    sites: [
      { id: 'cnp21', name: 'CNP 21', parkId: 'savuti', coordinates: 'S18°34\'27", E24°04\'54"' },
      { id: 'smos-main', name: 'SMOS Main', parkId: 'savuti', coordinates: 'S18°34\'22", E24°04\'17"' },
      { id: 'smos-reserve', name: 'SMOS Reserve', parkId: 'savuti', coordinates: 'S18°34\'19", E24°04\'33"' },
      { id: 'sv1', name: 'SV 1', parkId: 'savuti', coordinates: 'S18°34\'31", E24°04\'56"' },
      { id: 'sv2', name: 'SV 2', parkId: 'savuti', coordinates: 'S18°34\'14", E24°04\'36"' },
      { id: 'sv3', name: 'SV 3', parkId: 'savuti', coordinates: 'S18°34\'13", E24°04\'45"' },
      { id: 'sv4', name: 'SV 4', parkId: 'savuti', coordinates: 'S18°34\'22", E24°04\'17"' },
      { id: 'hippo-pool', name: 'Hippo Pool', parkId: 'savuti', coordinates: 'S18°37\'00", E24°04\'23"' },
      { id: 'sv6', name: 'SV 6', parkId: 'savuti', coordinates: 'S18°36\'53", E24°04\'05"' },
      { id: 'sv7', name: 'SV 7', parkId: 'savuti', coordinates: 'S18°40\'53", E24°02\'12"' },
      { id: 'rhino-vlei', name: 'Rhino Vlei', parkId: 'savuti', coordinates: 'S18°38\'00", E24°05\'17"' },
      { id: 'svt1', name: 'SVT 1', parkId: 'savuti', coordinates: 'S18°36\'49", E24°04\'04"' },
      { id: 'leopard-rock', name: 'Leopard Rock', parkId: 'savuti', coordinates: 'S18°37\'02", E24°04\'21"' },
      { id: 'peters-pan', name: "Peter's Pan", parkId: 'savuti', coordinates: 'S18°36\'46", E24°04\'22"' },
    ],
  },
  {
    id: 'chobe',
    name: 'Chobe National Park',
    description: 'Home to Africa\'s largest elephant population — riverfront camps with incredible views.',
    image: 'chobe',
    sites: [
      { id: 'cnp3', name: 'CNP 3', parkId: 'chobe', coordinates: 'S17°51\'21", E24°53\'09"' },
      { id: 'cnp4', name: 'CNP 4', parkId: 'chobe', coordinates: 'S17°50\'10", E24°55\'25"' },
      { id: 'cnp5', name: 'CNP 5', parkId: 'chobe', coordinates: 'S17°49\'58", E24°55\'17"' },
      { id: 'cnp6', name: 'CNP 6', parkId: 'chobe', coordinates: 'S17°49\'56", E24°55\'29"' },
      { id: 'madambuzwa', name: 'Madambuzwa', parkId: 'chobe', coordinates: 'S17°55\'29", E25°09\'29"' },
      { id: 'nantanga', name: 'Nantanga', parkId: 'chobe', coordinates: 'S17°56\'14", E25°00\'56"' },
    ],
  },
  {
    id: 'ckgr',
    name: 'Central Kalahari Game Reserve',
    description: 'One of the world\'s largest game reserves — vast desert landscapes and ancient valleys.',
    image: 'kalahari',
    sites: [
      { id: 'deception1', name: 'Deception Valley 1', parkId: 'ckgr', coordinates: 'S21°23\'10", E23°47\'34"' },
      { id: 'deception2', name: 'Deception Valley 2', parkId: 'ckgr', coordinates: 'S21°26\'00", E23°47\'34"' },
      { id: 'deception3', name: 'Deception Valley 3', parkId: 'ckgr', coordinates: 'S21°26\'13", E23°47\'41"' },
      { id: 'deception4', name: 'Deception Valley 4', parkId: 'ckgr', coordinates: 'S21°26\'21", E23°47\'41"' },
      { id: 'letiahau', name: 'Letiahau', parkId: 'ckgr' },
    ],
  },
  {
    id: 'nxai',
    name: 'Nxai Pan National Park',
    description: 'Famous for Baines\' Baobabs and the annual zebra migration across salt pans.',
    image: 'kalahari',
    sites: [
      { id: 'nxai1', name: 'Nxai Pan 1', parkId: 'nxai', coordinates: 'S19°56\'30", E24°47\'43"' },
      { id: 'nxai2', name: 'Nxai Pan 2', parkId: 'nxai', coordinates: 'S19°55\'32", E24°43\'41"' },
      { id: 'nxai3', name: 'Nxai Pan 3', parkId: 'nxai', coordinates: 'S19°54\'56", E24°43\'27"' },
    ],
  },
  {
    id: 'makgadikgadi',
    name: 'Makgadikgadi Pans',
    description: 'Ancient salt pans stretching to the horizon — surreal landscapes and meerkats.',
    image: 'kalahari',
    sites: [
      { id: 'khumaga1', name: 'Khumaga 1', parkId: 'makgadikgadi' },
      { id: 'khumaga2', name: 'Khumaga 2', parkId: 'makgadikgadi', coordinates: 'S20°24\'22", E24°31\'39"' },
      { id: 'khumaga3', name: 'Khumaga 3', parkId: 'makgadikgadi', coordinates: 'S20°23\'13", E24°28\'58"' },
    ],
  },
  {
    id: 'mababe',
    name: 'Mababe Depression',
    description: 'Remote wilderness area connecting Moremi and Chobe — off the beaten track.',
    image: 'moremi',
    sites: [
      { id: 'cmb3', name: 'CMB 3', parkId: 'mababe', coordinates: 'S19°05\'39", E23°59\'14"' },
      { id: 'phepheng', name: 'Phepheng', parkId: 'mababe', coordinates: 'S19°02\'38", E23°59\'35"' },
      { id: 'monare', name: 'Monare', parkId: 'mababe', coordinates: 'S19°10\'48", E23°59\'08"' },
      { id: 'mababe-site', name: 'Mababe', parkId: 'mababe', coordinates: 'S19°01\'39", E23°59\'02"' },
      { id: 'lebala1', name: 'Lebala 1', parkId: 'mababe', coordinates: 'S19°04\'53", E23°59\'34"' },
      { id: 'lebala2', name: 'Lebala 2', parkId: 'mababe', coordinates: 'S19°04\'48", E23°59\'35"' },
      { id: 'bothatogo', name: 'Bothatogo', parkId: 'mababe', coordinates: 'S19°01\'43", E23°58\'32"' },
      { id: 'masaitseweng', name: 'Masaitseweng', parkId: 'mababe', coordinates: 'S19°06\'22", E24°00\'04"' },
    ],
  },
  {
    id: 'xakanaxa-islands',
    name: 'Xakanaxa Islands',
    description: 'Island campsites accessible by mokoro in the heart of the Delta.',
    image: 'moremi',
    sites: [
      { id: 'gwetshaa', name: 'Gwetshaa', parkId: 'xakanaxa-islands', coordinates: 'S19°09\'21", E23°12\'37"' },
      { id: 'dasakao', name: 'Dasakao', parkId: 'xakanaxa-islands', coordinates: 'S19°07\'08", E23°19\'40"' },
      { id: 'gadikwe3', name: 'Gadikwe 3', parkId: 'xakanaxa-islands', coordinates: 'S19°09\'34", E23°13\'58"' },
    ],
  },
  {
    id: 'boga-reserve',
    name: 'BOGA Reserve',
    description: 'The official BOGA campsite in Maun — managed directly by the Botswana Guides Association.',
    image: 'moremi',
    sites: [
      { id: 'boga-camp-1', name: 'Camp 1', parkId: 'boga-reserve' },
      { id: 'boga-camp-2', name: 'Camp 2', parkId: 'boga-reserve' },
      { id: 'boga-camp-3', name: 'Camp 3', parkId: 'boga-reserve' },
      { id: 'boga-camp-4', name: 'Camp 4', parkId: 'boga-reserve' },
      { id: 'boga-camp-5', name: 'Camp 5', parkId: 'boga-reserve' },
      { id: 'boga-camp-6', name: 'Camp 6', parkId: 'boga-reserve' },
      { id: 'boga-camp-7', name: 'Camp 7', parkId: 'boga-reserve' },
      { id: 'boga-camp-8', name: 'Camp 8', parkId: 'boga-reserve' },
      { id: 'boga-camp-9', name: 'Camp 9', parkId: 'boga-reserve' },
      { id: 'boga-camp-10', name: 'Camp 10', parkId: 'boga-reserve' },
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
