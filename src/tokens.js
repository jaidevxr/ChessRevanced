/* ═══════════════════════════════════════════════════════════════
   Design Tokens — ChessRevanced Cream & Olive Minimalist Theme
   ═══════════════════════════════════════════════════════════════ */

export const C = {
  // Backgrounds (Cream/Beige tones)
  bg0: "#F9F8F4", // App background
  bg1: "#F1EEDB", // Panels/Cards
  bg2: "#E6E2CE", // Hover States
  bg3: "#D4CEB6", // Darker accents
  bg4: "#C0B89C",

  // Primary Theme (Olive Green) - Variables kept as 'gold' to minimize massive app refactor, but they are GREEN.
  gold: "#5B6B45", 
  goldBright: "#414C32", // Darker olive for active states
  goldDim: "#7A8D5F", // Lighter olive
  goldGlow: "transparent", // Removed glows entirely

  // Text (Dark Earthy Tones) - Variables kept as 'cream' but map to Dark Olive.
  cream: "#22271A", // Main text (near black olive)
  creamDim: "#616A54", // Subtext
  creamMid: "#404C31", // Mid-level text

  // Semantic — game results (Muted slightly for aesthetic)
  win: "#4A8C3C",
  winBright: "#3A732E",
  loss: "#C84B31",
  lossBright: "#A63C26",
  draw: "#8A9476",
  drawBright: "#6F7A5E",

  // Borders
  border: "#E6E2CE",
  borderHover: "#C0B89C",

  // Board squares (Cream & Green earthy theme)
  sqLight: "#F1EEDB",
  sqDark: "#7A8D5F",

  // Move classification colors (Functionally colored, but flat)
  brilliant: "#3E9490",
  great: "#5C8BB0",
  best: "#5B6B45",      // Theme Olive
  excellent: "#7A8D5F", // Light Olive
  good: "#8A9C6E",
  inaccuracy: "#C89F30",
  mistake: "#C86B30",
  blunder: "#B83B3B",
  book: "#8A9476",
};

// Font stacks
export const SF = "'Playfair Display', Georgia, serif";
export const SM = "'Inter', -apple-system, sans-serif"; // Removed monospace to keep it clean Sans
export const SB = "'Inter', -apple-system, sans-serif";

// Move classification metadata (Light backgrounds for light theme)
export const CM = {
  brilliant:   { label: "Brilliant",   icon: "!!", color: C.brilliant,  bg: "#E6F0F0" },
  great:       { label: "Great",       icon: "!",  color: C.great,      bg: "#E8EEF3" },
  best:        { label: "Best",        icon: "★",  color: C.best,       bg: "#EBF0E6" },
  excellent:   { label: "Excellent",   icon: "✓",  color: C.excellent,  bg: "#EFF3EA" },
  good:        { label: "Good",        icon: "✓",  color: C.good,       bg: "#F2F5EE" },
  inaccuracy:  { label: "Inaccuracy",  icon: "?!", color: C.inaccuracy, bg: "#F8F2E1" },
  mistake:     { label: "Mistake",     icon: "?",  color: C.mistake,    bg: "#F8EBE1" },
  blunder:     { label: "Blunder",     icon: "??", color: C.blunder,    bg: "#F5E6E6" },
  book:        { label: "Book",        icon: "⊕",  color: C.book,       bg: "#EFF0EA" },
};
