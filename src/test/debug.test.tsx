import { describe, it, expect } from "vitest";
import { useState } from "react";
import { createRoot } from "react-dom/client";

function HookComp() {
  const [val] = useState("hook works");
  return <div>{val}</div>;
}

describe("debug", () => {
  it("renders with hooks via raw createRoot", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const { act } = await import("react");
    const root = createRoot(container);

    await act(async () => {
      root.render(<HookComp />);
    });

    expect(container.textContent).toBe("hook works");

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
