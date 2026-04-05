/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class", // 👈 important
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx,js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#020617",
                "gray-medium": "#9CA3AF",
                "gray-light": "#D1D5DB",
                "blue-primary": "#2563EB",
                cyan: "#22D3EE",
                border: "#1F2933",
            },
            animation: {
                "spin-slow": "spin 3s linear infinite",
            },
        },
    },
    plugins: [],
};