import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function BrandingStyles() {
  const { data: branding } = useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding");
      if (!res.ok) throw new Error("Failed to fetch branding");
      return res.json();
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (branding?.primaryColor) {
      // Inject CSS variables into :root
      const root = document.documentElement;
      root.style.setProperty("--primary", branding.primaryColor);
      root.style.setProperty("--pos-primary", branding.primaryColor);
      root.style.setProperty("--sidebar-primary", branding.primaryColor);
      
      // If dark color, we might need to adjust foregrounds, but usually shadcn deals with it
    }
  }, [branding]);

  return null; // This component doesn't render anything
}
