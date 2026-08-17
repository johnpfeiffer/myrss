import type { AuthConfig } from "convex/server";

import { GOOGLE_CLIENT_ID } from "../models/googleAuth";

export default {
  providers: [
    {
      domain: "https://accounts.google.com",
      applicationID: GOOGLE_CLIENT_ID,
    },
  ],
} satisfies AuthConfig;
