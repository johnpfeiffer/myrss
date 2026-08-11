import { useEffect, useState, type FormEvent } from "react";
import { v1 as uuidv1 } from "uuid";
import {
  Alert,
  AppBar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "convex/react";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  assertUuidV1,
  trackedItemStatuses,
  type TrackedItem,
  type TrackedItemStatus,
} from "../models/trackedItem";
import "./App.css";

const userStorageKey = "favorites.userId";

interface FavoritesViewProps {
  items: TrackedItem[] | undefined;
  selectedId: string | null;
  onAdd: (url: string) => Promise<void>;
  onSelect: (itemId: string) => void;
  onStatusChange: (
    itemId: string,
    status: TrackedItemStatus,
  ) => Promise<void>;
  error?: string | null;
}

function readableDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(new Date(value));
}

function statusLabel(status: TrackedItemStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function FavoritesView({
  items,
  selectedId,
  onAdd,
  onSelect,
  onStatusChange,
  error,
}: FavoritesViewProps) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const selectedItem = items?.find((item) => item._id === selectedId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      new URL(url);
    } catch {
      setFormError("Enter a valid link URL.");
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(url);
      setUrl("");
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "The favorite could not be added.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box className="app-shell">
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography component="h1" variant="h6" sx={{ flexGrow: 1 }}>
            Favorites
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Keep track of what you finish
          </Typography>
        </Toolbar>
        <Divider />
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Paper
            component="form"
            onSubmit={handleSubmit}
            variant="outlined"
            sx={{ p: 2 }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                label="Link URL"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/article"
                required
                slotProps={{ htmlInput: { "aria-label": "Link URL" } }}
                type="url"
                value={url}
              />
              <Button
                disabled={submitting}
                type="submit"
                variant="contained"
                sx={{ minWidth: 136 }}
              >
                {submitting ? "Adding…" : "Add favorite"}
              </Button>
            </Stack>
            {formError ? (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {formError}
              </Alert>
            ) : null}
          </Paper>

          <Box className="content-grid">
            <Paper variant="outlined" className="source-panel">
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography component="h2" variant="subtitle1">
                  Saved links
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {items ? `${items.length} total` : "Loading your favorites"}
                </Typography>
              </Box>
              <Divider />

              {items === undefined ? (
                <Stack spacing={1.5} sx={{ alignItems: "center", py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography color="text.secondary" variant="body2">
                    Loading…
                  </Typography>
                </Stack>
              ) : items.length === 0 ? (
                <Box sx={{ px: 2, py: 6, textAlign: "center" }}>
                  <Typography>No favorites yet</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Add a link above to start tracking it.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {items.map((item, index) => (
                    <ListItem disablePadding key={item._id}>
                      <ButtonBase
                        aria-label={item.uniqueId}
                        onClick={() => onSelect(item._id)}
                        className={`source-button${
                          item._id === selectedId ? " Mui-selected" : ""
                        }`}
                      >
                        <Stack
                          spacing={1}
                          sx={{ alignItems: "flex-start", width: "100%" }}
                        >
                          <Typography className="source-url" variant="body2">
                            {item.uniqueId}
                          </Typography>
                          <Stack
                            direction="row"
                            sx={{
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                            }}
                          >
                            <Chip label={statusLabel(item.status)} size="small" />
                            <Typography color="text.secondary" variant="caption">
                              {readableDate(item.dateUpdated)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </ButtonBase>
                      {index < items.length - 1 ? <Divider /> : null}
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            <Paper variant="outlined" className="detail-panel">
              {selectedItem ? (
                <Stack spacing={3}>
                  <Box>
                    <Typography color="text.secondary" variant="overline">
                      Link details
                    </Typography>
                    <Typography
                      component="a"
                      href={selectedItem.uniqueId}
                      rel="noreferrer"
                      target="_blank"
                      variant="h6"
                      className="detail-link"
                    >
                      {selectedItem.uniqueId}
                    </Typography>
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel htmlFor="status-select">Status</InputLabel>
                    <Select
                      native
                      inputProps={{ id: "status-select" }}
                      label="Status"
                      onChange={(event) =>
                        void onStatusChange(
                          selectedItem._id,
                          event.target.value as TrackedItemStatus,
                        )
                      }
                      value={selectedItem.status}
                    >
                      {trackedItemStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider />
                  <Stack spacing={1.5}>
                    <DateRow label="Started" value={selectedItem.dateStarted} />
                    <DateRow label="Updated" value={selectedItem.dateUpdated} />
                    {selectedItem.dateCompleted ? (
                      <DateRow
                        label="Completed"
                        value={selectedItem.dateCompleted}
                      />
                    ) : null}
                    {selectedItem.dateCancelled ? (
                      <DateRow
                        label="Cancelled"
                        value={selectedItem.dateCancelled}
                      />
                    ) : null}
                  </Stack>
                </Stack>
              ) : (
                <Stack
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 240,
                  }}
                >
                  <Typography>Select a saved link</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Its status and dates will appear here.
                  </Typography>
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ justifyContent: "space-between" }}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="body2">{readableDate(value)}</Typography>
    </Stack>
  );
}

function getOrCreateUserId(): string {
  const existing = window.localStorage.getItem(userStorageKey);
  if (existing) {
    try {
      assertUuidV1(existing);
      return existing;
    } catch {
      window.localStorage.removeItem(userStorageKey);
    }
  }

  const userId = uuidv1();
  window.localStorage.setItem(userStorageKey, userId);
  return userId;
}

function App() {
  const [userId] = useState(getOrCreateUserId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ensureUser = useMutation(api.users.ensure);
  const addFavorite = useMutation(api.trackedItems.add);
  const updateFavoriteStatus = useMutation(api.trackedItems.updateStatus);
  const items = useQuery(api.trackedItems.list, { userId });

  useEffect(() => {
    void ensureUser({ userId }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "User setup failed.");
    });
  }, [ensureUser, userId]);

  async function handleAdd(url: string) {
    setError(null);
    await ensureUser({ userId });
    const item = await addFavorite({ userId, url });
    setSelectedId(item._id);
  }

  async function handleStatusChange(
    itemId: string,
    status: TrackedItemStatus,
  ) {
    setError(null);
    try {
      await ensureUser({ userId });
      await updateFavoriteStatus({
        userId,
        itemId: itemId as Id<"trackedItems">,
        status,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Status could not be updated.",
      );
    }
  }

  return (
    <FavoritesView
      error={error}
      items={items}
      onAdd={handleAdd}
      onSelect={setSelectedId}
      onStatusChange={handleStatusChange}
      selectedId={selectedId}
    />
  );
}

export default App;
