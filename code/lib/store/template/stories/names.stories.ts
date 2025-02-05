import globalThis from 'global';
import { expect } from '@storybook/jest';
import { PlayFunctionContext } from '@storybook/types';

export default {
  component: globalThis.Components.Pre,
  args: { text: 'No content' },
};

// Very simple stories to show what happens when one story's id is a prefix of another's
// Repro for https://github.com/storybookjs/storybook/issues/11571

export const PrefixAndName = {
  play: async ({ name }: PlayFunctionContext) => {
    await expect(name).toBe('Prefix And Name');
  },
};

export const Prefix = {
  play: async ({ name }: PlayFunctionContext) => {
    await expect(name).toBe('Prefix');
  },
};
