import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  const emojis = ['❤️', '🐶', '☕️', '❤️‍🩹', '🤖', '👾', '💻']
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
  const currentYear = new Date().getFullYear()
  const copywrite = `© ${currentYear} Turner Monroe`

  return (
      <footer className="bg-gray-800 py-4 bottom-0 w-full">
        <div className="container mx-auto px-4 flex flex-col justify-center items-center text-sm">
        {process.env.NEXT_PUBLIC_DISABLE_ABOUT !== "true" && (
          <div>
            <div className="text-gray-500 text-center mb-2">
              <p>{copywrite}</p>
            </div>
            <div className="text-gray-500 text-center mb-2">
              <p>Made with {randomEmoji} by Turner Monroe</p>
            </div>
          </div>
        )}
        <div className="flex justify-center items-center vibrating-element">
          <Link href="https://github.com/turnercore/clocktower">
            <Image src="/img/github-mark/github-mark-white.svg" alt="GitHub" width="98" height="96" className="h-6 w-6 ml-2" />
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer