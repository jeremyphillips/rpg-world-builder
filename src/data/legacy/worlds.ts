// import { campaigns } from "./campaigns"

export const worlds = [
  {
    id: 'aebrynis',
    name: 'Aebrynis',
    description: '',
    campaigns: [ 'birthright' ], 
    continents: [ 'Cerilia' ]
  },
  {
    id: 'demiPlaneOfDread',
    name: 'Demi Plane of Dread',
    description: '',
    campaigns: [ 'ravenloft' ]
  },
  {
    id: 'toril',
    name: 'Toril',
    description: '',
    campaigns: [
      'alQadim',
      'forgottenRealms',
      'spellJammer'
    ]
  },
  {
    id: 'oerth',
    name: 'Oerth',
    description: '',
    campaigns: [
      'blackmoor',
      'greyhawk',
      'spellJammer'
    ]
  },
  { 
    id: 'athas',
    name: 'Athas',
    description: '',
    campaigns: [
      'darkSun'
    ]
  },
  {
    id: 'mystara',
    name: 'Mystara',
    description: '',
    campaigns: [
      'hollowWorld',
      'thunderRift',
      'spellJammer'
    ],
    continents: [ 'Brun', 'Skothar', 'Davania', 'Alphatia' ],
    nations: [ 'Thyatian Empire', 'The Grand Duchy of Karameikos', 'The Principalities of Glantri', 'Republic of Darokin', 'Emirates of Ylaruam', 'Dwarven nation of Rockhome', 'Elven Kingdom of Alfheim', 'Halfling lands of the Five Shires', 'Alphatian Empire' ]
  },
  {
    id: 'nehwon',
    name: 'Nehwon',
    description: '',
    campaigns: [ 'lankhmar' ],
    continents: [],
    nations: [
      { id: 'lankhmar', name: 'Lankhmar', description: 'The primary, corrupt city-state, known for its Thieves\' Guild, Overlord, and reliance on trade.' },
      { id: 'eightCities', name: 'The Land of the Eight Cities', description: 'A neighboring rival region with a rich, though often overlooked, history in the stories.' },
      { id: 'quarmall', name: 'Quarmall', description: 'A decadent, underground, slave-holding society.' },
      { id: 'klesh', name: 'Klesh', description: 'A secretive, mysterious country to the south with impenetrable jungles.' },
      { id: 'coldWaste', name: 'The Cold Waste', description: 'A frigid region often mentioned in the stories.' },
      { id: 'easternLands', name: 'Eastern Lands', description: 'A region frequently mentioned as a source of travelers and characters.' },
      { id: 'kokgnab', name: 'Kokgnab', description: 'A small country known for farming, seafaring, and spices.' },
      { id: 'godsland', name: 'Godsland:', description: 'A mythical location, believed to be near the South Pole, where gods reside.' }
    ]
  }
] 