# Design Reference Files

These SVG files are visual references of the Radix UI custom color theme created on the [Radix Colors Playground](https://www.radix-ui.com/colors/custom).

## Files

- **theme-light.svg** - Light theme color scale visualization (Violet accent + neutral grays)
- **theme-dark.svg** - Dark theme color scale visualization (Teal accent + purple-tinted grays)

## Active Implementation

The actual color scales are defined in CSS files located in `/styles/`:
- `accent-scale-light.css` / `accent-scale-dark.css` - Accent color scales
- `gray-scale-light.css` / `gray-scale-dark.css` - Neutral gray scales  
- `background-scale-light.css` / `background-scale-dark.css` - Background colors

These are imported and used by the theme system in `/app/radix-theme.css`.

## Semantic Token Mapping

The color scales are mapped to semantic tokens in `/app/globals.css` for use with Tailwind CSS and shadcn/ui components.


