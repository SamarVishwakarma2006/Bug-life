import SectionHeader from "./SectionHeader";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  bgColor?: string;
  accentColor: string;
}

function TestimonialCard({
  quote,
  name,
  role,
  bgColor = "#111111",
  accentColor,
}: TestimonialCardProps) {
  return (
    <div
      className="flex flex-col gap-6 p-8 md:p-[40px] border-l-4 w-full md:flex-1"
      style={{ backgroundColor: bgColor, borderLeftColor: accentColor }}
    >
      <p className="font-ibm-mono text-[13px] text-[#CCCCCC] tracking-[1px] leading-[1.6]">
        {quote}
      </p>
      <div className="flex items-center gap-[12px]">
        <div className="w-[36px] h-[36px] rounded-full bg-[#333333] shrink-0" />
        <div className="flex flex-col gap-[2px]">
          <span className="font-grotesk text-[13px] font-bold text-[#F5F5F0] tracking-[1px]">
            {name}
          </span>
          <span className="font-ibm-mono text-[11px] text-[#555555] tracking-[1px]">
            {role}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]">
      <SectionHeader
        label="[04] // TEAM WORKFLOWS"
        title={"CLEAR ROLES.\nSHARED PROGRESS."}
      />

      <div className="flex flex-col md:flex-row w-full gap-[2px]">
        <TestimonialCard
          quote="CREATE PROJECTS, ADD TEAM MEMBERS AND SET THEIR ROLES. KEEP THE WORK ORGANIZED."
          name="PROJECT OWNER"
          role="MEMBERS & PROJECTS"
          accentColor="#FFD600"
        />
        <TestimonialCard
          quote="REVIEW SUBMITTED FIXES. RESOLVE VERIFIED BUGS OR REOPEN THEM FOR MORE WORK."
          name="REVIEWER"
          role="REVIEW & APPROVAL"
          bgColor="#0D0D0D"
          accentColor="#FF6B35"
        />
        <TestimonialCard
          quote="REPORT BUGS, WORK ON ASSIGNED ISSUES AND SUBMIT FIXES FOR REVIEW."
          name="DEVELOPER"
          role="REPORT & FIX"
          accentColor="#F5F5F0"
        />
      </div>
    </section>
  );
}
