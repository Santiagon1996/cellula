import styles from './arrow-icon.module.css';

export type ArrowDirection =
  | 'up-right'
  | 'down-right'
  | 'up'
  | 'down'
  | 'left'
  | 'right';

export type ArrowIconProps = {
  direction: ArrowDirection;
  /** CSS length or pixel number. Defaults to `1em` so the icon follows the surrounding text size. */
  size?: number | string;
  className?: string;
  /** Decorative icons are hidden from assistive technology. Set to false only with a `label`. */
  decorative?: boolean;
  label?: string;
};

// Paths are the unmodified Google Material Symbols Outlined glyphs (weight 400,
// 24px optical size, viewBox "0 -960 960 960"), fetched from fonts.gstatic.com.
const arrowPaths: Record<ArrowDirection, string> = {
  // arrow_outward
  'up-right': 'm256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z',
  // south_east
  'down-right': 'M360-200v-80h264L160-744l56-56 464 464v-264h80v400H360Z',
  // arrow_upward
  up: 'M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z',
  // arrow_downward
  down: 'M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z',
  // arrow_back
  left: 'm313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z',
  // arrow_forward
  right: 'M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z',
};

export function ArrowIcon({
  direction,
  size = '1em',
  className,
  decorative = true,
  label,
}: ArrowIconProps) {
  const classes = className ? `${styles.icon} ${className}` : styles.icon;
  const accessibility = decorative
    ? { 'aria-hidden': true as const, focusable: 'false' as const }
    : { role: 'img' as const, 'aria-label': label };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      className={classes}
      data-arrow={direction}
      {...accessibility}
    >
      <path d={arrowPaths[direction]} />
    </svg>
  );
}
