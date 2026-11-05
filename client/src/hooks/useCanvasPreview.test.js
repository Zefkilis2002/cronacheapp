import { act, renderHook } from '@testing-library/react';
import { fitCanvasPreview, useCanvasPreview } from './useCanvasPreview';

test.each([[320, 568], [390, 844], [768, 1024], [1440, 900]])('frame includes the border at %sx%s', (width, height) => {
  const size = fitCanvasPreview(1440, 1800, width, height);
  expect(size.width + 4).toBeLessThanOrEqual(width);
  expect(size.height + 4).toBeLessThanOrEqual(height);
  expect(size.width / size.height).toBeCloseTo(4 / 5);
});

test('small containers are fitted without an overflowing minimum scale', () => {
  const size = fitCanvasPreview(1440, 1800, 160, 800);
  expect(size.width).toBe(156);
});

test('container resizing updates both viewport dimensions together', () => {
  const element = document.createElement('div');
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 400 });
  element.style.padding = '6px';
  let resized;
  global.ResizeObserver = jest.fn(callback => { resized = callback; return { observe: jest.fn(), disconnect: jest.fn() }; });
  const { result } = renderHook(() => {
    const value = useCanvasPreview(1440, 1800);
    value[0].current = element;
    return value;
  });
  expect(result.current[1].width).toBe(384);
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 300 });
  act(() => resized());
  expect(result.current[1].width).toBe(284);
  expect(result.current[1].height).toBe(355);
});
