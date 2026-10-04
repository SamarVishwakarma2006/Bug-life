"use client"

import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, ReactNode } from "react"
import { Bug } from "lucide-react"

type Status = "idle" | "loading" | "success"
type Step = "email" | "password"
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export interface LoginHeroProps {
  /** Resolve on success; throw an Error with a user-facing message on failure. */
  onLogin: (email: string, password: string) => Promise<void>
  /** Called after the success animation, e.g. navigate to the dashboard. */
  onSuccess?: () => void
  title?: string
  subtitle?: string
  successText?: string
  /** Optional logo image URL. Falls back to a bug icon. */
  logoSrc?: string
  /** Rendered under the form, e.g. a "Create an account" link. */
  footer?: ReactNode
  initialEmail?: string
  redirectDelayMs?: number
}

// Local files downloaded to client/public/login/ to avoid external CDN dependency.
const IMAGES = {
  back: "/login/back.png",
  middle: "/login/middle.png",
  front: "/login/front.png",
}

const colors = {
  textMain: "#ffffff",
  textSecondary: "#94a3b8",
  bluePrimary: "#0079da",
  success: "#10b981",
  inputBg: "#27272a",
  baseBg: "#09090b",
  inputShadow: "rgba(255, 255, 255, 0.1)",
  error: "#f87171",
}

const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]"

