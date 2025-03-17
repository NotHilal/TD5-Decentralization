import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";

export async function node(
  nodeId: number,              // the ID of the node
  N: number,                   // total number of nodes in the network
  F: number,                   // number of faulty nodes in the network
  initialValue: Value,         // initial value of the node
  isFaulty: boolean,           // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // callback to check if all nodes are ready
  setNodeIsReady: (index: number) => void // callback to mark the node as ready
) {
  const app = express();
  app.use(express.json());
  app.use(bodyParser.json());

  // Define the node's state.
  // For faulty nodes, set x, decided and k to null.
  let state = {
    killed: false,
    x: isFaulty ? null : initialValue,
    decided: isFaulty ? null : false,
    k: isFaulty ? null : 0,
  };

  // /status route: healthy nodes respond with 200 and "live"
  // Faulty nodes (state.x is null) respond with 500 and "faulty"
  app.get("/status", (req, res) => {
    if (state.x === null) {
      return res.status(500).send("faulty");
    }
    return res.status(200).send("live");
  });

  // /getState route: returns the current state as a JSON object.
  app.get("/getState", (req, res) => {
    return res.json(state);
  });

  // /start route: triggers the consensus algorithm.
  // Here we simply return a message.
  app.get("/start", async (req, res) => {
    if (state.killed) {
      return res.status(400).send("Node is stopped");
    }
    // (Later, add logic here to start consensus rounds.)
    return res.send("Consensus algorithm started");
  });

  // /stop route: stops the consensus algorithm by marking the node as killed.
  app.get("/stop", async (req, res) => {
    state.killed = true;
    return res.send("Node stopped");
  });

  // /message route: allows nodes to receive messages.
  // Currently just acknowledges receipt.
  app.post("/message", (req, res) => {
    // (Later, update the state based on the message received.)
    return res.send("Message received");
  });

  // Start the server on the port BASE_NODE_PORT + nodeId.
  const server = app.listen(BASE_NODE_PORT + nodeId, () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );
    setNodeIsReady(nodeId);
  });

  return server;
}
