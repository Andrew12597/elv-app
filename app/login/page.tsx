import { LoginForm } from './login-form'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/ELV Transparent background.png"
            alt="ELV Australia"
            width={180}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">Internal use only</p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
