import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { Carousel } from "./Carousel";

const meta: Meta<typeof Carousel> = {
  title: "Atomic/Carousel",
  component: Carousel,
  argTypes: {
    onSlideChange: { action: "onSlideChange" },
    onVisibleIndexChange: { action: "onVisibleIndexChange" },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

const slideStyles = [
  { background: "#fce4ec", color: "#4a2028" },
  { background: "#e8f5e9", color: "#1b3a1e" },
  { background: "#e3f2fd", color: "#1a2e42" },
  { background: "#fff3e0", color: "#3e2a10" },
  { background: "#f3e5f5", color: "#2e1533" },
];

const slides = slideStyles.map((style, i) => (
  <div
    key={i}
    style={{
      ...style,
      padding: "24px",
      height: "100%",
      boxSizing: "border-box" as const,
      display: "flex",
      flexDirection: "column" as const,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <h2 style={{ margin: 0 }}>Page {i + 1}</h2>
    <p style={{ marginTop: "8px" }}>Swipe to navigate</p>
  </div>
));

const defaultArgs = {
  children: slides,
  activeIndex: 0,
  direction: "ltr" as const,
  showDots: false,
  swipeHint: false,
};

export const Default: StoryObj<typeof Carousel> = {
  args: defaultArgs,
  render: (args) => {
    const [{ activeIndex }, updateArgs] = useArgs<{ activeIndex: number }>();
    return (
      <Carousel
        {...args}
        activeIndex={activeIndex}
        onSlideChange={(i) => {
          updateArgs({ activeIndex: i });
          args.onSlideChange?.(i);
        }}
      />
    );
  },
};

export const WithDots: StoryObj<typeof Carousel> = {
  args: { ...defaultArgs, showDots: true },
  render: (args) => {
    const [{ activeIndex }, updateArgs] = useArgs<{ activeIndex: number }>();
    return (
      <Carousel
        {...args}
        activeIndex={activeIndex}
        onSlideChange={(i) => {
          updateArgs({ activeIndex: i });
          args.onSlideChange?.(i);
        }}
      />
    );
  },
};

export const WithSwipeHint: StoryObj<typeof Carousel> = {
  args: { ...defaultArgs, swipeHint: true },
  render: (args) => {
    const [{ activeIndex }, updateArgs] = useArgs<{ activeIndex: number }>();
    return (
      <Carousel
        {...args}
        activeIndex={activeIndex}
        onSlideChange={(i) => {
          updateArgs({ activeIndex: i });
          args.onSlideChange?.(i);
        }}
      />
    );
  },
};

export const WithDotsAndHint: StoryObj<typeof Carousel> = {
  args: { ...defaultArgs, showDots: true, swipeHint: true },
  render: (args) => {
    const [{ activeIndex }, updateArgs] = useArgs<{ activeIndex: number }>();
    return (
      <Carousel
        {...args}
        activeIndex={activeIndex}
        onSlideChange={(i) => {
          updateArgs({ activeIndex: i });
          args.onSlideChange?.(i);
        }}
      />
    );
  },
};

export const RTL: StoryObj<typeof Carousel> = {
  args: { ...defaultArgs, direction: "rtl", showDots: true, swipeHint: true },
  render: (args) => {
    const [{ activeIndex }, updateArgs] = useArgs<{ activeIndex: number }>();
    return (
      <Carousel
        {...args}
        activeIndex={activeIndex}
        onSlideChange={(i) => {
          updateArgs({ activeIndex: i });
          args.onSlideChange?.(i);
        }}
      />
    );
  },
};
