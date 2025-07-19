import Header from '../components/Header';

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'>
      <Header />

      <main className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-8 text-center'>
            About the Global Regeneration Ceremony
          </h1>

          <div className='bg-white rounded-2xl shadow-xl p-8 space-y-8'>
            <section>
              <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                Our Mission
              </h2>
              <p className='text-gray-700 leading-relaxed'>
                The Global Regeneration Ceremony is a platform for bioregional
                ritual submission and validation in the symbiotic syntheconomy.
                We facilitate the creation, validation, and sharing of
                culturally authentic rituals that promote ecological harmony and
                spiritual balance.
              </p>
            </section>

            <section>
              <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                AI-Powered Validation
              </h2>
              <div className='grid md:grid-cols-3 gap-6'>
                <div className='text-center p-4 bg-emerald-50 rounded-lg'>
                  <div className='text-3xl mb-2'>🧠</div>
                  <h3 className='font-semibold text-gray-900 mb-2'>ESEP</h3>
                  <p className='text-sm text-gray-600'>
                    Ethical-Spiritual Equilibrium Protocol
                  </p>
                </div>
                <div className='text-center p-4 bg-teal-50 rounded-lg'>
                  <div className='text-3xl mb-2'>🎭</div>
                  <h3 className='font-semibold text-gray-900 mb-2'>CEDA</h3>
                  <p className='text-sm text-gray-600'>
                    Cultural Expression & Diversity Algorithm
                  </p>
                </div>
                <div className='text-center p-4 bg-cyan-50 rounded-lg'>
                  <div className='text-3xl mb-2'>🔍</div>
                  <h3 className='font-semibold text-gray-900 mb-2'>
                    Narrative Forensics
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Polarizing Content Detection
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                Technology Stack
              </h2>
              <div className='grid md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>Frontend</h3>
                  <ul className='text-gray-700 space-y-1'>
                    <li>• Next.js 15 with TypeScript</li>
                    <li>• Material-UI components</li>
                    <li>• Framer Motion animations</li>
                    <li>• Tailwind CSS styling</li>
                  </ul>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>Backend</h3>
                  <ul className='text-gray-700 space-y-1'>
                    <li>• Fastify API with TypeScript</li>
                    <li>• MongoDB Atlas database</li>
                    <li>• IPFS for ritual storage</li>
                    <li>• Base testnet blockchain</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                DAO Governance
              </h2>
              <p className='text-gray-700 leading-relaxed'>
                The Cultural Heritage Council (CHC) oversees ritual validation
                and community governance. Council members are elected through a
                transparent DAO voting process, ensuring diverse representation
                across bioregions and cultural traditions.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
