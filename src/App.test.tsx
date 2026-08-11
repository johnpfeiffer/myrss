import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { FavoritesView } from "./App";
import type { TrackedItem } from "../models/trackedItem";

const item: TrackedItem = {
  _id: "item-1",
  userId: "f47ac10b-58cc-11cf-a447-001122334455",
  uniqueId: "https://example.com/article",
  status: "todo",
  dateStarted: "2026-08-11T12:00:00.000Z",
  dateUpdated: "2026-08-11T12:00:00.000Z",
};

describe("FavoritesView", () => {
  test("shows explicit loading and empty states", () => {
    const { rerender } = render(
      <FavoritesView
        items={undefined}
        selectedId={null}
        onAdd={vi.fn()}
        onSelect={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(
      <FavoritesView
        items={[]}
        selectedId={null}
        onAdd={vi.fn()}
        onSelect={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText("No favorites yet")).toBeInTheDocument();
  });

  test("submits the URL exactly as entered", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <FavoritesView
        items={[]}
        selectedId={null}
        onAdd={onAdd}
        onSelect={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    const submittedUrl = "https://Example.com/article/?ref=Favorites";
    await user.type(screen.getByLabelText("Link URL"), submittedUrl);
    await user.click(screen.getByRole("button", { name: "Add favorite" }));

    expect(onAdd).toHaveBeenCalledWith(submittedUrl);
  });

  test("selects an item and allows any status choice", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <FavoritesView
        items={[item]}
        selectedId={null}
        onAdd={vi.fn()}
        onSelect={onSelect}
        onStatusChange={onStatusChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: item.uniqueId }));
    expect(onSelect).toHaveBeenCalledWith(item._id);

    rerender(
      <FavoritesView
        items={[item]}
        selectedId={item._id}
        onAdd={vi.fn()}
        onSelect={onSelect}
        onStatusChange={onStatusChange}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Status"), "cancelled");

    expect(onStatusChange).toHaveBeenCalledWith(item._id, "cancelled");
  });
});

