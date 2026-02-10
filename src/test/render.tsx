import { render, act, type RenderOptions } from "@testing-library/react";

/**
 * React 19 concurrent rendering requires act() wrapping for synchronous flush.
 * This helper wraps RTL's render() so tests can use it synchronously.
 */
export async function renderAsync(
  ui: React.ReactElement,
  options?: RenderOptions,
) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(ui, options);
  });
  return result!;
}
