/**
 * The coach's knowledge base. The LLM is told to use only the tips it is given,
 * so this list is what keeps its advice grounded.
 * After editing, run `npm run tips:embed` to refresh tips-embeddings.json.
 */
export type Tip = { id: string; text: string };

export const TIPS: Tip[] = [
  {
    id: "think-funny",
    text: "If your smile looks forced or neutral, think of something genuinely funny right before the photo. A real thought brings out a real smile.",
  },
  {
    id: "eyes-smile",
    text: "A genuine smile reaches the eyes. Let your cheeks lift and your eyes crinkle slightly instead of only moving your mouth.",
  },
  {
    id: "relax-jaw",
    text: "A tense or clenched jaw makes a smile look stiff. Drop your shoulders, let your jaw loosen, then smile.",
  },
  {
    id: "breathe-out",
    text: "If you look serious or nervous, take a slow breath and breathe out just before the shot. It relaxes the whole face.",
  },
  {
    id: "show-teeth",
    text: "For a bigger smile, part your lips and let your top teeth show. Closed-lip smiles usually read as a hint of a smile.",
  },
  {
    id: "dont-hold",
    text: "Holding a smile too long makes it fade and look fake. Smile at the last moment, or take a burst of photos.",
  },
  {
    id: "laugh-first",
    text: "Laughing out loud for a second and then settling into a smile produces the most natural, happy expression.",
  },
  {
    id: "soften-brows",
    text: "Furrowed or raised eyebrows can make you look worried, angry or surprised. Relax your forehead and let your brows settle.",
  },
  {
    id: "front-light",
    text: "Face a window or soft light source. Even light on the face makes the expression easier to see and read.",
  },
  {
    id: "avoid-backlight",
    text: "Avoid bright light behind you. A backlit face turns dark and the smile is hard to detect.",
  },
  {
    id: "eye-level",
    text: "Hold the camera at eye level or slightly above, and look straight at the lens for a clear, front-facing photo.",
  },
  {
    id: "fill-frame",
    text: "Make your face fill a good part of the photo. A small face far from the camera is harder to read.",
  },
  {
    id: "keep-it-up",
    text: "You already have a big, happy smile. Keep the same relaxed expression and good lighting for your next photos.",
  },
  {
    id: "small-step",
    text: "To grow your smile, lift the corners of your mouth a little more and let it widen naturally.",
  },
  {
    id: "practice-mirror",
    text: "Practise in a mirror to learn how your most natural smile feels, so you can find it again in front of the camera.",
  },
];
