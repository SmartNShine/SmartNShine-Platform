import Dashboard3DButton from "@/components/dashboard/Dashboard3DButton";

const TPO_VARIANTS = {
  primary: "tpoPrimary",
  surface: "tpoSurface",
  ghost: "tpoGhost",
  danger: "tpoDanger",
};

/** TPO actions — flat controls; same face colors as before, no depth shadow. */
export default function TPO3DButton({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const mapped = TPO_VARIANTS[variant] || variant;

  return (
    <Dashboard3DButton
      variant={mapped}
      flat
      className={className}
      {...props}
    >
      {children}
    </Dashboard3DButton>
  );
}