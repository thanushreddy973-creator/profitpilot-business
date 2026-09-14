type ProfitPilotLogoProps = {
  className?: string;
};

export function ProfitPilotLogo({ className }: ProfitPilotLogoProps) {
  return (
    <img
      src="/icons/icon-192.png"
      alt=""
      aria-hidden="true"
      className={className}
      width={192}
      height={192}
    />
  );
}