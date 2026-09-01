import type { Preview } from '@storybook/react-vite'
import '../src/styles/tokens.css'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ["Design System", "Atomic", "Features"],
      },
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },

  globalTypes: {
    theme: {
      description: 'Color scheme',
      defaultValue: 'light',
      toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
    },
  },

  decorators: [
    (Story, ctx) => {
      document.documentElement.dataset.theme = ctx.globals.theme;
      document.body.style.background = 'var(--color-bg-surface)';
      return Story();
    },
  ],
};

export default preview;