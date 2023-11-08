'use client'
import * as React from 'react'
interface SVGRProps {
  title?: string
  titleId?: string
  desc?: string
  descId?: string
}
const FooterGradientWaves = ({ title, titleId, desc, descId }: SVGRProps) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='1em'
    height='1em'
    aria-labelledby={titleId}
    aria-describedby={descId}
  >
    {desc ? <desc id={descId}>{desc}</desc> : null}
    {title ? <title id={titleId}>{title}</title> : null}
    <path fill='#fcfdfc' d='M0 0h540v960H0z' />
    <path
      fill='#e2ece5'
      d='m0 847 77 5 77 22 77-16 78 1 77 13 77-8 77 16v81H0Z'
    />
    <path
      fill='#c9dad0'
      d='m0 891 77-11 77-18 77 24 78 6 77-6 77-2 77-16v93H0Z'
    />
    <path
      fill='#b1c8bd'
      d='m0 886 77 7 77 3 77-14 78-3 77 21 77-17 77 9v69H0Z'
    />
    <path
      fill='#98b6ab'
      d='m0 896 77 17 77-5 77-2 78-7 77 5 77 8 77-16v65H0Z'
    />
    <path fill='#7ea59b' d='m0 910 77 2 77 10 77-2 78 1 77-7 77-2 77 1v48H0Z' />
    <path fill='#65948b' d='M0 930h154l77 1 78 3 77-8 77 4 77-2v33H0Z' />
  </svg>
)
export default FooterGradientWaves
