import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
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
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				/* Chat specific colors */
				'chat-background': 'hsl(var(--chat-background))',
				'chat-panel': 'hsla(var(--chat-panel))',
				'message-sent': 'hsl(var(--message-sent))',
				'message-received': 'hsla(var(--message-received))',
				'message-text': 'hsl(var(--message-text))',
				
				/* Insight colors - now neon! */
				'insight-primary': 'hsl(var(--insight-primary))',
				'insight-secondary': 'hsl(var(--insight-secondary))',
				'insight-warning': 'hsl(var(--insight-warning))',
				'insight-success': 'hsl(var(--insight-success))',
				
				/* Emotional state neon colors */
				'emotion-happy': 'hsl(var(--emotion-happy))',
				'emotion-excited': 'hsl(var(--emotion-excited))',
				'emotion-neutral': 'hsl(var(--emotion-neutral))',
				'emotion-sad': 'hsl(var(--emotion-sad))',
				'emotion-angry': 'hsl(var(--emotion-angry))',
				
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsla(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					glow: 'hsl(var(--accent-glow))'
				},
				popover: {
					DEFAULT: 'hsla(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsla(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsla(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsla(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsla(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				'message-slide-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px) scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				},
				'typing-pulse': {
					'0%, 100%': {
						opacity: '0.5'
					},
					'50%': {
						opacity: '1'
					}
				},
				'glass-shine': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(100%)'
					}
				},
				'neon-pulse': {
					'0%, 100%': {
						boxShadow: 'var(--glow-primary)'
					},
					'50%': {
						boxShadow: 'var(--glow-primary), 0 0 60px hsl(280 100% 70% / 0.6)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
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
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'message-slide-in': 'message-slide-in 0.3s ease-out',
				'typing-pulse': 'typing-pulse 1.5s ease-in-out infinite',
				'glass-shine': 'glass-shine 2s ease-in-out infinite',
				'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'fade-in-up': 'fade-in-up 0.6s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
