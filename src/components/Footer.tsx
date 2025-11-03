import spiralLogo from "@/assets/spiral-logo.svg";

const Footer = () => {
  return (
    <footer className="py-4 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Developed by</span>
          <img src={spiralLogo} alt="Spiral Development Group" className="h-4 w-4" />
          <span>Spiral Development Group</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
