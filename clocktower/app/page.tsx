import Link from "next/link"


const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Clocktower</h1>
        <p className="text-2xl mb-8">Real-time sharable game clocks.</p>
        <Link href='/login'> Login or Create an account to get started.</Link>
      </div>
    </div>
  )
}

export default Home
