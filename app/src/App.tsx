import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { v1 as uuidv1 } from "uuid";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";

import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  renderGoogleSignInButton,
  useGoogleAuth,
} from "./GoogleAuth";
import {
  assertUuidV1,
  assertLinkUrl,
  sortTrackedItems,
  trackedItemStatuses,
  type SortDirection,
  type TrackedItem,
  type TrackedItemSortField,
  type TrackedItemStatus,
} from "../models/trackedItem";
import "./App.css";

const userStorageKey = "favorites.userId";
const KnowledgeGraphPage = lazy(() => import("./graph/KnowledgeGraph"));

interface FavoritesViewProps {
  items: TrackedItem[] | undefined;
  onAdd: (url: string, status: TrackedItemStatus) => Promise<void>;
  onStatusChange: (
    itemId: string,
    status: TrackedItemStatus,
  ) => Promise<void>;
  error?: string | null;
  onSignOut?: () => void;
  userLabel?: string;
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
  onAdd,
  onStatusChange,
  error,
  onSignOut,
  userLabel,
}: FavoritesViewProps) {
  const [url, setUrl] = useState("");
  const [initialStatus, setInitialStatus] =
    useState<TrackedItemStatus>("todo");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listExpanded, setListExpanded] = useState(true);
  const [sortField, setSortField] = useState<TrackedItemSortField>("date");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [pendingCancellation, setPendingCancellation] = useState<{
    itemId: string;
    url: string;
  } | null>(null);
  const sortedItems = useMemo(
    () =>
      items ? sortTrackedItems(items, sortField, sortDirection) : undefined,
    [items, sortDirection, sortField],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      assertLinkUrl(url);
    } catch {
      setFormError("Enter a valid HTTP or HTTPS link.");
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(url, initialStatus);
      setUrl("");
      setInitialStatus("todo");
    } catch (cause) {
      setFormError(
        cause instanceof ConvexError && typeof cause.data === "string"
          ? cause.data
          : cause instanceof Error
            ? cause.message
            : "The favorite could not be added.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleStatusSelection(
    item: TrackedItem,
    status: TrackedItemStatus,
  ) {
    if (status === item.status) {
      return;
    }
    if (status === "cancelled") {
      setPendingCancellation({
        itemId: item._id,
        url: item.uniqueId,
      });
      return;
    }
    void onStatusChange(item._id, status);
  }

  async function confirmCancellation() {
    if (!pendingCancellation) {
      return;
    }
    await onStatusChange(pendingCancellation.itemId, "cancelled");
    setPendingCancellation(null);
  }

  return (
    <Box className="app-shell">
      <Container component="main" maxWidth="lg" className="page-container">
        <Stack spacing={{ xs: 4, md: 6 }}>
          <Stack
            component="header"
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Typography component="h1" variant="h3" sx={{ fontWeight: 700 }}>
              My favorite links
            </Typography>
            <Stack spacing={1} sx={{ alignItems: { xs: "stretch", sm: "flex-end" } }}>
              {userLabel ? (
                <Typography color="text.secondary" variant="body2">
                  Signed in as {userLabel}
                </Typography>
              ) : null}
              <Button
                component="a"
                href="https://feneky.com/links"
                rel="noreferrer"
                target="_blank"
                variant="outlined"
                sx={{ textTransform: "none" }}
              >
                Find your next thing
              </Button>
              <Button
                component="a"
                href="graph"
                size="small"
                sx={{ textTransform: "none" }}
              >
                View favorites graph
              </Button>
              {onSignOut ? (
                <Button
                  onClick={onSignOut}
                  size="small"
                  sx={{ textTransform: "none" }}
                >
                  Sign out
                </Button>
              ) : null}
            </Stack>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Paper
            component="form"
            onSubmit={handleSubmit}
            variant="outlined"
            className="add-form"
          >
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              Add a favorite
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                label="Link URL"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/article"
                required
                size="small"
                slotProps={{ htmlInput: { "aria-label": "Link URL" } }}
                type="url"
                value={url}
              />
              <FormControl size="small" sx={{ minWidth: { sm: 180 } }}>
                <InputLabel htmlFor="initial-status-select">
                  Initial status
                </InputLabel>
                <Select
                  native
                  inputProps={{ id: "initial-status-select" }}
                  label="Initial status"
                  onChange={(event) =>
                    setInitialStatus(event.target.value as TrackedItemStatus)
                  }
                  value={initialStatus}
                >
                  {trackedItemStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </Select>
              </FormControl>
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

          <Box component="section" aria-labelledby="saved-links-title">
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{
                alignItems: { xs: "stretch", md: "flex-end" },
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography component="h2" id="saved-links-title" variant="h5">
                  Saved links
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {items ? `Showing ${items.length} links` : "Loading your links"}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ alignItems: { sm: "center" } }}
              >
                {sortedItems && sortedItems.length > 0 ? (
                  <>
                    <FormControl size="small" sx={{ minWidth: 156 }}>
                      <InputLabel htmlFor="sort-field-select">Sort by</InputLabel>
                      <Select
                        native
                        inputProps={{ id: "sort-field-select" }}
                        label="Sort by"
                        onChange={(event) =>
                          setSortField(
                            event.target.value as TrackedItemSortField,
                          )
                        }
                        value={sortField}
                      >
                        <option value="date">Modified date</option>
                        <option value="id">ID</option>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 136 }}>
                      <InputLabel htmlFor="sort-direction-select">
                        Direction
                      </InputLabel>
                      <Select
                        native
                        inputProps={{ id: "sort-direction-select" }}
                        label="Direction"
                        onChange={(event) =>
                          setSortDirection(event.target.value as SortDirection)
                        }
                        value={sortDirection}
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </Select>
                    </FormControl>
                  </>
                ) : null}
                <Button
                  aria-expanded={listExpanded}
                  onClick={() => setListExpanded((expanded) => !expanded)}
                  size="small"
                >
                  {listExpanded ? "Collapse list" : "Expand list"}
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ mt: 2 }} />

            {listExpanded ? (
              sortedItems === undefined ? (
                <Stack spacing={1.5} sx={{ alignItems: "center", py: 7 }}>
                  <CircularProgress size={28} />
                  <Typography color="text.secondary" variant="body2">
                    Loading…
                  </Typography>
                </Stack>
              ) : sortedItems.length === 0 ? (
                <Box sx={{ py: 7, textAlign: "center" }}>
                  <Typography>No favorites yet</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Add a link above to start tracking it.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {sortedItems.map((item) => (
                    <ListItem disablePadding key={item._id}>
                      <Box className="link-row">
                        <Typography
                          component="a"
                          color="primary"
                          href={item.uniqueId}
                          rel="noreferrer"
                          target="_blank"
                          variant="h6"
                          className="link-title"
                        >
                          {item.uniqueId}
                        </Typography>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 1, sm: 2 }}
                          sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
                        >
                          <FormControl size="small" sx={{ minWidth: 148 }}>
                            <Select
                              native
                              inputProps={{
                                "aria-label": `Status for ${item.uniqueId}`,
                              }}
                              onChange={(event) =>
                                handleStatusSelection(
                                  item,
                                  event.target.value as TrackedItemStatus,
                                )
                              }
                              value={item.status}
                            >
                              {trackedItemStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabel(status)}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography color="text.secondary" variant="body2">
                            Updated {readableDate(item.dateUpdated)}
                          </Typography>
                        </Stack>
                      </Box>
                      <Divider />
                    </ListItem>
                  ))}
                </List>
              )
            ) : null}
          </Box>
        </Stack>
      </Container>

      <Dialog
        aria-labelledby="cancel-dialog-title"
        onClose={() => setPendingCancellation(null)}
        open={pendingCancellation !== null}
      >
        <DialogTitle id="cancel-dialog-title">Cancel favorite?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will mark {pendingCancellation?.url} as cancelled. You can
            change its status again later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingCancellation(null)}>
            Keep current status
          </Button>
          <Button color="error" onClick={() => void confirmCancellation()}>
            Cancel favorite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
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

