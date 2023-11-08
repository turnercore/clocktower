'use client'
import { usePathname } from 'next/navigation'

const HeaderTriangleDecoration = () => {
  const pathname = usePathname()
  const isOnTowerPage = pathname.includes('tower') && !pathname.includes('new')

  return (
    <>
      {isOnTowerPage ? (
        <div className='absolute bottom-0 left-0 right-0 flex justify-center items-end'>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-transparent border-t-[10px] border-t-[#D7E8E4] dark:border-t-[#25303A]'></div>
        </div>
      ) : (
        <div className='absolute bottom-0 left-0 right-0 flex justify-center items-end'>
          <div className='after:content-[""] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-l-[10px] after:border-l-transparent after:border-r-[10px] after:border-r-transparent after:border-t-[10px] after:border-t-transparent after:border-b-[10px] after:border-b-[#FFFFFF] dark:after:border-b-[#030816] after:w-0 after:h-0'></div>
        </div>
      )}
    </>
  )
}
export default HeaderTriangleDecoration
