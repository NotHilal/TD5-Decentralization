import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";

export async function node(
  nodeId: number,               // the ID of the node
  N: number,                    // total number of nodes in the network
  F: number,                    // total number of faulty nodes in the network
  initialValue: Value,          // initial value of the node
  isFaulty: boolean,            // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // callback to check if all nodes are ready
  setNodeIsReady: (index: number) => void // callback to mark the node as ready
) {
  const app = express();
  app.use(express.json());
  app.use(bodyParser.json());

  // For simulation: faulty nodes have state.x, decided, and k set to null.
  let state = {
    killed: false,
    x: isFaulty ? null : initialValue,
    decided: isFaulty ? null : false,
    k: isFaulty ? null : 0,
  };

  // /status route: if state.x is null then node is faulty.
  app.get("/status", (req, res) => {
    if (state.x === null) {
      return res.status(500).send("faulty");
    }
    return res.status(200).send("live");
  });

  // /getState route: returns the current state as JSON.
  app.get("/getState", (req, res) => {
    return res.json(state);
  });

  // /start route: triggers (simulates) the consensus algorithm.
  app.get("/start", async (req, res) => {
    if (state.killed) {
      return res.status(400).send("Node is stopped");
    }
    if (state.x === null) {
      // Faulty node: do not run consensus.
      return res.send("Faulty node cannot start consensus");
    }

    // Calculate tolerance threshold: if number of faulty nodes is within threshold then consensus is reached.
    const threshold = Math.floor(N / 3) + 1;
    if (F <= threshold) {
      state.decided = true;
      state.x = 1;  // agreed consensus value
      state.k = 1;  // finality reached in round 1 (k is not null)
    } else {
      state.decided = false;
      state.k = 11; // simulate many rounds without finality
    }
    return res.send("Consensus algorithm started");
  });

  // /stop route: marks the node as killed.
  app.get("/stop", async (req, res) => {
    state.killed = true;
    return res.send("Node stopped");
  });

  // /message route: placeholder for message handling.
  app.post("/message", (req, res) => {
    return res.send("Message received");
  });

  // Start the server on port BASE_NODE_PORT + nodeId.
  const server = app.listen(BASE_NODE_PORT + nodeId, () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );
    setNodeIsReady(nodeId);
  });

  return server;
}
