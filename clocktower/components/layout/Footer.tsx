import Link from 'next/link'
import ThemeAwareSocialIcon from '@/components/ThemeAwareSocialIcon'

const Footer = () => {
  const emojis = ['❤️', '🐶', '☕️', '❤️‍🩹', '🤖', '👾', '💻']
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
  const currentYear = new Date().getFullYear()
  const copywrite = `© ${currentYear} Turner Monroe`
  const darkGithub = '/img/github-mark/github-mark.svg'
  const lightGithub = '/img/github-mark/github-mark-white.svg'

  return (
    <>
      <footer className='bg-gray-800 dark:bg-[#E4ECE5] py-4 bottom-0 w-full'>
        <div className='container mx-auto px-4 flex flex-col justify-center items-center text-sm'>
          {process.env.NEXT_PUBLIC_DISABLE_ABOUT !== 'true' && (
            <div>
              <div className='text-gray-500 text-center mb-2'>
                <p>{copywrite}</p>
              </div>
              <div className='text-gray-500 text-center mb-2'>
                <p>Made with {randomEmoji} by Turner Monroe</p>
                <p className='font-mono tracking-widest'>(turnercore)</p>
              </div>
            </div>
          )}
          <div className='flex justify-center items-center vibrating-element'>
            <Link href='https://github.com/turnercore/clocktower'>
              <ThemeAwareSocialIcon
                iconDark={darkGithub}
                iconLight={lightGithub}
                alt={'GitHub'}
                width={98}
                height={96}
                className={'h-6 w-6 ml-2'}
              />
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer
