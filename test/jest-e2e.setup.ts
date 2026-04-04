jest.mock('nanoid', () => ({
  customAlphabet: jest.fn(() => jest.fn(() => 'A1B2C3D4')),
}));
