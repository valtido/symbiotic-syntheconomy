import Header from '../components/Header';

export const metadata = {
  title: 'Global Regeneration Ceremony - Symbiotic Syntheconomy',
  description:
    'A platform for bioregional ritual submission and validation in the symbiotic syntheconomy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='bg-gray-50 min-h-screen'>
        <Header />
        <main className='flex-1'>{children}</main>
      </body>
    </html>
  );
}