function FavoritesController() {
  const [userId] = useState(getOrCreateUserId);
  const [userReady, setUserReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, signOut } = useGoogleAuth();
  const ensureUser = useMutation(api.users.ensure);
  const addFavorite = useMutation(api.trackedItems.add);
  const updateFavoriteStatus = useMutation(api.trackedItems.updateStatus);
  const items = useQuery(api.trackedItems.list, userReady ? {} : "skip");

  useEffect(() => {
    void ensureUser({ proposedUserId: userId })
      .then(() => setUserReady(true))
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "User setup failed.");
      });
  }, [ensureUser, userId]);

  async function handleAdd(url: string, status: TrackedItemStatus) {
    setError(null);
    await ensureUser({ proposedUserId: userId });
    await addFavorite({ url, status });
  }

  async function handleStatusChange(
    itemId: string,
    status: TrackedItemStatus,
  ) {
    setError(null);
    try {
      await ensureUser({ proposedUserId: userId });
      await updateFavoriteStatus({
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
      onSignOut={signOut}
      onStatusChange={handleStatusChange}
      userLabel={profile?.email ?? profile?.name}
    />
  );
}

function GoogleSignInView() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { error, isGoogleReady } = useGoogleAuth();

  useEffect(() => {
    if (isGoogleReady && buttonRef.current) {
      renderGoogleSignInButton(buttonRef.current);
    }
  }, [isGoogleReady]);

  return (
    <Box className="app-shell">
      <Container component="main" maxWidth="sm" className="page-container">
        <Paper variant="outlined" sx={{ mt: 8, p: { xs: 3, sm: 5 } }}>
          <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center" }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
              My favorite links
            </Typography>
            <Typography color="text.secondary">
              Sign in to keep your favorites available when you return.
            </Typography>
            <div ref={buttonRef} />
            {!isGoogleReady ? <CircularProgress size={28} /> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

function LoadingApp() {
  return (
    <Box className="app-shell">
      <Container component="main" maxWidth="lg" className="page-container">
        <Stack spacing={1.5} sx={{ alignItems: "center", py: 7 }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" variant="body2">
            Checking sign-in…
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const path = window.location.pathname.replace(/\/+$/, "");

  if (isLoading) {
    return <LoadingApp />;
  }
  if (!isAuthenticated) {
    return <GoogleSignInView />;
  }

  return path.endsWith("/graph") ? (
    <Suspense
      fallback={
        <Box className="app-shell">
          <Container component="main" maxWidth="lg" className="page-container">
            <Stack spacing={1.5} sx={{ alignItems: "center", py: 7 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary" variant="body2">
                Loading graph…
              </Typography>
            </Stack>
          </Container>
        </Box>
      }
    >
      <KnowledgeGraphPage />
    </Suspense>
  ) : (
    <FavoritesController />
  );
}

export default App;
