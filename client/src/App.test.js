import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock the api to avoid network requests during tests
jest.mock('./api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

// Mock useTheme to avoid local storage issues
jest.mock('./hooks/useTheme', () => () => ['dark', jest.fn()]);

// Mock useMe to avoid api calls
jest.mock('./hooks/useMe', () => () => ({ me: null, loading: false }));

test('renders App without crashing', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // Check for the Create account button to ensure Register page is rendered
  const buttonElement = screen.getByRole('button', { name: /Create account/i });
  expect(buttonElement).toBeInTheDocument();
});
