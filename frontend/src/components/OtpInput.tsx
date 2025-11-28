import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface OtpInputProps {
  phoneNumber: string; // Keep for backward compatibility, but will contain email
  onBack: () => void;
  onVerify: (otp: string) => void;
  onResend: () => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ phoneNumber, onBack, onVerify, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode: string) => {
    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      setIsVerifying(false);
      onVerify(otpCode);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white">Verify OTP</h2>
      </div>

      <div className="space-y-4">
        <p className="text-gray-400 text-sm">
          Enter the 6-digit code sent to {phoneNumber}
        </p>

        <div className="flex space-x-3 justify-center">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          ))}
        </div>

        <button
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.some(digit => digit === '') || isVerifying}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            otp.every(digit => digit !== '') && !isVerifying
              ? 'bg-gray-300 text-gray-900 hover:bg-white active:scale-95'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isVerifying ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button
          onClick={onResend}
          className="w-full text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
};

export default OtpInput;