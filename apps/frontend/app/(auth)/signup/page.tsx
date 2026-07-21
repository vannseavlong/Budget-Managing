import Image from 'next/image';
import { SignupCard } from '@/components/common/signup-card';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Background with logo and text - Hidden on mobile/tablet */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/background.jpg"
            alt="Background"
            fill
            className="object-cover opacity-50"
            priority
          />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-8 h-full">
          {/* Logo */}
          <div className="flex items-center">
            {/* <span className="ml-2 text-white font-medium">MMMS</span> */}
          </div>

          {/* Main content */}
          <div className="text-white max-w-md">
            <h1 className="text-[32px] font-bold mb-4">
              START YOUR FINANCIAL JOURNEY!
            </h1>
            <p className="text-lg mb-2 opacity-90">
              Create your account to track expenses, manage budgets, and take control of your finances.
            </p>
          </div>

          {/* Bottom spacing */}
          <div></div>
        </div>
      </div>

      {/* Right side - Signup form - Full width on mobile/tablet */}
      <div className="flex-1 lg:flex-1 bg-white flex items-center justify-center p-4 lg:p-8">
        <SignupCard />
      </div>
    </div>
  );
}
