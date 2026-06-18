export const colors = {
  white: '#FFFFFF',
  papaya: '#F8C83E',
  black: '#000000',
  caramel: '#C4A344',
  vermillion: '#E03C31',
} as const;

export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        papaya: {
          DEFAULT: '#F8C83E',
          light: '#FCE7A5',
          dark: '#E0B020',
        },
        caramel: {
          DEFAULT: '#C4A344',
          light: '#DCC37E',
          dark: '#A68630',
        },
        vermillion: {
          DEFAULT: '#E03C31',
          light: '#EB756E',
          dark: '#B82218',
        },
        jetblack: '#000000',
        purewhite: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-libre-franklin)', 'Libre Franklin', 'sans-serif'],
      },
    },
  },
};

export * from './crypto';
export * from './rate-limiter';


