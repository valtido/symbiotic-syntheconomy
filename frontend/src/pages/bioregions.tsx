import Header from '../components/Header';

export default function BioregionsPage() {
  const bioregions = [
    {
      id: 'tech-haven',
      name: 'Tech Haven',
      emoji: '🏙️',
      description:
        'Digital innovation, sustainable technology, and urban regeneration',
      characteristics: [
        'Smart city integration',
        'Renewable energy focus',
        'Digital community building',
        'Urban biodiversity restoration',
      ],
      traditions: [
        'Digital solstice celebrations',
        'Tech meditation practices',
        'Urban farming rituals',
        'Community hackathons',
      ],
    },
    {
      id: 'mythic-forest',
      name: 'Mythic Forest',
      emoji: '🌲',
      description: 'Ancient wisdom, biodiversity, and spiritual connection',
      characteristics: [
        'Old-growth forest preservation',
        'Indigenous knowledge systems',
        'Biodiversity corridors',
        'Sacred grove protection',
      ],
      traditions: [
        'Seasonal equinox ceremonies',
        'Forest meditation practices',
        'Plant medicine rituals',
        'Animal spirit connections',
      ],
    },
    {
      id: 'isolated-bastion',
      name: 'Isolated Bastion',
      emoji: '🏰',
      description: 'Self-sufficiency, resilience, and community autonomy',
      characteristics: [
        'Off-grid living systems',
        'Local food production',
        'Community defense networks',
        'Traditional craftsmanship',
      ],
      traditions: [
        'Harvest festivals',
        'Community defense rituals',
        'Craft guild ceremonies',
        'Seasonal preparation rites',
      ],
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'>
      <Header />

      <main className='container mx-auto px-4 py-8'>
        <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-8 text-center'>
          Bioregions
        </h1>

        <div className='max-w-6xl mx-auto space-y-8'>
          {bioregions.map((bioregion) => (
            <div
              key={bioregion.id}
              className='bg-white rounded-2xl shadow-xl p-8'
            >
              <div className='flex items-center mb-6'>
                <div className='text-6xl mr-6'>{bioregion.emoji}</div>
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 mb-2'>
                    {bioregion.name}
                  </h2>
                  <p className='text-xl text-gray-600'>
                    {bioregion.description}
                  </p>
                </div>
              </div>

              <div className='grid md:grid-cols-2 gap-8'>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                    Characteristics
                  </h3>
                  <ul className='space-y-2'>
                    {bioregion.characteristics.map((char, index) => (
                      <li
                        key={index}
                        className='flex items-center text-gray-700'
                      >
                        <span className='w-2 h-2 bg-emerald-500 rounded-full mr-3'></span>
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                    Cultural Traditions
                  </h3>
                  <ul className='space-y-2'>
                    {bioregion.traditions.map((tradition, index) => (
                      <li
                        key={index}
                        className='flex items-center text-gray-700'
                      >
                        <span className='w-2 h-2 bg-teal-500 rounded-full mr-3'></span>
                        {tradition}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
