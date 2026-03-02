/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',   // Mobile (iPhone SE, iPhone 12 mini)
        'sm': '640px',   // Mobile landscape / Small tablet
        'md': '768px',   // Tablet
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Desktop large
        '2xl': '1536px', // Desktop extra large
      },
      spacing: {
        'responsive-xs': 'clamp(0.25rem, 2vw, 0.5rem)',   // 4px - 8px
        'responsive-sm': 'clamp(0.5rem, 2.5vw, 1rem)',    // 8px - 16px
        'responsive-md': 'clamp(1rem, 3vw, 1.5rem)',      // 16px - 24px
        'responsive-lg': 'clamp(1.5rem, 4vw, 2rem)',      // 24px - 32px
        'responsive-xl': 'clamp(2rem, 5vw, 3rem)',        // 32px - 48px
      },
      fontSize: {
        'responsive-xs': 'clamp(0.7rem, 2vw, 0.875rem)',     // 11px - 14px
        'responsive-sm': 'clamp(0.875rem, 2.5vw, 1rem)',     // 14px - 16px
        'responsive-base': 'clamp(1rem, 3vw, 1.125rem)',     // 16px - 18px
        'responsive-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',  // 18px - 20px
        'responsive-xl': 'clamp(1.25rem, 4vw, 1.5rem)',      // 20px - 24px
        'responsive-2xl': 'clamp(1.5rem, 5vw, 1.875rem)',    // 24px - 30px
        'responsive-3xl': 'clamp(1.875rem, 6vw, 2.25rem)',   // 30px - 36px
        'responsive-4xl': 'clamp(2.25rem, 7vw, 3rem)',       // 36px - 48px
      },
      borderRadius: {
        'responsive': 'clamp(0.375rem, 2vw, 0.75rem)',
      },
      boxShadow: {
        'responsive-sm': '0 1px clamp(1px, 2vw, 2px) rgba(0, 0, 0, 0.05)',
        'responsive-md': '0 clamp(1px, 2vw, 2px) clamp(2px, 3vw, 4px) rgba(0, 0, 0, 0.1)',
        'responsive-lg': '0 clamp(4px, 3vw, 10px) clamp(8px, 4vw, 15px) rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme, e }) {
      const newUtilities = {
        // Touch target utilities (44x44px minimum for mobile accessibility)
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
          '@media (max-width: 640px)': {
            minWidth: '44px',
            minHeight: '44px',
          },
        },
        '.min-h-touch': {
          minHeight: '44px',
          '@media (max-width: 640px)': {
            minHeight: '44px',
          },
        },
        '.min-w-touch': {
          minWidth: '44px',
          '@media (max-width: 640px)': {
            minWidth: '44px',
          },
        },

        // Responsive container
        '.container-responsive': {
          maxWidth: '100%',
          paddingLeft: 'clamp(1rem, 5vw, 2rem)',
          paddingRight: 'clamp(1rem, 5vw, 2rem)',
          marginLeft: 'auto',
          marginRight: 'auto',
        },

        // Responsive typography
        '.text-responsive': {
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          lineHeight: '1.6',
        },
        '.text-responsive-h1': {
          fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
          fontWeight: '700',
          lineHeight: '1.2',
        },
        '.text-responsive-h2': {
          fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
          fontWeight: '600',
          lineHeight: '1.3',
        },
        '.text-responsive-h3': {
          fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)',
          fontWeight: '600',
          lineHeight: '1.4',
        },
        '.text-responsive-h4': {
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          fontWeight: '600',
          lineHeight: '1.4',
        },
        '.text-responsive-body': {
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          lineHeight: '1.6',
        },
        '.text-responsive-sm': {
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          lineHeight: '1.5',
        },

        // Responsive spacing
        '.p-responsive': {
          padding: 'clamp(1rem, 4vw, 2rem)',
        },
        '.px-responsive': {
          paddingLeft: 'clamp(1rem, 4vw, 2rem)',
          paddingRight: 'clamp(1rem, 4vw, 2rem)',
        },
        '.py-responsive': {
          paddingTop: 'clamp(1rem, 4vw, 2rem)',
          paddingBottom: 'clamp(1rem, 4vw, 2rem)',
        },
        '.m-responsive': {
          margin: 'clamp(1rem, 4vw, 2rem)',
        },
        '.mt-responsive': {
          marginTop: 'clamp(1rem, 4vw, 2rem)',
        },
        '.mb-responsive': {
          marginBottom: 'clamp(1rem, 4vw, 2rem)',
        },
        '.gap-responsive': {
          gap: 'clamp(0.75rem, 3vw, 1.5rem)',
        },

        // Responsive layout utilities
        '.flex-responsive': {
          '@media (max-width: 640px)': {
            flexDirection: 'column',
          },
          '@media (min-width: 640px)': {
            flexDirection: 'row',
          },
        },
        '.grid-responsive': {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 'clamp(0.75rem, 3vw, 1.5rem)',
        },
        '.card-responsive': {
          backgroundColor: 'white',
          borderRadius: 'clamp(0.375rem, 2vw, 0.75rem)',
          padding: 'clamp(1rem, 4vw, 2rem)',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        '.rounded-responsive': {
          borderRadius: 'clamp(0.375rem, 2vw, 0.75rem)',
        },

        // Responsive buttons
        '.btn-responsive': {
          paddingLeft: 'clamp(0.75rem, 3vw, 1rem)',
          paddingRight: 'clamp(0.75rem, 3vw, 1rem)',
          paddingTop: 'clamp(0.5rem, 2vw, 0.75rem)',
          paddingBottom: 'clamp(0.5rem, 2vw, 0.75rem)',
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          minHeight: '44px',
          '@media (max-width: 640px)': {
            minHeight: '44px',
            minWidth: '44px',
          },
        },

        // Hide/show utilities
        '.hide-mobile': {
          '@media (max-width: 640px)': {
            display: 'none',
          },
        },
        '.hide-tablet': {
          '@media (max-width: 1024px)': {
            display: 'none',
          },
        },
        '.hide-desktop': {
          '@media (min-width: 1024px)': {
            display: 'none',
          },
        },
        '.show-mobile': {
          '@media (min-width: 640px)': {
            display: 'none',
          },
        },
      }

      addUtilities(newUtilities)
    },
  ],
}
