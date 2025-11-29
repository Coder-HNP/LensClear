/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#003E8A",
                "bright-blue": "#0077D1",
                "leaf-green": "#6BCB6B",
                "aqua-teal": "#36D5C6",
                "light-gray": "#F2F6FA",
                "dark-gray": "#2A2A2A",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
