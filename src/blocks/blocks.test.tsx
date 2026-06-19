import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { headingBlock, imageBlock, linkBlock, socialBlock } from ".";

describe("built-in blocks", () => {
  it("renders a link as a safe external anchor", () => {
    const Link = linkBlock.component;
    render(<Link type="link" label="GitHub" url="https://github.com/alex" />);
    const link = screen.getByRole("link", { name: "GitHub" });
    expect(link).toHaveAttribute("href", "https://github.com/alex");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders an optional link description", () => {
    const Link = linkBlock.component;
    render(
      <Link type="link" label="Inspirations" url="https://x.com" description="51 followers" />,
    );
    expect(screen.getByRole("link", { name: /Inspirations/ })).toBeInTheDocument();
    expect(screen.getByText("51 followers")).toBeInTheDocument();
  });

  it("renders social items with accessible labels", () => {
    const Social = socialBlock.component;
    render(<Social type="social" items={[{ platform: "instagram", url: "https://ig.com/x" }]} />);
    expect(screen.getByRole("link", { name: "instagram" })).toHaveAttribute(
      "href",
      "https://ig.com/x",
    );
  });

  it("renders a heading", () => {
    const Heading = headingBlock.component;
    render(<Heading type="heading" text="My services" />);
    expect(screen.getByRole("heading", { name: "My services" })).toBeInTheDocument();
  });

  it("wraps an image in a link when href is set", () => {
    const Image = imageBlock.component;
    render(<Image type="image" src="/a.jpg" alt="promo" href="https://x.com" />);
    expect(screen.getByRole("img", { name: "promo" })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://x.com");
  });
});
