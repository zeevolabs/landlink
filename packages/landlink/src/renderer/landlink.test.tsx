import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defaultBlocks } from "../blocks";
import { defineBlock } from "../blocks/define-block";
import { parseConfig } from "../config/parse";
import type { Config } from "../config/types";
import { createRegistry } from "../registry/registry";
import { Landlink } from "./landlink";

describe("Landlink", () => {
  it("renders the profile header and blocks in order", () => {
    const config = parseConfig({
      profile: { name: "Alex Rivera", bio: "Full-stack developer" },
      blocks: [
        { type: "heading", text: "Links" },
        { type: "link", label: "GitHub", url: "https://github.com/alex" },
      ],
    });
    render(<Landlink config={config} />);

    expect(screen.getByRole("heading", { level: 1, name: /Alex Rivera/ })).toBeInTheDocument();
    expect(screen.getByText("Full-stack developer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
  });

  it("applies theme tokens to the root element", () => {
    const config = parseConfig({ profile: { name: "x" }, theme: "rose", blocks: [] });
    const { container } = render(<Landlink config={config} />);
    const root = container.querySelector("[data-landlink]") as HTMLElement;
    expect(root.style.getPropertyValue("--ll-accent")).toBe("#e0719b");
  });

  it("renders custom blocks via a composed registry", () => {
    const badge = defineBlock({
      type: "badge",
      data: z.object({ text: z.string() }),
      component: ({ text }: { type: "badge"; text: string }) => <span>{text}</span>,
    });
    const registry = createRegistry([...defaultBlocks, badge]);
    const config = parseConfig(
      { profile: { name: "x" }, blocks: [{ type: "badge", text: "Pro" }] },
      registry,
    );
    render(<Landlink config={config} registry={registry} />);

    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("skips unknown block types gracefully", () => {
    const config = { profile: { name: "x" }, blocks: [{ type: "mystery" }] } as Config;
    render(<Landlink config={config} />);
    expect(screen.getByRole("heading", { level: 1, name: "x" })).toBeInTheDocument();
  });
});
