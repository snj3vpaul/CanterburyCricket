import { ICONS } from "./icons";

/**
 * <ClubIcon name="bat" size={24} />. Colour follows CSS `color`.
 * Decorative by default; pass `title` when the icon carries meaning on its own.
 */
export default function ClubIcon({ name, size = 24, title, className, style }) {
  const markup = (title ? `<title>${title}</title>` : "") + (ICONS[name] ?? ICONS.trophy);
  return (
    <svg
      className={className}
      style={{ flexShrink: 0, ...style }}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      // Static, trusted markup from icons.js (no user input).
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
