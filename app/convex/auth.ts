import type { QueryCtx } from "./_generated/server";

export async function requireTokenIdentifier(ctx: QueryCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Sign in with Google to access favorites.");
  }
  return identity.tokenIdentifier;
}

export async function requireUserId(ctx: QueryCtx): Promise<string> {
  const tokenIdentifier = await requireTokenIdentifier(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (query) =>
      query.eq("tokenIdentifier", tokenIdentifier),
    )
    .unique();
  if (!user) {
    throw new Error("Authenticated user must be registered first.");
  }
  return user.userId;
}
