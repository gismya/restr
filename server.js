const express = require("express");
const cors = require("cors");
const { Server: WebSocketServer } = require("ws");
const http = require("http");
const port = 3000;

// Configure express as the web server
const app = express();
app.use(cors());
// Set the view engine to ejs
app.set("view engine", "ejs");
// Serve static files from the 'public' directory
app.use(express.static("public"));

const server = http.createServer(app);

const wsServer = new WebSocketServer({ server });
const apiKey =
  "lKxO_TBuC6uFqqSRx4sygTUDx10o7N3DjBuwcfLCamq0t-3tm4HwCMvBnzZ_qYtoiNqMQtsxNFf4fOiLd_TkFqQRzrm0c3Gz2hHk0zWkiVjAdTIp4HKqoth9WghDZHYx";

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/session", (req, res) => {
  res.render("session");
});
app.get("/options", (req, res) => {
  res.render("options");
});

// Yelp Proxy Endpoints
app.get("/restaurants", async (req, res) => {
  const { latitude, longitude, radius, price, openNow, offset } = req.query;
  const radiusString = radius ? `&radius=${radius}` : "";
  const priceString = price ? `&price=${price}` : "";

  const openNowString = openNow ? `&open_now=${openNow}` : "";
  const offsetString = offset ? `&offset=${offset}` : "";
  const filterStrings = `${radiusString}${priceString}${openNowString}${offsetString}`;
  try {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${latitude}&longitude=${longitude}${filterStrings}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Yelp data:", error);
    res.status(500).json({ error: "Failed to fetch Yelp data" });
  }
});
app.get("/restaurant-details", async (req, res) => {
  console.log();
  const { id } = req.query;
  try {
    const response = await fetch(`https://api.yelp.com/v3/businesses/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();
    console.log(data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Yelp data:", error);
    res.status(500).json({ error: "Failed to fetch Yelp data" });
  }
});

// Store the user selections per session
const selections = new Map();

// Store the users per session
const users = new Map();

function checkForMatch(restaurantId, sessionId) {
  const userVotes = selections.get(sessionId).get(restaurantId);

  // Check if two subscribers have said yes to the same restaurant
  if (userVotes.length >= 2) {
    const matchMessage = JSON.stringify({
      action: "match",
      restaurantId,
    });

    // Send a match message to the users who voted for the same restaurant
    for (const matchedUserId of userVotes) {
      const matchedUserSocket = users.get(sessionId).get(matchedUserId);
      matchedUserSocket.send(matchMessage);
    }

    // Remove the matched restaurant from the selections map
    selections.get(sessionId).delete(restaurantId);
  }
}

wsServer.on("connection", (socket) => {
  console.log("Client connected");

  // Handle messages from clients
  socket.on("message", (message) => {
    const { action, restaurantId, userId, sessionId } = JSON.parse(message);

    if (action === "vote") {
      if (!users.has(sessionId)) {
        users.set(sessionId, new Map());
      }
      users.get(sessionId).set(userId, socket);

      if (!selections.has(sessionId)) {
        selections.set(sessionId, new Map());
      }

      const sessionSelections = selections.get(sessionId);
      if (!sessionSelections.has(restaurantId)) {
        sessionSelections.set(restaurantId, []);
      }

      const userVotes = sessionSelections.get(restaurantId);
      userVotes.push(userId);

      checkForMatch(restaurantId, sessionId);
    }
  });

  // Handle socket close
  socket.on("close", () => {
    console.log("Client disconnected");
    // Remove the disconnected user from the users map
    const disconnectedUserId = [...users.entries()].find(
      ([_, userSocket]) => userSocket === socket
    )?.[0];
    if (disconnectedUserId) {
      users.delete(disconnectedUserId);
    }
  });
});

server.listen(port, () => {
  console.log(`Combined server listening on port ${port}`);
});
