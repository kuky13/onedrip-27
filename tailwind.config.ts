
import type { Config } from "tailwindcss";

export default {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
  darkMode: ["class"],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
      boxShadow: {
        soft: 'var(--shadow-soft)',
        medium: 'var(--shadow-medium)',
        strong: 'var(--shadow-strong)',
      },
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
        '2xl': 'calc(var(--radius) + 4px)',
        '3xl': 'calc(var(--radius) + 8px)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-out': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(8px)'
          }
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'scale-bounce': {
          '0%': {
            transform: 'scale(1)'
          },
          '50%': {
            transform: 'scale(1.3)'
          },
          '100%': {
            transform: 'scale(1)'
          }
        },
        'scale-out': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(0.95)',
            opacity: '0'
          }
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(16px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'slide-down': {
          '0%': {
            transform: 'translateY(-16px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'slide-in-right': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        'bounce-in': {
          '0%': {
            transform: 'scale(0.3)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.02)'
          },
          '70%': {
            transform: 'scale(0.98)'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'pulse-scale': {
          '0%, 100%': {
            transform: 'scale(1)'
          },
          '50%': {
            transform: 'scale(1.02)'
          }
        },
        'ripple': {
          '0%': {
            transform: 'scale(0)',
            opacity: '0.8'
          },
          '100%': {
            transform: 'scale(4)',
            opacity: '0'
          }
        },
        'shake': {
          '0%, 100%': {
            transform: 'translateX(0)'
          },
          '10%, 30%, 50%, 70%, 90%': {
            transform: 'translateX(-2px)'
          },
          '20%, 40%, 60%, 80%': {
            transform: 'translateX(2px)'
          }
        },
        'glow': {
          '0%': {
            boxShadow: '0 0 5px hsl(var(--primary) / 0.3)'
          },
          '50%': {
            boxShadow: '0 0 20px hsl(var(--primary) / 0.6)'
          },
          '100%': {
            boxShadow: '0 0 5px hsl(var(--primary) / 0.3)'
          }
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fade-out 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-bounce': 'scale-bounce 0.3s ease-out',
        'scale-out': 'scale-out 0.15s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'bounce-in': 'bounce-in 0.4s ease-out',
        'pulse-scale': 'pulse-scale 1.5s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite'
			},
      // iOS-specific utilities
      screens: {
        'ios': {'raw': '(max-device-width: 812px) and (-webkit-min-device-pixel-ratio: 2)'},
        'ios-landscape': {'raw': '(max-device-height: 414px) and (orientation: landscape)'},
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
		}
	},
	plugins: [
    require("tailwindcss-animate"),
    // iOS touch optimization plugin
    function({ addUtilities }: any) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.ios-momentum-scroll': {
          '-webkit-overflow-scrolling': 'touch',
        },
        '.ios-tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.ios-touch-callout-none': {
          '-webkit-touch-callout': 'none',
        },
        '.safe-area-inset-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-inset-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-area-inset-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-area-inset-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
} satisfies Config;
