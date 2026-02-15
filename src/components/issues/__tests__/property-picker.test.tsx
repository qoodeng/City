import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyPicker, type PropertyPickerOption } from "../property-picker";
import React from "react";

// Mock ResizeObserver for Popover/Command
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  global.ResizeObserver = ResizeObserver;
  // Mock pointer capture methods as they are missing in JSDOM
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("PropertyPicker", () => {
  const options: PropertyPickerOption<string>[] = [
    { value: "opt1", label: "Option 1", key: "opt1", component: <span>Option 1</span> },
    { value: "opt2", label: "Option 2", key: "opt2", component: <span>Option 2</span> },
  ];

  it("renders trigger correctly", () => {
    const onSelect = vi.fn();
    render(
      <PropertyPicker
        options={options}
        value={null}
        onSelect={onSelect}
        trigger="Select me"
      />
    );
    expect(screen.getByText("Select me")).toBeInTheDocument();
  });

  it("opens popover and lists options", async () => {
    const onSelect = vi.fn();
    render(
      <PropertyPicker
        options={options}
        value={null}
        onSelect={onSelect}
        trigger="Select me"
      />
    );

    const trigger = screen.getByText("Select me");
    fireEvent.click(trigger);

    // Using waitFor because popover might animate or delay
    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });
  });

  it("calls onSelect when option is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <PropertyPicker
        options={options}
        value={null}
        onSelect={onSelect}
        trigger="Select me"
      />
    );

    fireEvent.click(screen.getByText("Select me"));

    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Option 1"));
    expect(onSelect).toHaveBeenCalledWith("opt1");
  });
});
