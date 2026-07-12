/** Gộp các class có điều kiện, bỏ qua giá trị falsy. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
