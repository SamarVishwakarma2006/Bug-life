const productLinks = ["FEATURES", "TEAM ROLES", "WORKSPACE", "GET STARTED"];
const companyLinks = ["ABOUT", "SIGN IN", "REGISTER"];
const resourceLinks = ["REPOSITORY", "SOURCE CODE", "FAQ"];

export default function Footer() {
  return (
    <footer className="flex flex-col w-full bg-[#050505]">
      {/* Top */}
      <div className="flex flex-col md:flex-row gap-12 md:gap-[80px] px-6 md:px-[120px] py-12 md:py-[64px]">
        {/* Brand */}
        <div className="flex flex-col gap-6 md:w-[280px] md:shrink-0">
          <div className="flex items-center gap-[12px]">
            <div className="w-[32px] h-[32px] bg-[#FFD600] shrink-0" />
            <span className="font-grotesk text-[16px] font-bold text-[#FFD600] tracking-[3px]">
              BUGLIFE
            </span>
          </div>
          <p className="font-ibm-mono text-[11px] text-[#888888] tracking-[1px] leading-[1.6] max-w-[260px]">
            THE REAL-TIME BUG TRACKER FOR TEAMS THAT SHIP WITHOUT FEAR.
          </p>
          <div className="flex gap-[12px]">
            {[{ label: "IN", href: "/login", name: "Sign in" }, { label: "GH", href: "https://github.com/SamarVishwakarma2006/Bug-life", name: "GitHub repository" }, { label: "GO", href: "/register", name: "Create account" }].map((s) => (
              <a href={s.href} aria-label={s.name}
                key={s.label}
                className="flex items-center justify-center w-[36px] h-[36px] bg-[#111111] border border-[#2D2D2D] hover:border-[#888888] transition-colors"
              >
                <span                   className="font-grotesk text-[10px] font-bold text-[#AAAAAA]">
                  {s.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-3 md:flex md:flex-1 gap-8 md:gap-[80px]">
          {[
            { heading: "PRODUCT", links: productLinks },
            { heading: "BUGLIFE", links: companyLinks },
            { heading: "RESOURCES", links: resourceLinks },
          ].map((col) => (
            <div key={col.heading} className="flex flex-col gap-4 md:gap-[20px]">
              <span className="font-grotesk text-[11px] font-bold text-[#F5F5F0] tracking-[2px]">
                {col.heading}
              </span>
              {col.links.map((link) => (
                <a
                  key={link}
                  href={({ FEATURES: "#features", "TEAM ROLES": "#comparison", WORKSPACE: "/login", "GET STARTED": "#pricing", ABOUT: "#faq", "SIGN IN": "/login", REGISTER: "/register", FAQ: "#faq" } as Record<string, string>)[link] ?? "https://github.com/SamarVishwakarma2006/Bug-life"}
                  className="font-ibm-mono text-[12px] text-[#888888] tracking-[1px] hover:text-[#CCCCCC] transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full px-6 md:px-[120px] py-4 md:h-[56px] border-t border-t-[#1D1D1D] gap-3 sm:gap-0">
        <span className="font-ibm-mono text-[11px] text-[#666666] tracking-[1px]">
          © 2026 BUGLIFE. ALL RIGHTS RESERVED.
        </span>
        <div className="flex items-center gap-6 md:gap-[32px]">
          <a href="https://github.com/SamarVishwakarma2006/Bug-life" className="font-ibm-mono text-[11px] text-[#666666] tracking-[1px] hover:text-[#AAAAAA] transition-colors">
            REPOSITORY
          </a>
          <a href="https://github.com/SamarVishwakarma2006/Bug-life" className="font-ibm-mono text-[11px] text-[#666666] tracking-[1px] hover:text-[#AAAAAA] transition-colors">
            SOURCE CODE
          </a>
          <span className="font-ibm-mono text-[11px] font-bold text-[#FFD600] tracking-[1px]">
            BUGLIFE
          </span>
        </div>
      </div>
    </footer>
  );
}
