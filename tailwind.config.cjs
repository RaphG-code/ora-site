/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx,js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand palette
                "brand-blue": "#3b82f6",
                "brand-teal": "#0d9488",
                // Backgrounds
                background: "#111827",
                "bg-light": "#fcfbf7",
                // Legacy (kept for backward compat)
                "gray-medium": "#9CA3AF",
                "gray-light": "#D1D5DB",
                "blue-primary": "#3b82f6",
                border: "#e5e7eb",
            },
            fontFamily: {
                poppins: ["Poppins", "sans-serif"],
                inter: ["Inter", "sans-serif"],
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
            },
            animation: {
                "spin-slow": "spin 3s linear infinite",
            },
        },
    },
    plugins: [],
};