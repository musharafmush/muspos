import * as React from "react";

type Theme = "dark" | "light" | "system";
type Color = string;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColor?: Color;
  themeStorageKey?: string;
  colorStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: Color;
  setPrimaryColor: (color: Color) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  primaryColor: "210, 100%, 50%",
  setPrimaryColor: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultColor = "210, 100%, 50%",
  themeStorageKey = "vite-ui-theme",
  colorStorageKey = "vite-ui-primary-color",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => (localStorage.getItem(themeStorageKey) as Theme) || defaultTheme
  );

  const [primaryColor, setPrimaryColor] = React.useState<Color>(
    () => (localStorage.getItem(colorStorageKey) as Color) || defaultColor
  );

  React.useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    // Set the primary color CSS variable
    // We expect the color to be in "H, S%, L%" format
    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--sidebar-primary", primaryColor);
    root.style.setProperty("--pos-primary", primaryColor);
  }, [primaryColor]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (theme: Theme) => {
        localStorage.setItem(themeStorageKey, theme);
        setTheme(theme);
      },
      primaryColor,
      setPrimaryColor: (color: Color) => {
        localStorage.setItem(colorStorageKey, color);
        setPrimaryColor(color);
      },
    }),
    [theme, primaryColor, themeStorageKey, colorStorageKey]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
