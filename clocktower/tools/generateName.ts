// generateName.ts
// This file is a tool to generate random names for towers.

const names = {
  firstNames: [
    'Creaky',
    'Grim',
    'Ticking',
    'Rusty',
    'Whirring',
    'Gargantuan',
    'Minuscule',
    'Ancient',
    'Eerie',
    'Mysterious',
    'Spectral',
    'Malevolent',
    'Haunted',
    'Sinister',
    'Ghastly',
    'Chiming',
    'Shadowy',
    'Cryptic',
    'Lurking',
    'Petrifying',
    'Clockwork',
    'Mechanical',
    'Gloomy',
    'Twisted',
    'Grotesque',
    'Rattling',
    'Bizarre',
    'Phantom',
    'Wailing',
    'Gruesome',
  ],
  lastNames: [
    'Timekeeper',
    'Chronomancer',
    'Cogmaster',
    'Bellringer',
    'Hourglass',
    'Winder',
    'Ticktock',
    'Pendulum',
    'Gearsnout',
    'Sundial',
    'Clockface',
    'Oscillator',
    'Springheel',
    'Dialsmith',
    'Numeral',
    'Hands',
    'Quartzfiend',
    'Sprocket',
    'Escapement',
    'Timegrasp',
    'Alarmclaw',
    'Calibrator',
    'Gearwraith',
    'Counter',
    'Balancewheel',
    'Chronoghost',
    'Hourhand',
    'Clockfiend',
    'Mainspring',
    'Torsion',
  ],
}

export const generateName = () => {
  const firstName =
    names.firstNames[Math.floor(Math.random() * names.firstNames.length)]
  const lastName =
    names.lastNames[Math.floor(Math.random() * names.lastNames.length)]
  return `${firstName} ${lastName}`
}
