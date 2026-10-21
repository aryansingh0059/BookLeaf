/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fdfbf7",
        pencil: "#2d2d2d",
        muted: "#e5e0d8",
        accent: "#ff4d4d",
        "ink-blue": "#2d5da1",
        postit: "#fff9c4",
      },
      fontFamily: {
        heading: ["Kalam", "cursive"],
        body: ["Patrick Hand", "cursive"],
      },
      boxShadow: {
        "hard-sm": "2px 2px 0 0 #2d2d2d",
        hard: "4px 4px 0 0 #2d2d2d",
        "hard-lg": "8px 8px 0 0 #2d2d2d",
      },
    },
  },
  plugins: [],
};
