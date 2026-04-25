import Link from 'next/link'
import ThemeAwareSocialIcon from '@/components/layout/ThemeAwareSocialIcon'

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
                <Link
                  href='https://turnercore.dev'
                  className='font-mono tracking-widest hover:underline'
                >
                  @turnercore (turnercore)
                </Link>
              </div>
              <nav
                aria-label='Legal'
                className='mb-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-gray-500'
              >
                <Link className='underline' href='/privacy-policy'>
                  Privacy Policy
                </Link>
                <Link className='underline' href='/terms-of-use'>
                  Terms of Use
                </Link>
                <Link
                  className='underline'
                  href='/cookie-and-local-storage-policy'
                >
                  Cookie & Local Storage Policy
                </Link>
                <Link className='underline' href='/fan-project-disclaimer'>
                  Fan Project Disclaimer
                </Link>
              </nav>
            </div>
          )}
          <div className='text-gray-500 text-center mb-2'>
            <a
              href='mailto:me@turnercore.dev'
              className='hover:underline'
              aria-label='Send feedback via email'
            >
              Feedback
            </a>
          </div>
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
