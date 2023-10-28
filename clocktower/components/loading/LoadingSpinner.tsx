import './styles/LoadingSpinner.css';
export const LoadingSpinner = ({ className }: { className: string }) => {
  return (
    <div className={className ? className : 'flex items-center justify-center h-screen'}>
      <div className="clock-face">
        <div className="hour-hand" />
        <div className="minute-hand" />
      </div>
    </div>
  );
}

export default LoadingSpinner;
