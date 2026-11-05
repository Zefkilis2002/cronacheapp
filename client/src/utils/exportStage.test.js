import { exportStage } from './exportStage';
test('an export error restores size, scale and border visibility', () => {
  let scale = { x: 0.4, y: 0.4 };
  let size = { width: 500, height: 600 };
  let visible = true;
  const border = { visible: value => value === undefined ? visible : (visible = value) };
  const stage = {
    scale: value => value ? (scale = value) : scale,
    size: value => value ? (size = value) : size,
    batchDraw: jest.fn(),
    toDataURL: () => { throw new Error('tainted canvas'); },
  };
  expect(() => exportStage(stage, { width: 1440, height: 1800, hiddenNodes: [border] })).toThrow('tainted canvas');
  expect({ scale, size, visible }).toEqual({ scale: { x: 0.4, y: 0.4 }, size: { width: 500, height: 600 }, visible: true });
});
