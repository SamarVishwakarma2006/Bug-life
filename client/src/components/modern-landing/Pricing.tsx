import SectionHeader from "./SectionHeader";

interface PricingCardProps {
  tier: string;
  tierColor?: string;
  name: string;
  nameColor?: string;
  price: string;
  priceColor?: string;
  btnLabel: string;
  btnLabelColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  btnBg?: string;
  btnBorderColor?: string;
  tierBg?: string;
  tierBorderColor?: string;
  features: { label: string; included: boolean }[];
  accentColor?: string;
}

function PricingCard({
  tier,
  tierColor = "#888888",
  name,
  nameColor = "#F5F5F0",
  price,
  priceColor = "#F5F5F0",
  btnLabel,
  btnLabelColor = "#888888",
  bgColor = "#0F0F0F",
  borderColor = "#2D2D2D",
  borderWidth = 1,
  btnBg = "#1A1A1A",
  btnBorderColor = "#3D3D3D",
  tierBg = "#1A1A1A",
  tierBorderColor = "#3D3D3D",
  features,
  accentColor = "#555555",
}: PricingCardProps) {
  return (
    <div
      className="flex flex-col gap-8 p-8 md:p-[40px] w-full md:flex-1"
      style={{ backgroundColor: bgColor, border: `${borderWidth}px solid ${borderColor}` }}
    >
      <div
        className="flex items-center justify-center h-[28px] px-[12px] w-fit"
        style={{ backgroundColor: tierBg, border: `1px solid ${tierBorderColor}` }}
      >
        <span className="font-ibm-mono text-[11px] tracking-[2px]" style={{ color: tierColor }}>
          {tier}
        </span>
      </div>
      <span className="font-grotesk text-[28px] font-bold tracking-[1px]" style={{ color: nameColor }}>
        {name}
      </span>
      <div className="flex items-end gap-[4px]">
        <span className="font-grotesk text-[48px] font-bold tracking-[-2px] leading-none" style={{ color: priceColor }}>
          {price}
        </span>
        <span className="font-ibm-mono text-[13px] text-[#555555] tracking-[1px] mb-[6px]">/BUGLIFE</span>
      </div>

      {/* Feature list */}
      <div className="flex flex-col gap-[10px]" style={{ borderTop: `1px solid ${borderColor === "#0F0F0F" ? "#2D2D2D" : borderColor}` }}>
        <div className="pt-6 flex flex-col gap-[10px]">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="font-ibm-mono text-[14px] leading-none shrink-0"
                style={{ color: f.included ? accentColor : "#333333" }}
              >
                {f.included ? "+" : "—"}
              </span>
              <span
                className="font-ibm-mono text-[11px] tracking-[1px]"
                style={{ color: f.included ? "#A0A09A" : "#3D3D3D" }}
              >
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <a href={name === "REGISTER" ? "/register" : name === "SIGN IN" ? "/login" : "https://github.com/SamarVishwakarma2006/Bug-life"}
        className="flex items-center justify-center w-full h-[48px] mt-auto"
        style={{ backgroundColor: btnBg, border: `2px solid ${btnBorderColor}` }}
      >
        <span className="font-ibm-mono text-[12px] tracking-[2px]" style={{ color: btnLabelColor }}>
          {btnLabel}
        </span>
      </a>
    </div>
  );
}

const BUILDER_FEATURES = [
  {
    "label": "CREATE YOUR ACCOUNT",
    "included": true
  },
  {
    "label": "CREATE A PROJECT",
    "included": true
  },
  {
    "label": "ADD TEAM MEMBERS",
    "included": true
  },
  {
    "label": "REPORT YOUR FIRST BUG",
    "included": true
  },
  {
    "label": "EXISTING ACCOUNT",
    "included": false
  },
  {
    "label": "REVIEW YOUR ASSIGNMENTS",
    "included": false
  },
  {
    "label": "RETURN TO YOUR PROJECTS",
    "included": false
  },
  {
    "label": "BROWSE THE SOURCE",
    "included": false
  }
];

const ARCHITECT_FEATURES = [
  {
    "label": "YOUR PROJECTS",
    "included": true
  },
  {
    "label": "ASSIGNED BUGS",
    "included": true
  },
  {
    "label": "LIVE NOTIFICATIONS",
    "included": true
  },
  {
    "label": "PROJECT ANALYTICS",
    "included": true
  },
  {
    "label": "TEAM LEADERBOARDS",
    "included": true
  },
  {
    "label": "PROFILE & ACHIEVEMENTS",
    "included": true
  },
  {
    "label": "NEW ACCOUNT",
    "included": false
  },
  {
    "label": "SOURCE REPOSITORY",
    "included": false
  }
];

const SYSTEM_FEATURES = [
  {
    "label": "PROJECT SOURCE",
    "included": true
  },
  {
    "label": "CLIENT CODE",
    "included": true
  },
  {
    "label": "SERVER CODE",
    "included": true
  },
  {
    "label": "SETUP INFORMATION",
    "included": true
  },
  {
    "label": "PROJECT STRUCTURE",
    "included": true
  },
  {
    "label": "AVAILABLE SCRIPTS",
    "included": true
  },
  {
    "label": "CODE ON GITHUB",
    "included": true
  },
  {
    "label": "EXPLORE THE PROJECT",
    "included": true
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="flex flex-col w-full bg-[#080808] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]">
      <SectionHeader
        label="[09] // GET STARTED"
        title={"YOUR NEXT\nSTEP."}
      />

      <div className="flex flex-col md:flex-row w-full gap-[2px]">
        <PricingCard
          tier="NEW ACCOUNT"
          name="REGISTER"
          price="01"
          btnLabel="CREATE ACCOUNT"
          features={BUILDER_FEATURES}
          accentColor="#555555"
        />
        <PricingCard
          tier="YOUR WORKSPACE"
          tierColor="#0A0A0A"
          tierBg="#FFD600"
          tierBorderColor="#FFD600"
          name="SIGN IN"
          nameColor="#FFD600"
          price="02"
          priceColor="#FFD600"
          btnLabel="OPEN WORKSPACE"
          btnLabelColor="#0A0A0A"
          bgColor="#111111"
          borderColor="#FFD600"
          borderWidth={2}
          btnBg="#FFD600"
          btnBorderColor="transparent"
          features={ARCHITECT_FEATURES}
          accentColor="#FFD600"
        />
        <PricingCard
          tier="SOURCE CODE"
          tierColor="#FF6B35"
          tierBorderColor="#FF6B35"
          name="REPOSITORY"
          price="03"
          btnLabel="VIEW ON GITHUB"
          btnLabelColor="#FF6B35"
          btnBorderColor="#FF6B35"
          features={SYSTEM_FEATURES}
          accentColor="#FF6B35"
        />
      </div>
    </section>
  );
}
