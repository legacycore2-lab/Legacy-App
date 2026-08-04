declare module 'arabic-reshaper' {
  /**
   * Converts Arabic text so that characters are properly shaped
   * (connected/isolated forms) for rendering in environments that
   * do not support native Arabic text shaping.
   */
  export function convertArabic(text: string): string
}
