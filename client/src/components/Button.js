import './Button.css'
function Button({ text, onClick, variant = 'primary', size = 'md', className = '', trackingId = '', disabled = false, href = '' }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default Button;
