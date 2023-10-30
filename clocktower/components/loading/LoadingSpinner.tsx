import './styles/LoadingSpinner.css'

type LoadingSpinnerProps = {
  className?: string
}
export const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <div
      className={
        className ? className : 'flex items-center justify-center h-screen'
      }
    >
      <div className='clock-face'>
        <div className='hour-hand' />
        <div className='minute-hand' />
      </div>
    </div>
  )
}

export default LoadingSpinner
