/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {colors: {
        white: "#fff",
        darkslategray: "#353331",
        black: "#000",
        gainsboro: "#d9d9d9",
        firstcolor: "#ffaaaa",
        secondcolor: "#52373a",
        thirdcolor: "#c7004c",
        fourthcolor: "#ae7279",
        fifthcolor: "#a790ac"

      },
      fontSize: {
      xl: "30px",
      mini: "15px",
      inherit: "inherit",
      base:"20px",
      xxl: "100px",
    },
    fontFamily: {
        fontawesome: "FontAwesome",
        "fira-sans": "'Fira Sans'",
      },
      height: {
        '300': '300px', // Adding custom height value
      }
    },
  },
  plugins: [],
}

