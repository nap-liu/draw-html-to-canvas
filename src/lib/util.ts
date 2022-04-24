/**
 * 随机颜色
 * @param start
 * @param end
 */
export const randomColor = (start = 0, end = 255) => {
  return `rgb(${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)},${start + parseInt(Math.random() * end as any as string)})`;
};