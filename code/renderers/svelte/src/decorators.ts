import type { DecoratorFunction, StoryContext, LegacyStoryFn } from '@storybook/types';
import { sanitizeStoryContextUpdate } from '@storybook/store';
import SlotDecorator from '../templates/SlotDecorator.svelte';
import { SvelteFramework } from './types';

/**
 * Check if an object is a svelte component.
 * @param obj Object
 */
function isSvelteComponent(obj: any) {
  return obj.prototype && obj.prototype.$destroy !== undefined;
}

/**
 * Handle component loaded with esm or cjs.
 * @param obj object
 */
function unWrap(obj: any) {
  return obj && obj.default ? obj.default : obj;
}

/**
 * Transform a story to be compatible with the PreviewRender component.
 *
 * - `() => MyComponent` is translated to `() => ({ Component: MyComponent })`
 * - `() => ({})` is translated to `() => ({ Component: <from context.component> })`
 * - A decorator component is wrapped with SlotDecorator. The decorated component is inject through
 * a <slot/>
 *
 * @param context StoryContext
 * @param story  the current story
 * @param originalStory the story decorated by the current story
 */
function prepareStory(context: StoryContext<SvelteFramework>, story: any, originalStory?: any) {
  let result = unWrap(story);
  if (isSvelteComponent(result)) {
    // wrap the component
    result = {
      Component: result,
    };
  }

  if (originalStory) {
    // inject the new story as a wrapper of the original story
    result = {
      Component: SlotDecorator,
      props: {
        decorator: unWrap(result.Component),
        decoratorProps: result.props,
        component: unWrap(originalStory.Component),
        props: originalStory.props,
        on: originalStory.on,
      },
    };
  } else {
    let cpn = result.Component;
    if (!cpn) {
      // if the component is not defined, get it the context
      cpn = context.component;
    }
    result.Component = unWrap(cpn);
  }
  return result;
}

export function decorateStory(storyFn: any, decorators: any[]) {
  return decorators.reduce(
    (
        previousStoryFn: LegacyStoryFn<SvelteFramework>,
        decorator: DecoratorFunction<SvelteFramework>
      ) =>
      (context: StoryContext<SvelteFramework>) => {
        let story;
        const decoratedStory = decorator((update) => {
          story = previousStoryFn({
            ...context,
            ...sanitizeStoryContextUpdate(update),
          });
          return story;
        }, context);

        if (!story) {
          story = previousStoryFn(context);
        }

        if (!decoratedStory || decoratedStory === story) {
          return story;
        }

        return prepareStory(context, decoratedStory, story);
      },
    (context: StoryContext<SvelteFramework>) => prepareStory(context, storyFn(context))
  );
}