export function LoginHero({
  onLogin,
  onSuccess,
  title = "Log in to BugLife",
  subtitle = "Because Every Project Has Bugs.",
  successText = "Welcome back!",
  logoSrc,
  footer,
  initialEmail = "",
  redirectDelayMs = 1400,
}: LoginHeroProps) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<Step>("email")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const firstRender = useRef(true)

  // Clean up animation frame and redirect timer on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Move focus when the step changes (not on first paint).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (step === "password") passwordRef.current?.focus()
    else emailRef.current?.focus()
  }, [step])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status !== "idle") return
    setError(null)

    if (step === "email") {
      if (!email.trim()) return
      setStep("password")
      return
    }

    if (!password) return
    setStatus("loading")
    try {
      await onLogin(email.trim(), password)
      setStatus("success")
      setPassword("")
      fireConfetti()
      timerRef.current = window.setTimeout(() => onSuccess?.(), redirectDelayMs)
    } catch (err) {
      setStatus("idle")
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
      passwordRef.current?.focus()
    }
  }

  const backToEmail = () => {
    setError(null)
    setPassword("")
    setStep("email")
  }

  // --- Confetti ---
  const fireConfetti = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const particles: Particle[] = []
    const palette = ["#0079da", "#10b981", "#fbbf24", "#f472b6", "#fff"]

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    for (let i = 0; i < 50; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)] ?? "#0079da"
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 2) * 10,
        life: 100,
        color,
        size: Math.random() * 4 + 2,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (particles.length === 0) {
        ctx.globalAlpha = 1
        rafRef.current = null
        return
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.5
        p.life -= 2

        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.life / 100)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.life <= 0) {
          particles.splice(i, 1)
          i--
        }
      }

      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(animate)
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    animate()
  }

  const isSuccess = status === "success"
  const isLoading = status === "loading"

  return (
    <div className="w-full min-h-[100svh] bg-black flex items-center justify-center">
      <style>{`
        @keyframes lh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes lh-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes lh-bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lh-success-pulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lh-success-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 60px rgba(16, 185, 129, 0.8), 0 0 100px rgba(16, 185, 129, 0.4); }
        }
        @keyframes lh-check { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
        @keyframes lh-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes lh-step-in {
          0% { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .lh-spin-slow { animation: lh-spin 60s linear infinite; }
        .lh-spin-slow-reverse { animation: lh-spin-rev 60s linear infinite; }
        .lh-bounce-in { animation: lh-bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .lh-success {
          animation:
            lh-success-pulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
            lh-success-glow 2s ease-in-out 0.6s infinite;
        }
        .lh-checkmark { stroke-dasharray: 24; stroke-dashoffset: 24; animation: lh-check 0.4s ease-out 0.3s forwards; }
        .lh-ring { animation: lh-ring 0.8s ease-out forwards; }
        .lh-step { animation: lh-step-in 0.25s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .lh-spin-slow, .lh-spin-slow-reverse, .lh-bounce-in, .lh-success, .lh-ring, .lh-step { animation: none !important; }
          .lh-checkmark { animation: none !important; stroke-dashoffset: 0; }
        }
      `}</style>

      <div
        className="relative w-full h-[100svh] overflow-hidden shadow-2xl"
        style={{
          backgroundColor: colors.baseBg,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Background decorative layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            perspective: "1200px",
            transform: "perspective(1200px) rotateX(15deg)",
            transformOrigin: "center bottom",
          }}
        >
          <div className="absolute inset-0 lh-spin-slow">
            <div
              className="absolute top-1/2 left-1/2"
              style={{ width: "2000px", height: "2000px", transform: "translate(-50%, -50%) rotate(279.05deg)", zIndex: 0 }}
            >
              <img src={IMAGES.back} alt="" className="w-full h-full object-cover opacity-50" />
            </div>
          </div>

          <div className="absolute inset-0 lh-spin-slow-reverse">
            <div
              className="absolute top-1/2 left-1/2"
              style={{ width: "1000px", height: "1000px", transform: "translate(-50%, -50%) rotate(304.42deg)", zIndex: 1 }}
            >
              <img src={IMAGES.middle} alt="" className="w-full h-full object-cover opacity-60" />
            </div>
          </div>

          <div className="absolute inset-0 lh-spin-slow">
            <div
              className="absolute top-1/2 left-1/2"
              style={{ width: "800px", height: "800px", transform: "translate(-50%, -50%) rotate(48.33deg)", zIndex: 2 }}
            >
              <img src={IMAGES.front} alt="" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
        </div>

        {/* Gradient overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${colors.baseBg} 10%, rgba(9, 9, 11, 0.8) 40%, transparent 100%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-end pb-24 gap-6">
          <div
            className="w-16 h-16 rounded-2xl shadow-lg overflow-hidden mb-2 ring-1 ring-white/10 flex items-center justify-center"
            style={{ backgroundColor: colors.inputBg }}
          >
            {logoSrc ? (
              <img src={logoSrc} alt="BugLife" className="w-full h-full object-cover" />
            ) : (
              <Bug className="w-8 h-8" style={{ color: colors.bluePrimary }} aria-hidden="true" />
            )}
          </div>

          <h1
            className="text-5xl md:text-6xl font-bold text-center tracking-tight px-4"
            style={{ color: colors.textMain }}
          >
            {title}
          </h1>

          <p className="text-lg font-medium text-center px-4" style={{ color: colors.textSecondary }}>
            {subtitle}
          </p>

          {/* Form / success container */}
          <div className="w-full max-w-md px-4 mt-4 h-[60px] relative">
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-50"
            />

            {/* Success state */}
            <div
              role="status"
              aria-live="polite"
              className={`absolute inset-0 flex items-center justify-center rounded-full transition-all duration-500 ${EASE} ${
                isSuccess ? "opacity-100 lh-success" : "opacity-0 pointer-events-none"
              }`}
              style={{
                backgroundColor: colors.success,
                transform: isSuccess
                  ? "perspective(800px) rotateX(0deg) scale(1)"
                  : "perspective(800px) rotateX(-90deg) scale(0.95)",
              }}
            >
              {isSuccess && (
                <>
                  <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-emerald-400 lh-ring" />
                  <div
                    className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-emerald-300 lh-ring"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-emerald-200 lh-ring"
                    style={{ animationDelay: "0.3s" }}
                  />
                </>
              )}
              <div className={`flex items-center gap-2 text-white font-semibold text-lg ${isSuccess ? "lh-bounce-in" : ""}`}>
                <div className="bg-white/20 p-1 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      className={isSuccess ? "lh-checkmark" : ""}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span>{successText}</span>
              </div>
            </div>

            {/* Form state */}
            <form
              onSubmit={handleSubmit}
              className={`relative w-full h-full transition-all duration-500 ${EASE} ${
                isSuccess ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              style={{
                transform: isSuccess
                  ? "perspective(800px) rotateX(90deg) scale(0.95)"
                  : "perspective(800px) rotateX(0deg) scale(1)",
              }}
            >
              {step === "email" ? (
                <input
                  key="email"
                  ref={emailRef}
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  aria-label="Email address"
                  placeholder="name@email.com"
                  value={email}
                  disabled={isLoading}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ block: "center", behavior: "smooth" })}
                  className="lh-step w-full h-[60px] pl-6 pr-[150px] rounded-full outline-none transition-all duration-200 placeholder-zinc-500 focus-visible:ring-2 focus-visible:ring-[#0079da] disabled:opacity-70 disabled:cursor-not-allowed scroll-mb-16"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textMain,
                    boxShadow: `inset 0 0 0 1px ${colors.inputShadow}`,
                  }}
                />
              ) : (
                <input
                  key="password"
                  ref={passwordRef}
                  type="password"
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                  placeholder="Password"
                  value={password}
                  disabled={isLoading}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ block: "center", behavior: "smooth" })}
                  className="lh-step w-full h-[60px] pl-6 pr-[150px] rounded-full outline-none transition-all duration-200 placeholder-zinc-500 focus-visible:ring-2 focus-visible:ring-[#0079da] disabled:opacity-70 disabled:cursor-not-allowed scroll-mb-16"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textMain,
                    boxShadow: `inset 0 0 0 1px ${error ? colors.error : colors.inputShadow}`,
                  }}
                />
              )}

              <div className="absolute top-[6px] right-[6px] bottom-[6px]">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-full px-6 rounded-full font-medium text-white transition-all active:scale-95 hover:brightness-110 disabled:hover:brightness-100 disabled:active:scale-100 disabled:cursor-wait flex items-center justify-center min-w-[130px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={{ backgroundColor: colors.bluePrimary }}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-label="Logging in"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : step === "email" ? (
                    "Continue"
                  ) : (
                    "Log in"
                  )}
                </button>
              </div>
            </form>

            {/* Under the pill: error, back link, footer. Absolute so the pill never jumps. */}
            <div
              className={`absolute left-0 right-0 top-full mt-4 px-4 flex flex-col items-center gap-2 text-center transition-opacity duration-300 ${
                isSuccess ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              {error && (
                <p role="alert" className="text-sm" style={{ color: colors.error }}>
                  {error}
                </p>
              )}
              {step === "password" && (
                <button
                  type="button"
                  onClick={backToEmail}
                  disabled={isLoading}
                  className="text-sm text-zinc-400 hover:text-white underline-offset-4 hover:underline disabled:opacity-60"
                >
                  &larr; Use a different email
                </button>
              )}
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginHero
