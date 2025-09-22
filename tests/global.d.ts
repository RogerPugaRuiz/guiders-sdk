// Global type declarations for Playwright tests

declare global {
  interface Window {
    guiders: {
      isInitialized: boolean;
      chatUI?: any;
      chatInputUI?: any;
      chatToggleButton?: any;
      // Add other properties as needed
    };
  }
}

export {};