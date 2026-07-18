import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";

const app = express();

const PORT = Number(process.env.PORT || 3001);
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

const requiredVariables = [
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_REDIRECT_URI",
  "SESSION_SECRET"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  })
);

/*
  Start Discord Login
*/
app.get("/auth/discord", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    scope: "identify"
  });

  res.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
});

/*
  Discord OAuth2 Callback
*/
app.get("/auth/discord/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res
      .status(400)
      .send("Missing Discord authorization code.");
  }

  try {
    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret:
            process.env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri:
            process.env.DISCORD_REDIRECT_URI
        })
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "Discord token error:",
        await tokenResponse.text()
      );

      return res
        .status(401)
        .send("Discord authorization failed.");
    }

    const token = await tokenResponse.json();

    const userResponse = await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `${token.token_type} ${token.access_token}`
        }
      }
    );

    if (!userResponse.ok) {
      return res
        .status(401)
        .send("Could not retrieve Discord user.");
    }

    const user = await userResponse.json();

    req.session.user = user;

    res.redirect(FRONTEND_URL);
  } catch (error) {
    console.error("Discord OAuth error:", error);

    res
      .status(500)
      .send("Discord login failed.");
  }
});

/*
  Get Currently Logged-In User
*/
app.get("/api/auth/me", (req, res) => {
  res.json({
    user: req.session.user || null
  });
});

/*
  Logout
*/
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true
    });
  });
});

/*
  Health Check
*/
app.get("/health", (req, res) => {
  res.json({
    online: true
  });
});

app.listen(PORT, () => {
  console.log(
    `FHP Database Discord backend running at http://localhost:${PORT}`
  );
});
